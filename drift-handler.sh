#!/bin/bash
# ==============================================================================
# wind-ui drift handler
#
# Adapted from a Google AI Studio (GAIS) auditor utility. The original script
# assumed a single-commit-per-session GAIS workflow with hardcoded paths that
# did not match this repository. This version is corrected for the wind-ui
# layout: types live in src/types/{wind,tackle,theme,toast}.ts, the API client
# is src/services/api.ts, the dev server is server.ts, and work happens on
# dated dev-* branches (not directly on main).
#
# What this script does:
#   1. Fetches origin and diffs the local HEAD against origin/main across the
#      core API surface (server.ts, src/types/*.ts, src/services/api.ts, and
#      the component tree under src/components/).
#   2. If drift is detected, compiles a structured markdown payload at
#      $AUDITOR_PAYLOAD containing the raw diffs, ready to feed an LLM auditor
#      prompt for contract/envelope/routing analysis.
#   3. Syncs the local main ref (non-destructively) and prints the next-step
#      hint to start a fresh dev branch. It does NOT hard-reset the current
#      branch (the live-mode commits on dev-* branches must be preserved) and
#      it does NOT invoke a GUI editor.
# ==============================================================================
set -euo pipefail

# ------------------------------------------------------------------------------
# Configuration
# ------------------------------------------------------------------------------
APP_NAME="Wind UI"
SCHEMA_DIR="src/types"
API_CLIENT="src/services/api.ts"
FRONTEND_DIR="src/components"
PORT_FILE="server.ts"
TARGET_PORT="4209"
AUDITOR_PAYLOAD="gais_auditor_payload.md"

# Drift baseline. The upstream main branch is the contract baseline for this
# fork; the live-mode work lives on dated dev-* branches ahead of it. We diff
# the working tree against origin/main to surface upstream contract changes.
BASE_BRANCH="${BASE_BRANCH:-origin/main}"

# ------------------------------------------------------------------------------
# 1. Fetch upstream and detect drift
# ------------------------------------------------------------------------------
echo "Checking upstream for $APP_NAME contract drift (baseline: $BASE_BRANCH)..."
git fetch origin --quiet

# Surface updates across the core API layer. The component glob catches any
# renamed/added .tsx files automatically (git diff --name-only with a dir
# prefix recurses).
IF_CHANGES=$(git diff "$BASE_BRANCH" HEAD --name-only -- \
    "$PORT_FILE" \
    "$API_CLIENT" \
    "$SCHEMA_DIR" \
    "$FRONTEND_DIR")

if [ -n "$IF_CHANGES" ]; then
    echo "⚠️  Upstream drift detected for $APP_NAME. Compiling auditor payload..."

    # 2. Compose the auditor context directive
    {
        cat <<EOF
# AUDITOR PROMPT CONTEXT: APPLICATION DRIFT DETECTED IN [$APP_NAME]
System Directive: You are the designated API Auditor for the $APP_NAME system suite.
Analyze the raw structural git diffs attached below between the $BASE_BRANCH baseline
and the local working branch.

## TARGET OBJECTIVES:
1. CONTRACT DRIFT: Identify newly declared or altered TypeScript interfaces in $SCHEMA_DIR/*.ts.
2. ENVELOPE MISMATCHES: Audit payload keys vs actual routing parameters in $API_CLIENT.
3. UNIMPLEMENTED ROUTING: Explicitly call out components making api requests to paths
   that do not exist or differ from definitions in $PORT_FILE.
4. SPECIFICATION OUTPUT: Draft the structured critique payload required to bring the
   frontend and backend back into lockstep synchronization.

---

EOF

        # 3. Backend route surface (server.ts)
        echo "### 1. BACKEND ROUTE SURFACE CHANGES ($PORT_FILE)"
        echo '```diff'
        git diff "$BASE_BRANCH" HEAD -U5 -- "$PORT_FILE" || \
            echo "(no changes to $PORT_FILE)"
        echo '```'
        echo

        # 4. API client envelope (src/services/api.ts)
        echo "### 2. API CLIENT ENVELOPE CHANGES ($API_CLIENT)"
        echo '```diff'
        git diff "$BASE_BRANCH" HEAD -U5 -- "$API_CLIENT" || \
            echo "(no changes to $API_CLIENT)"
        echo '```'
        echo

        # 5. Type contract changes (src/types/*.ts)
        echo "### 3. CORE TYPE CONTRACT CHANGES ($SCHEMA_DIR)"
        echo '```diff'
        git diff "$BASE_BRANCH" HEAD -U5 -- "$SCHEMA_DIR" || \
            echo "(no changes to $SCHEMA_DIR)"
        echo '```'
        echo

        # 6. Frontend component API usage. Capture context around `api.` calls
        #    (the wind-ui client uses a singleton `api` from src/services/api,
        #    not a bare `apiRequest(...)` helper, so grep for `api.`).
        echo "### 4. FRONTEND VIEW COMPONENT CALL ENVELOPES ($FRONTEND_DIR)"
        echo '```diff'
        git diff "$BASE_BRANCH" HEAD -U3 -- "$FRONTEND_DIR" | \
            grep -A 3 -B 3 'api\.' || \
            echo "No component api.* call alterations found."
        echo '```'
    } > "$AUDITOR_PAYLOAD"

    echo "✅ Auditor context payload compiled at: $AUDITOR_PAYLOAD"
else
    echo "✅ No core contract drift detected for $APP_NAME against $BASE_BRANCH."
fi

# ------------------------------------------------------------------------------
# 7. Workspace reset hint (non-destructive)
#
# The original script ran `git reset --hard HEAD~1 && git pull origin main &&
# git checkout -b dev-<ts>` on the current branch. On this fork that would
# discard the live-mode commits that exist only on dated dev-* branches. We
# instead sync the main ref and print the next-step command; the operator
# decides whether to branch from main or continue on the current dev branch.
# ------------------------------------------------------------------------------
echo
echo "Syncing local main ref (origin/main)..."
git fetch origin main:main --quiet 2>/dev/null || \
    git update-ref refs/heads/main origin/main

NEW_DEV_BRANCH="dev-$(date +%Y%m%d%H%M%S)"
echo
echo "Next step — start a fresh dev branch from main:"
echo "    git checkout main && git checkout -b \"$NEW_DEV_BRANCH\""
echo
echo "Or continue on the current branch ($(git rev-parse --abbrev-ref HEAD))."

# ------------------------------------------------------------------------------
# 8. Port configuration hint
#
# server.ts picks its port from process.env.PORT at runtime (mock → 3000,
# live → 4209). The original `sed -i 's/PORT = 3000/PORT = $TARGET_PORT/g'`
# was a no-op because no such literal exists in server.ts. The correct way to
# override the port is the PORT env var, set by the systemd unit / startup
# script via `--port $TARGET_PORT` or `PORT=$TARGET_PORT npm run dev`.
# ------------------------------------------------------------------------------
echo
echo "To run on the wind-ui target port ($TARGET_PORT):"
echo "    PORT=$TARGET_PORT VITE_WIND_MODE=live npm run dev"
