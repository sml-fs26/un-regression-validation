#!/usr/bin/env bash
# Stage 2 — Implementation orchestrator.
#
# Steps 1..14 from DESIGN.md §Stage 2 handoff → Build order, run sequentially.
# Each step: implementer writes code, reviewer validates, revise up to 2x,
# then marker .stage2/step-N.done is written on approval (by the reviewer).
# A failed step halts the pipeline (does NOT cascade).
#
# Resumable: re-run to pick up from the first step lacking its marker.
#
# Lessons baked in from Stages 0/1:
#   - --permission-mode bypassPermissions so implementer/reviewer can run npm/vite/etc.
#   - retry-on-transient-timeout wrapper
#   - no `set -e` ambush

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROMPTS="$REPO_ROOT/orchestration/prompts"
STAGE2_DIR="$REPO_ROOT/.stage2"
LOG_DIR="$STAGE2_DIR/logs"

mkdir -p "$STAGE2_DIR" "$LOG_DIR"

for prereq in "$REPO_ROOT/BRAINSTORM.md" "$REPO_ROOT/DESIGN.md"; do
  if [ ! -s "$prereq" ]; then
    echo "!! prerequisite missing or empty: $prereq"
    exit 1
  fi
done

# --- Step definitions (title used in prompts / logs) ---

declare -a STEP_TITLES=(
  ""  # index 0 unused
  "Typography system + color palette + lint rules"
  "<HeartbeatTicker> component + Storybook + Playwright snapshots"
  "<RoleColumn> + <RoleCell> + <RoleLabeledCounter> with reactive store"
  "<PiCellComposition> prototype at 1x / 2x / mobile"
  "Precompute pipeline (Python) producing all /static/data/ JSON"
  "CH1 chapter assembled around heartbeat"
  "CH2 chapter (buckle + scrollbar overlay with Safari fallback)"
  "CH3 chapter (α-scrub + strikethrough + ticker contraction)"
  "CH4 chapter (β̂ row + objection queue + JOIN)"
  "CH5 chapter excluding recast"
  "Recast precompute pipeline (254 country bundles)"
  "CH5 recast bar OR recast fallback (build-time file-count decides)"
  "<ScrollGate> (cold-session Playwright test)"
  "Visual regression baseline + Lighthouse CI + bundle-budget green"
)
NUM_STEPS=$(( ${#STEP_TITLES[@]} - 1 ))

# --- Helpers ---

is_done() { [ -f "$STAGE2_DIR/step-$1.done" ]; }

run_claude() {
  # args: prompt_file extra_prompt log_file
  local prompt_file="$1" extra_prompt="$2" log_file="$3"
  claude -p \
    --permission-mode bypassPermissions \
    --system-prompt-file "$prompt_file" \
    "$extra_prompt" \
    >>"$log_file" 2>&1
  return $?
}

# Retry run_claude on transient API failures (Stream idle timeout, etc.).
# Treats rc != 0 as transient if the log tail mentions API Error or Stream idle.
run_claude_with_retry() {
  local prompt_file="$1" extra_prompt="$2" log_file="$3" max_tries="${4:-3}"
  local i=1
  while [ "$i" -le "$max_tries" ]; do
    run_claude "$prompt_file" "$extra_prompt" "$log_file"
    local rc=$?
    if [ "$rc" -eq 0 ]; then
      return 0
    fi
    # Is the failure transient? Look at the log tail for known signatures.
    local tail_txt
    tail_txt=$(tail -n 5 "$log_file" 2>/dev/null || true)
    if echo "$tail_txt" | grep -qiE "Stream idle timeout|API Error|rate.?limit|ECONNRESET|connection reset|network error"; then
      echo "   · transient API failure (try $i/$max_tries): $(echo "$tail_txt" | tail -n 1 | head -c 120)" | tee -a "$log_file"
      echo "--- retry $((i + 1))/$max_tries ---" >>"$log_file"
      sleep 8
      i=$((i + 1))
      continue
    fi
    # Non-transient — return immediately.
    return "$rc"
  done
  echo "   !! retries exhausted ($max_tries) on $log_file" | tee -a "$log_file"
  return 1
}

run_implementer() {
  local n="$1" title="$2" revision_note="$3"
  local log="$LOG_DIR/step-${n}-impl.log"
  local revnote=""
  if [ -n "$revision_note" ]; then
    revnote="
REVIEWER VETOED THE PREVIOUS ATTEMPT. Address these objections exactly:
$revision_note
"
  fi
  local prompt="You are working on Stage 2 Step ${n}/${NUM_STEPS}: \"${title}\".

Repo root: ${REPO_ROOT}
Read DESIGN.md's §Stage 2 handoff → Build order item ${n}, plus the acceptance criteria for this step (follow the links from that list).

Implement only this step. Run the tests. When done, write .stage2/STAGE2-STEP-${n}-REPORT.md with the claims the reviewer will verify.
${revnote}"
  echo "--- implementer step $n (log: $log) ---" | tee -a "$log"
  run_claude_with_retry "$PROMPTS/stage2-implementer.md" "$prompt" "$log" 3
  return $?
}

run_reviewer() {
  local n="$1" title="$2"
  local log="$LOG_DIR/step-${n}-review.log"
  local prompt="You are reviewing Stage 2 Step ${n}/${NUM_STEPS}: \"${title}\".

Repo root: ${REPO_ROOT}
Read DESIGN.md to learn the acceptance criteria for step ${n}. Read .stage2/STAGE2-STEP-${n}-REPORT.md but do not trust it — verify everything independently by running commands and reading files.

Your verdict is a single final line:
- 'APPROVED.' if every check passes (and then touch .stage2/step-${n}.done yourself via Bash).
- 'VETO: <semicolon-separated concrete objections>' otherwise.

The APPROVED / VETO line must be the LAST line of your stdout so the orchestrator can grep it."
  : >"$log"
  run_claude_with_retry "$PROMPTS/stage2-reviewer.md" "$prompt" "$log" 3
  return $?
}

# --- Main loop ---

MAX_REVISIONS_PER_STEP=2

for n in $(seq 1 "$NUM_STEPS"); do
  title="${STEP_TITLES[$n]}"
  if is_done "$n"; then
    echo ">>> step $n already done (marker present): $title"
    continue
  fi

  echo ">>> step $n/$NUM_STEPS: $title"
  revision_note=""
  approved=0

  for attempt in 0 1 2; do
    if [ "$attempt" -eq 0 ]; then
      echo "   · implementer: first pass"
    else
      echo "   · implementer: revision $attempt of $MAX_REVISIONS_PER_STEP"
    fi
    if ! run_implementer "$n" "$title" "$revision_note"; then
      echo "   !! implementer exited non-zero on step $n attempt $attempt. See $LOG_DIR/step-${n}-impl.log"
      break
    fi

    echo "   · reviewer"
    if ! run_reviewer "$n" "$title"; then
      echo "   !! reviewer exited non-zero on step $n attempt $attempt. See $LOG_DIR/step-${n}-review.log"
      break
    fi

    if is_done "$n"; then
      echo ">>> step $n approved on attempt $attempt"
      approved=1
      break
    fi

    last_line=$(tail -n 1 "$LOG_DIR/step-${n}-review.log" 2>/dev/null || true)
    if echo "$last_line" | grep -q "^APPROVED"; then
      # Reviewer approved but didn't touch marker. Touch it for them.
      touch "$STAGE2_DIR/step-${n}.done"
      echo ">>> step $n approved on attempt $attempt (marker rescued)"
      approved=1
      break
    fi

    if echo "$last_line" | grep -q "^VETO"; then
      revision_note="${last_line#VETO:}"
      echo "   · veto: ${revision_note:0:200}..."
      continue
    fi

    echo "   !! reviewer produced no APPROVED / VETO line on step $n attempt $attempt. Last line: ${last_line:0:200}"
    break
  done

  if [ "$approved" -ne 1 ]; then
    echo "!! step $n did not land after $((MAX_REVISIONS_PER_STEP + 1)) attempts. Halting pipeline."
    echo "   Inspect logs in $LOG_DIR/. Fix manually or adjust DESIGN.md, then re-run."
    exit 2
  fi
done

echo ">>> all $NUM_STEPS steps approved. Stage 2 complete."
