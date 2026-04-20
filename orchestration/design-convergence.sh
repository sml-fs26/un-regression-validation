#!/usr/bin/env bash
# Stage 1 — Design Convergence orchestrator.
#
# Architect reads BRAINSTORM.md and writes DESIGN.md. DA reviews DESIGN.md;
# if vetoed, architect revises (max 2 revision cycles).
#
# Lessons baked in from Stage 0:
#   - --permission-mode acceptEdits so Write works in claude -p
#   - retry on transient claude -p failures (stream-idle timeouts)
#   - no `set -e` ambush: we handle exit codes explicitly
#
# Usage:
#   ./orchestration/design-convergence.sh

set -uo pipefail  # no -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROMPTS="$REPO_ROOT/orchestration/prompts"
OUT_DIR="$REPO_ROOT/brainstorm-output"
DESIGN_FILE="$REPO_ROOT/DESIGN.md"
BRAINSTORM_FILE="$REPO_ROOT/BRAINSTORM.md"

mkdir -p "$OUT_DIR"

if [ ! -s "$BRAINSTORM_FILE" ]; then
  echo "!! $BRAINSTORM_FILE missing or empty. Run Stage 0 first."
  exit 1
fi

# --- helpers ---

file_nonempty_and_substantial() {
  local f="$1" min="${2:-2000}"
  [ -s "$f" ] || return 1
  local n; n=$(wc -c <"$f")
  [ "$n" -ge "$min" ] || return 1
  grep -qi "API Error" "$f" && return 1
  return 0
}

run_architect() {
  local prompt="$1" errfile="$2"
  claude -p \
    --permission-mode acceptEdits \
    --system-prompt-file "$PROMPTS/design-convergence-architect.md" \
    "$prompt" \
    >/dev/null 2>"$errfile"
  return $?
}

retry_architect() {
  local prompt="$1" errfile="$2" attempts="${3:-3}"
  local i=1
  while [ "$i" -le "$attempts" ]; do
    echo ">>> architect attempt $i/$attempts"
    if run_architect "$prompt" "$errfile" && file_nonempty_and_substantial "$DESIGN_FILE"; then
      return 0
    fi
    echo "   !! architect attempt $i failed (rc=$?, DESIGN.md size=$( [ -f "$DESIGN_FILE" ] && wc -c <"$DESIGN_FILE" || echo 0 ))"
    i=$((i + 1))
    sleep 5
  done
  return 1
}

run_da() {
  local cycle="$1"
  claude -p \
    --system-prompt-file "$PROMPTS/design-convergence-devils-advocate.md" \
    "Review $DESIGN_FILE against $BRAINSTORM_FILE. If you wish to veto, output a single line starting with 'VETO:' followed by specific objections separated by semicolons. Otherwise output a single line: 'APPROVED.'" \
    2>"$OUT_DIR/design-da-${cycle}.err"
}

# --- Step 1: architect writes DESIGN.md ---

echo ">>> architect writing DESIGN.md"
ARCH_PROMPT="Read $BRAINSTORM_FILE and write $DESIGN_FILE per the structure in your persona prompt. Use the Write tool to create the file — do not just describe it on stdout."
if ! retry_architect "$ARCH_PROMPT" "$OUT_DIR/design-arch.err" 3; then
  echo "!! architect failed after 3 attempts; see $OUT_DIR/design-arch.err"
  exit 1
fi
echo ">>> DESIGN.md written ($(wc -c <"$DESIGN_FILE") bytes)"

# --- Step 2: DA review, up to 2 revision cycles ---

for cycle in 1 2; do
  echo ">>> Devil's Advocate review (cycle $cycle)"
  verdict=$(run_da "$cycle")
  echo "$verdict"
  if echo "$verdict" | grep -q "^APPROVED"; then
    echo ">>> DA approved. Stage 1 complete."
    exit 0
  fi
  echo ">>> architect revising in response to DA veto"
  REV_PROMPT="Revise $DESIGN_FILE to address the following DA objections (adopt OR add an inline one-paragraph counter-argument beneath the relevant spec block citing why the committee judged it sufficient): $verdict"
  if ! retry_architect "$REV_PROMPT" "$OUT_DIR/design-arch-rev-${cycle}.err" 3; then
    echo "!! architect revision cycle $cycle failed after 3 attempts"
    exit 1
  fi
  echo ">>> revision cycle $cycle complete ($(wc -c <"$DESIGN_FILE") bytes)"
done

echo ">>> DA veto exhausted (2 cycles). Third revision ships as-is. Stage 1 complete."
