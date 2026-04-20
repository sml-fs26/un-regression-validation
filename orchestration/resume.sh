#!/usr/bin/env bash
# Resume Stage 0 brainstorm from the round-9 partial state.
# Retries the 3 agents whose round-9 files are API-error stubs, then appends
# round 9 to transcript, runs round 10, synthesizes, and does DA review.

set -uo pipefail  # no -e: we handle retries ourselves

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROMPTS="$REPO_ROOT/orchestration/prompts"
OUT_DIR="$REPO_ROOT/brainstorm-output"
TRANSCRIPT="$OUT_DIR/transcript.md"

AGENTS=(information-designer interaction-designer aesthete pedagogue devils-advocate)

is_stub() {
  local f="$1"
  [ ! -s "$f" ] && return 0
  local n
  n=$(wc -c <"$f")
  [ "$n" -lt 200 ] && return 0
  grep -qi "API Error" "$f" && return 0
  return 1
}

run_agent() {
  local round="$1" rtype="$2" agent="$3"
  local sysprompt="$PROMPTS/brainstorm-${agent}.md"
  local out="$OUT_DIR/round-${round}-${agent}.md"
  echo ">>> agent ${agent} round ${round} (${rtype})"
  claude -p \
    --system-prompt-file "$sysprompt" \
    "Round ${round} of 10. Round type: ${rtype}.

Anti-early-convergence rule: no agent may declare CONVERGED before round 8.

Full transcript so far follows. Read it, then post your contribution per the output format in your persona prompt.

---
$(cat "$TRANSCRIPT")
---" >"$out" 2>"${out}.err"
  local rc=$?
  if [ "$rc" -ne 0 ] || is_stub "$out"; then
    echo "   !! agent ${agent} round ${round} failed (rc=$rc, stub=$(is_stub "$out" && echo yes || echo no))"
    return 1
  fi
  rm -f "${out}.err"
  return 0
}

retry_agent() {
  local round="$1" rtype="$2" agent="$3" attempts="${4:-3}"
  local i=1
  while [ "$i" -le "$attempts" ]; do
    echo ">>> attempt $i/$attempts for ${agent} round ${round}"
    if run_agent "$round" "$rtype" "$agent"; then
      return 0
    fi
    i=$((i + 1))
    sleep 5
  done
  return 1
}

append_round() {
  local round="$1"
  for agent in "${AGENTS[@]}"; do
    local f="$OUT_DIR/round-${round}-${agent}.md"
    if is_stub "$f"; then
      echo "[skipping stub for round ${round} ${agent}]"
      continue
    fi
    cat "$f" >>"$TRANSCRIPT"
    echo -e "\n---\n" >>"$TRANSCRIPT"
  done
}

# --- Round 9 recovery ---
echo ">>> recovering round 9"
ROUND9_RTYPE="Synthesis"
for agent in "${AGENTS[@]}"; do
  f="$OUT_DIR/round-9-${agent}.md"
  if is_stub "$f"; then
    retry_agent 9 "$ROUND9_RTYPE" "$agent" 3 || echo "   ** giving up on ${agent} round 9; will skip"
  fi
done

# --- Append round 9 to transcript (skipping any remaining stubs) ---
echo ">>> appending round 9 to transcript"
append_round 9

# --- Round 10 (Defense) ---
echo ">>> Round 10 (Defense)"
for agent in "${AGENTS[@]}"; do
  retry_agent 10 "Defense" "$agent" 3 || echo "   ** giving up on ${agent} round 10; will skip"
done
append_round 10

# --- Synthesize ---
echo ">>> Synthesizing BRAINSTORM.md"
claude -p \
  --system-prompt-file "$PROMPTS/brainstorm-synthesizer.md" \
  "Read the full transcript at $TRANSCRIPT and write BRAINSTORM.md to $REPO_ROOT/BRAINSTORM.md per the structure in your persona prompt." \
  2>"$OUT_DIR/synth.err"

# --- DA review, max 2 revision cycles ---
for cycle in 1 2; do
  echo ">>> Devil's Advocate review (cycle $cycle)"
  verdict=$(claude -p \
    --system-prompt-file "$PROMPTS/brainstorm-devils-advocate.md" \
    "Review $REPO_ROOT/BRAINSTORM.md. If you wish to veto, output a single line starting with 'VETO:' followed by specific objections. Otherwise output a single line: 'APPROVED.'" \
    2>"$OUT_DIR/da-${cycle}.err")
  if echo "$verdict" | grep -q "^APPROVED"; then
    echo ">>> DA approved. Stage 0 complete."
    exit 0
  fi
  echo "$verdict"
  echo ">>> Synthesizer revising in response to DA veto"
  claude -p \
    --system-prompt-file "$PROMPTS/brainstorm-synthesizer.md" \
    "Revise $REPO_ROOT/BRAINSTORM.md to address the following DA objections (adopt OR document overruling with counter-argument):
$verdict" \
    2>"$OUT_DIR/synth-rev-${cycle}.err"
done

echo ">>> DA veto exhausted (2 cycles). Third revision ships as-is. Stage 0 complete."
