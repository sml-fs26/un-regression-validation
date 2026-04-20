#!/usr/bin/env bash
# Stage 0 — Creative Brainstorming Committee orchestrator
#
# Runs N rounds of a 5-agent committee (4 perspectives + 1 Devil's Advocate),
# appending each round's output to brainstorm-output/transcript.md.
# After round 10 (or later), spawns the synthesizer to produce BRAINSTORM.md.
# DA then reviews; if vetoed, synthesizer revises (max 2 revision cycles).
#
# Requires: `claude` CLI on PATH, configured for non-interactive (-p) calls.
# This script is a deliverable for reproducibility. The brainstorm itself
# in this session was driven by the orchestrator agent using Claude Code's
# native Agent tool for parallel fan-out, with the same prompts and gating.
#
# Usage:
#   ./orchestration/brainstorm.sh           # default: 10 rounds, extend by 3 if not converged
#   ROUNDS=15 ./orchestration/brainstorm.sh # explicit round count

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROMPTS="$REPO_ROOT/orchestration/prompts"
OUT_DIR="$REPO_ROOT/brainstorm-output"
TRANSCRIPT="$OUT_DIR/transcript.md"

ROUNDS="${ROUNDS:-10}"
HARD_CEILING=19

mkdir -p "$OUT_DIR"
: > "$TRANSCRIPT"

AGENTS=(
  "information-designer"
  "interaction-designer"
  "aesthete"
  "pedagogue"
  "devils-advocate"
)

round_type() {
  local n="$1"
  if   [ "$n" -le 2 ]; then echo "Divergence"
  elif [ "$n" -le 7 ]; then echo "Cross-pollination"
  elif [ "$n" -le 9 ]; then echo "Synthesis"
  else                      echo "Defense"
  fi
}

run_round() {
  local round="$1"
  local rtype
  rtype="$(round_type "$round")"
  echo ">>> Round $round ($rtype)"

  # Spawn 5 agents in parallel; each reads the running transcript.
  local pids=()
  for agent in "${AGENTS[@]}"; do
    {
      local sysprompt="$PROMPTS/brainstorm-${agent}.md"
      local injected="$OUT_DIR/round-${round}-${agent}.md"
      claude -p \
        --system-prompt-file "$sysprompt" \
        "Round ${round} of $ROUNDS. Round type: ${rtype}.

Anti-early-convergence rule: no agent may declare CONVERGED before round 8.

Full transcript so far follows. Read it, then post your contribution per the output format in your persona prompt.

---
$(cat "$TRANSCRIPT")
---" > "$injected"
    } &
    pids+=($!)
  done

  for pid in "${pids[@]}"; do wait "$pid"; done

  for agent in "${AGENTS[@]}"; do
    cat "$OUT_DIR/round-${round}-${agent}.md" >> "$TRANSCRIPT"
    echo -e "\n---\n" >> "$TRANSCRIPT"
  done
}

convergence_gate() {
  # Returns 0 if the gate is met, 1 otherwise.
  # Gate: every chapter has >=3 candidate wow-moments AND DA has stamped >=1 idea per chapter as "not generic"
  # AND >=1 cross-cutting visual signature exists.
  # In this script we approximate via simple grep heuristics; the synthesizer
  # makes the final call.
  for ch in CH1 CH2 CH3 CH4 CH5; do
    local count
    count=$(grep -c "★" "$TRANSCRIPT" | head -n1)
    [ "${count:-0}" -ge 3 ] || return 1
  done
  grep -q "X-CUT" "$TRANSCRIPT" || return 1
  return 0
}

# Run the initial rounds
for r in $(seq 1 "$ROUNDS"); do
  run_round "$r"
done

# Extend by 3 if not converged, hard ceiling 19
while ! convergence_gate; do
  if [ "$ROUNDS" -ge "$HARD_CEILING" ]; then
    echo "!! Hit hard ceiling of $HARD_CEILING rounds without convergence. Proceeding to synthesis anyway."
    break
  fi
  next_end=$((ROUNDS + 3))
  if [ "$next_end" -gt "$HARD_CEILING" ]; then next_end="$HARD_CEILING"; fi
  for r in $(seq $((ROUNDS + 1)) "$next_end"); do
    run_round "$r"
  done
  ROUNDS="$next_end"
done

# Synthesize
echo ">>> Synthesizing BRAINSTORM.md"
claude -p \
  --system-prompt-file "$PROMPTS/brainstorm-synthesizer.md" \
  "Read the full transcript at $TRANSCRIPT and write BRAINSTORM.md to $REPO_ROOT/BRAINSTORM.md per the structure in your persona prompt."

# DA review (max 2 revision cycles)
for cycle in 1 2; do
  echo ">>> Devil's Advocate review (cycle $cycle)"
  verdict=$(claude -p \
    --system-prompt-file "$PROMPTS/brainstorm-devils-advocate.md" \
    "Review $REPO_ROOT/BRAINSTORM.md. If you wish to veto, output a single line starting with 'VETO:' followed by specific objections. Otherwise output a single line: 'APPROVED.'")
  if echo "$verdict" | grep -q "^APPROVED"; then
    echo ">>> DA approved. Stage 0 complete."
    exit 0
  fi
  echo "$verdict"
  echo ">>> Synthesizer revising in response to DA veto"
  claude -p \
    --system-prompt-file "$PROMPTS/brainstorm-synthesizer.md" \
    "Revise $REPO_ROOT/BRAINSTORM.md to address the following DA objections (adopt OR document overruling with counter-argument):
$verdict"
done

echo ">>> DA veto exhausted (2 cycles). Third revision ships as-is. Stage 0 complete."
