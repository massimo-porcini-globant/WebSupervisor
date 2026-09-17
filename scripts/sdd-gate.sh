#!/usr/bin/env bash
# sdd-gate.sh — Spec-Driven Development (SDD) Lifecycle Gate Engine
# Evaluates, advances, checks, and queries initiative lifecycle state and gates.
# Governed by CONSTITUTION.md and SDD-FLOW.md.
# Supports multi-vendor isolation, team namespaces, and role-based ownership.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
USER_CONTEXT_CONF="${PROJECT_INIT_KIT_USER_CONTEXT:-${XDG_CONFIG_HOME:-$HOME/.config}/project-init-kit/user-context.conf}"

usage() {
  cat <<'EOF'
Usage:
  sdd-gate.sh <command> [options]

Commands:
  init <initiative-id>        Initialize state.json and plan.md for a new initiative
  status [<initiative-id>]    Display status, gates, and ownership for an initiative
  check [<initiative-id>] [<gate>]
                              Verify required artifacts for a gate (exit 0=passed, 1=missing)
  advance <initiative-id> [<gate>] [--force]
                              Validate requirements and advance gate to PASSED
  is-passed <initiative-id> <gate>
                              Exit 0 if gate is passed or bypassed, 1 otherwise
  resolve                     Print JSON summary of detected initiative from git branch

Options:
  --project-dir <path>        Target project directory (default: current directory)
  --tier <feature|fix|chore>  Proportionality tier (default: auto-detected from prefix)
  --vendor <vendor>           Vendor namespace (e.g. globant)
  --role <role>               Operator role (architect, dev, product, test/qe, ops, security)
  --owner-name <name>         Owner full name
  --owner-email <email>       Owner email address
  --branch <branch>           Git branch name (default: current branch)
  --force                     Force gate advancement even if artifacts check fails

Examples:
  sdd-gate.sh init F01-payment-gateway --tier feature --vendor globant
  sdd-gate.sh status F01-payment-gateway
  sdd-gate.sh check F01-payment-gateway gate_2_architecture
  sdd-gate.sh advance F01-payment-gateway gate_2_architecture
  sdd-gate.sh is-passed F01-payment-gateway gate_2_architecture
EOF
  exit 1
}

# --- Context & Discovery Helpers ---------------------------------------------

PROJECT_DIR="$PWD"
INITIATIVE_ARG=""
GATE_ARG=""
TIER_ARG=""
VENDOR_ARG=""
ROLE_ARG=""
OWNER_NAME_ARG=""
OWNER_EMAIL_ARG=""
BRANCH_ARG=""
FORCE_FLAG=false
POSITIONAL_ARGS=()

parse_global_args() {
  local positional=()
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --project-dir)
        PROJECT_DIR="$2"
        shift 2
        ;;
      --tier)
        TIER_ARG="$2"
        shift 2
        ;;
      --vendor)
        VENDOR_ARG="$2"
        shift 2
        ;;
      --role)
        ROLE_ARG="$2"
        shift 2
        ;;
      --owner-name)
        OWNER_NAME_ARG="$2"
        shift 2
        ;;
      --owner-email)
        OWNER_EMAIL_ARG="$2"
        shift 2
        ;;
      --branch)
        BRANCH_ARG="$2"
        shift 2
        ;;
      --force)
        FORCE_FLAG=true
        shift
        ;;
      *)
        positional+=("$1")
        shift
        ;;
    esac
  done
  if [[ ${#positional[@]} -gt 0 ]]; then
    set -- "${positional[@]}"
    POSITIONAL_ARGS=("${positional[@]}")
  else
    set --
    POSITIONAL_ARGS=()
  fi
}

get_current_branch() {
  local dir="${1:-$PROJECT_DIR}"
  git -C "$dir" rev-parse --abbrev-ref HEAD 2>/dev/null || echo ""
}

# Infer vendor and initiative from git branch
# Supported patterns:
#   <vendor>/agent/<ID>-<slug> -> vendor=<vendor>, ID=<ID>-<slug>
#   agent/<ID>-<slug>          -> vendor="",       ID=<ID>-<slug>
#   <ID>-<slug>                -> vendor="",       ID=<ID>-<slug>
infer_from_branch() {
  local branch="$1"
  local vendor=""
  local id=""

  if [[ "$branch" =~ ^([^/]+)/agent/([^/]+)$ ]]; then
    vendor="${BASH_REMATCH[1]}"
    id="${BASH_REMATCH[2]}"
  elif [[ "$branch" =~ ^agent/([^/]+)$ ]]; then
    vendor=""
    id="${BASH_REMATCH[1]}"
  elif [[ -n "$branch" && "$branch" != "main" && "$branch" != "master" ]]; then
    id="$branch"
  fi

  echo "$vendor|$id"
}

infer_tier_from_id() {
  local id="$1"
  local upper
  upper="$(echo "$id" | tr '[:lower:]' '[:upper:]')"
  if [[ "$upper" =~ ^(FIX|DEBT|BUG)-? ]]; then
    echo "fix"
  elif [[ "$upper" =~ ^(CHORE|DOCS)-? ]]; then
    echo "chore"
  elif [[ "$upper" =~ ^(F[0-9]|FEAT|EPIC)-? ]]; then
    echo "feature"
  else
    echo "feature"
  fi
}

resolve_operator_info() {
  local name=""
  local email=""
  local role=""

  # 1. User context memory file
  if [[ -f "$USER_CONTEXT_CONF" ]]; then
    name="$(grep -E '^operator_name=' "$USER_CONTEXT_CONF" | cut -d= -f2- | head -n 1 || true)"
    role="$(grep -E '^operator_role=' "$USER_CONTEXT_CONF" | cut -d= -f2- | head -n 1 || true)"
  fi

  # 2. Git config
  if [[ -z "$name" ]]; then
    name="$(git -C "$PROJECT_DIR" config user.name 2>/dev/null || echo "")"
  fi
  if [[ -z "$email" ]]; then
    email="$(git -C "$PROJECT_DIR" config user.email 2>/dev/null || echo "")"
  fi

  # 3. Fallbacks
  if [[ -z "$name" ]]; then
    name="${USER:-unknown}"
  fi
  if [[ -z "$role" ]]; then
    role="developer"
  fi

  # CLI overrides
  [[ -n "$OWNER_NAME_ARG" ]] && name="$OWNER_NAME_ARG"
  [[ -n "$OWNER_EMAIL_ARG" ]] && email="$OWNER_EMAIL_ARG"
  [[ -n "$ROLE_ARG" ]] && role="$ROLE_ARG"

  echo "$name|$email|$role"
}

find_state_file() {
  local id="$1"
  local vendor="$2"
  local candidate=""

  # 1. Vendor paths if vendor specified
  if [[ -n "$vendor" ]]; then
    candidate="$PROJECT_DIR/teams/$vendor/plans/features/$id/state.json"
    [[ -f "$candidate" ]] && { echo "$candidate"; return 0; }
    candidate="$PROJECT_DIR/teams/$vendor/plans/fixes/$id/state.json"
    [[ -f "$candidate" ]] && { echo "$candidate"; return 0; }
    candidate="$PROJECT_DIR/teams/$vendor/plans/chores/$id/state.json"
    [[ -f "$candidate" ]] && { echo "$candidate"; return 0; }
    candidate="$PROJECT_DIR/teams/$vendor/plans/epics/$id/state.json"
    [[ -f "$candidate" ]] && { echo "$candidate"; return 0; }
    candidate="$PROJECT_DIR/.$vendor/state/$id.state.json"
    [[ -f "$candidate" ]] && { echo "$candidate"; return 0; }
  fi

  # 2. Standard plans/ paths
  candidate="$PROJECT_DIR/plans/features/$id/state.json"
  [[ -f "$candidate" ]] && { echo "$candidate"; return 0; }
  candidate="$PROJECT_DIR/plans/fixes/$id/state.json"
  [[ -f "$candidate" ]] && { echo "$candidate"; return 0; }
  candidate="$PROJECT_DIR/plans/chores/$id/state.json"
  [[ -f "$candidate" ]] && { echo "$candidate"; return 0; }
  candidate="$PROJECT_DIR/plans/epics/$id/state.json"
  [[ -f "$candidate" ]] && { echo "$candidate"; return 0; }

  # 3. Wildcard search in plans and teams
  local found
  found="$(find "$PROJECT_DIR/plans" "$PROJECT_DIR/teams" -name "state.json" 2>/dev/null | grep -E "/$id/state\.json$" | head -n 1 || true)"
  if [[ -n "$found" && -f "$found" ]]; then
    echo "$found"
    return 0
  fi

  return 1
}

normalize_gate_id() {
  local g="$1"
  case "$g" in
    1|gate_1|specify|gate_1_specify) echo "gate_1_specify" ;;
    2|gate_2|architecture|plan|gate_2_architecture) echo "gate_2_architecture" ;;
    3|gate_3|implement|implementation|gate_3_implementation) echo "gate_3_implementation" ;;
    4|gate_4|release|verify|gate_4_release) echo "gate_4_release" ;;
    *) echo "$g" ;;
  esac
}

# --- Command: init -----------------------------------------------------------

cmd_init() {
  local id="$1"
  local branch="${BRANCH_ARG:-$(get_current_branch)}"
  local inferred
  inferred="$(infer_from_branch "$branch")"
  local branch_vendor="${inferred%%|*}"

  local vendor="${VENDOR_ARG:-$branch_vendor}"
  local tier="${TIER_ARG:-$(infer_tier_from_id "$id")}"

  local op_info
  op_info="$(resolve_operator_info)"
  local op_name="${op_info%%|*}"
  local rest="${op_info#*|}"
  local op_email="${rest%%|*}"
  local op_role="${rest#*|}"

  local type_dir="features"
  case "$tier" in
    fix) type_dir="fixes" ;;
    chore) type_dir="chores" ;;
    feature)
      if [[ "$(echo "$id" | tr '[:lower:]' '[:upper:]')" =~ ^EPIC-? ]]; then
        type_dir="epics"
      else
        type_dir="features"
      fi
      ;;
  esac

  local plan_dir
  if [[ -n "$vendor" ]]; then
    plan_dir="$PROJECT_DIR/teams/$vendor/plans/$type_dir/$id"
  else
    plan_dir="$PROJECT_DIR/plans/$type_dir/$id"
  fi

  mkdir -p "$plan_dir"
  local state_file="$plan_dir/state.json"
  local plan_file="$plan_dir/plan.md"

  if [[ -f "$state_file" && "$FORCE_FLAG" != "true" ]]; then
    echo "[sdd-gate] State file already exists: $state_file (use --force to reinitialize)"
    return 0
  fi

  local now
  now="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

  # Write state.json using python3
  python3 - <<PYEOF
import json

tier = "$tier"
type_dir = "$type_dir"
vendor = "$vendor" or None
initiative = "$id"
branch = "$branch" or ("agent/" + initiative)
now = "$now"

# Set default gates by tier
if tier == "chore":
    g1_status, g2_status, g3_status, g4_status = "bypassed", "bypassed", "bypassed", "bypassed"
    current_phase = 5
elif tier == "fix":
    g1_status, g2_status, g3_status, g4_status = "bypassed", "pending", "locked", "locked"
    current_phase = 3
else:
    g1_status, g2_status, g3_status, g4_status = "pending", "locked", "locked", "locked"
    current_phase = 1

doc_root = f"teams/{vendor}/docs/{initiative}" if vendor else f"docs/{initiative}"
plan_path = f"teams/{vendor}/plans/{type_dir}/{initiative}/plan.md" if vendor else f"plans/{type_dir}/{initiative}/plan.md"

data = {
    "\$schema": "https://agentskills.io/schemas/sdd-state.v1.json",
    "initiative": initiative,
    "tier": tier,
    "vendor": vendor,
    "owner": {
        "name": "$op_name",
        "email": "$op_email",
        "role": "$op_role"
    },
    "branch": branch,
    "current_phase": current_phase,
    "status": "in_progress",
    "gates": {
        "gate_1_specify": {
            "status": g1_status,
            "timestamp": now if g1_status == "bypassed" else None,
            "artifacts": [],
            "required": [f"{doc_root}/phase-1-specify/prd.md"] if g1_status != "bypassed" else []
        },
        "gate_2_architecture": {
            "status": g2_status,
            "timestamp": now if g2_status == "bypassed" else None,
            "artifacts": [],
            "required": [f"{doc_root}/phase-3-plan/asd.md", plan_path] if tier == "feature" else [plan_path]
        },
        "gate_3_implementation": {
            "status": g3_status,
            "timestamp": now if g3_status == "bypassed" else None,
            "artifacts": [],
            "required": ["tests"]
        },
        "gate_4_release": {
            "status": g4_status,
            "timestamp": now if g4_status == "bypassed" else None,
            "artifacts": [],
            "required": [f"{doc_root}/phase-6-verify/release-notes.md"]
        }
    },
    "history": [
        {"phase": 0, "action": "initialized", "timestamp": now}
    ]
}

with open("$state_file", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)
    f.write("\n")
PYEOF

  # Write plan.md if absent
  if [[ ! -f "$plan_file" ]]; then
    cat <<EOF > "$plan_file"
# Initiative Plan: $id

---
initiative:
  id: $id
  type: $tier
  status: in_progress
  owner: $op_name ($op_role)
  vendor: ${vendor:-none}
flow: {phase: 1, producer: sdd-gate, consumer: team, gate: gate_1_specify}
---

## 1. Summary
Initiative $id ($tier) initialized.

## 2. Alignment
- **SDD Delivery Flow**: Governed by SDD-FLOW.md (or sdd-flow.md) and CONSTITUTION.md (or constitution.md).
- **Active Branch**: $branch

## 3. Scope
- **In Scope**: (Defined in PRD / Root Cause)
- **Out of Scope**: (Defined in PRD)

## 4. Progress & Status
- [ ] Gate 1: Specify (PRD / Brief)
- [ ] Gate 2: Architecture & Tasks (ASD & Plan ratified)
- [ ] Gate 3: Implementation & Tests
- [ ] Gate 4: Verification & Release

### Work Log
- **$now** — Initiative initialized by $op_name ($op_role).
EOF
  fi

  echo "[sdd-gate] Initialized initiative: $id"
  echo "  Tier:        $tier"
  echo "  Vendor:      ${vendor:-<none>}"
  echo "  Owner:       $op_name ($op_role)"
  echo "  State file:  $state_file"
  echo "  Plan file:   $plan_file"
  echo "  Branch:      $branch"
}

# --- Command: status ---------------------------------------------------------

cmd_status() {
  local id="${1:-}"
  local branch
  branch="$(get_current_branch)"

  if [[ -z "$id" ]]; then
    local inferred
    inferred="$(infer_from_branch "$branch")"
    id="${inferred#*|}"
  fi

  if [[ -z "$id" ]]; then
    echo "error: initiative ID not provided and could not be inferred from git branch '$branch'." >&2
    exit 1
  fi

  local state_file
  state_file="$(find_state_file "$id" "${VENDOR_ARG:-}")" || {
    echo "error: state.json for initiative '$id' not found." >&2
    exit 1
  }

  local current_op
  current_op="$(resolve_operator_info)"
  local cur_name="${current_op%%|*}"
  local cur_role="${current_op##*|}"

  python3 - "$state_file" "$cur_name" "$cur_role" "$branch" <<'PYEOF'
import json, sys

state_path = sys.argv[1]
cur_name = sys.argv[2]
cur_role = sys.argv[3]
active_branch = sys.argv[4]

with open(state_path, "r", encoding="utf-8") as f:
    state = json.load(f)

init_id = state.get("initiative", "unknown")
tier = state.get("tier", "feature")
vendor = state.get("vendor") or "<none>"
owner = state.get("owner", {})
owner_name = owner.get("name", "unknown")
owner_role = owner.get("role", "developer")
phase = state.get("current_phase", 1)
status = state.get("status", "in_progress")
branch = state.get("branch", "unknown")

print("=" * 64)
print(f" SDD INITIATIVE STATUS: {init_id}")
print("=" * 64)
print(f"  Tier:           {tier.upper()}")
print(f"  Vendor:         {vendor}")
print(f"  Owner:          {owner_name} ({owner_role})")
print(f"  Registered Br:  {branch}")
print(f"  Active Branch:  {active_branch}")
print(f"  Current Phase:  Phase {phase}")
print(f"  Status:         {status}")
print(f"  State Path:     {state_path}")
print("-" * 64)

# Ownership warning
if cur_name and owner_name and cur_name.lower() != owner_name.lower() and cur_name != "unknown":
    print(f"[OWNERSHIP ALERT] Initiative {init_id} is owned by {owner_name} ({owner_role}).")
    print(f"                 You are {cur_name} ({cur_role}). Confirm if co-authoring.")
    print("-" * 64)

gates = state.get("gates", {})
print("  GATES BREAKDOWN:")
gate_order = [
    ("gate_1_specify", "Gate 1 (Specify / PRD)"),
    ("gate_2_architecture", "Gate 2 (Architecture & Task Plan)"),
    ("gate_3_implementation", "Gate 3 (Implementation & Tests)"),
    ("gate_4_release", "Gate 4 (Verify & Release Clearance)")
]

for gid, label in gate_order:
    g = gates.get(gid, {})
    g_stat = (g.get("status") or "locked").upper()
    ts = g.get("timestamp") or "-"
    arts = g.get("artifacts") or []
    reqs = g.get("required") or []
    
    badge = f"[{g_stat:^9}]"
    print(f"  {badge} {label}")
    print(f"              Status: {g_stat} | Timestamp: {ts}")
    if reqs:
        print(f"              Required: {', '.join(reqs)}")
    if arts:
        print(f"              Artifacts: {', '.join(arts)}")
print("=" * 64)
PYEOF
}

# --- Command: check ----------------------------------------------------------

cmd_check() {
  local id="$1"
  local target_gate="${2:-}"
  local state_file
  state_file="$(find_state_file "$id" "${VENDOR_ARG:-}")" || {
    echo "error: state.json for initiative '$id' not found." >&2
    exit 1
  }

  [[ -n "$target_gate" ]] && target_gate="$(normalize_gate_id "$target_gate")"

  python3 - "$state_file" "$PROJECT_DIR" "$target_gate" <<'PYEOF'
import json, os, sys, glob

state_path, root_dir, target_gate = sys.argv[1], sys.argv[2], sys.argv[3]

with open(state_path, "r", encoding="utf-8") as f:
    state = json.load(f)

init_id = state.get("initiative", "")
tier = state.get("tier", "feature")
vendor = state.get("vendor") or ""
gates = state.get("gates", {})

# Auto-pick earliest non-passed gate if none supplied
if not target_gate:
    for gid in ["gate_1_specify", "gate_2_architecture", "gate_3_implementation", "gate_4_release"]:
        st = gates.get(gid, {}).get("status")
        if st not in ["passed", "bypassed"]:
            target_gate = gid
            break
    if not target_gate:
        target_gate = "gate_4_release"

print(f"[sdd-gate] Evaluating {target_gate} for {init_id} (tier: {tier})...")

passed = True
missing = []
found_artifacts = []

def file_exists(rel_path):
    p = os.path.join(root_dir, rel_path)
    return os.path.exists(p)

def find_any(patterns):
    for pat in patterns:
        matches = glob.glob(os.path.join(root_dir, pat), recursive=True)
        if matches:
            return matches
    return []

if target_gate == "gate_1_specify":
    if tier in ["fix", "chore"]:
        print("  [BYPASS] Gate 1 is bypassed for tier: " + tier)
        sys.exit(0)
    candidates = [
        f"docs/{init_id}/phase-1-specify/prd.md",
        f"teams/{vendor}/docs/{init_id}/phase-1-specify/prd.md" if vendor else "",
        f"docs/{init_id}/prd.md",
        "docs/phase-1-specify/prd.md"
    ]
    candidates = [c for c in candidates if c]
    matched = [c for c in candidates if file_exists(c)]
    if matched:
        print(f"  [OK] PRD Artifact found: {matched[0]}")
        found_artifacts.extend(matched)
    else:
        print(f"  [FAIL] Missing PRD Artifact! Checked:")
        for c in candidates:
            print(f"         - {c}")
        passed = False
        missing.append(f"teams/{vendor}/docs/{init_id}/phase-1-specify/prd.md" if vendor else f"docs/{init_id}/phase-1-specify/prd.md")

elif target_gate == "gate_2_architecture":
    if tier == "chore":
        print("  [BYPASS] Gate 2 is bypassed for tier: chore")
        sys.exit(0)
    
    # Check 1: Architecture Spec (for feature tier)
    if tier == "feature":
        asd_candidates = [
            f"docs/{init_id}/phase-3-plan/asd.md",
            f"teams/{vendor}/docs/{init_id}/phase-3-plan/asd.md" if vendor else "",
            f"docs/{init_id}/asd.md",
            "docs/phase-3-plan/asd.md"
        ]
        asd_candidates = [c for c in asd_candidates if c]
        asd_matched = [c for c in asd_candidates if file_exists(c)]
        if asd_matched:
            print(f"  [OK] Architecture Specification found: {asd_matched[0]}")
            found_artifacts.extend(asd_matched)
        else:
            print("  [FAIL] Missing Architecture Spec (ASD)! Checked:")
            for c in asd_candidates:
                print(f"         - {c}")
            passed = False
            missing.append(f"teams/{vendor}/docs/{init_id}/phase-3-plan/asd.md" if vendor else f"docs/{init_id}/phase-3-plan/asd.md")

    # Check 2: Task Plan
    plan_candidates = [
        f"plans/features/{init_id}/plan.md",
        f"plans/fixes/{init_id}/plan.md",
        f"plans/epics/{init_id}/plan.md",
        f"teams/{vendor}/plans/features/{init_id}/plan.md" if vendor else "",
        f"teams/{vendor}/plans/fixes/{init_id}/plan.md" if vendor else "",
        f"teams/{vendor}/plans/epics/{init_id}/plan.md" if vendor else "",
    ]
    plan_candidates = [c for c in plan_candidates if c]
    plan_matched = [c for c in plan_candidates if file_exists(c)]
    if plan_matched:
        print(f"  [OK] Task Plan found: {plan_matched[0]}")
        found_artifacts.extend(plan_matched)
    else:
        print("  [FAIL] Missing Task Plan! Checked:")
        for c in plan_candidates:
            print(f"         - {c}")
        passed = False
        missing.append(f"teams/{vendor}/plans/*/{init_id}/plan.md" if vendor else f"plans/*/{init_id}/plan.md")

elif target_gate == "gate_3_implementation":
    test_files = find_any(["**/*.test.*", "**/*_test.*", "tests/**/*", "test/**/*", "**/*Spec.*"])
    if test_files:
        print(f"  [OK] Tests verified ({len(test_files)} test files discovered)")
        found_artifacts.append(f"Discovered {len(test_files)} tests")
    else:
        print("  [FAIL] No test files found in repository matching *.test.*, *_test.*, tests/**")
        passed = False
        missing.append("Automated unit/integration tests")

elif target_gate == "gate_4_release":
    rel_candidates = [
        f"docs/{init_id}/phase-6-verify/release-notes.md",
        f"teams/{vendor}/docs/{init_id}/phase-6-verify/release-notes.md" if vendor else "",
        f"docs/{init_id}/release-notes.md",
        "docs/release-notes.md"
    ]
    rel_candidates = [c for c in rel_candidates if c]
    rel_matched = [c for c in rel_candidates if file_exists(c)]
    if rel_matched:
        print(f"  [OK] Release Clearance Artifact found: {rel_matched[0]}")
        found_artifacts.extend(rel_matched)
    else:
        print("  [FAIL] Missing Release Clearance / Release Notes! Checked:")
        for c in rel_candidates:
            print(f"         - {c}")
        passed = False
        missing.append(f"teams/{vendor}/docs/{init_id}/phase-6-verify/release-notes.md" if vendor else f"docs/{init_id}/phase-6-verify/release-notes.md")

if passed:
    print(f"[sdd-gate] Result: PASS ({target_gate} criteria met)")
    sys.exit(0)
else:
    print(f"[sdd-gate] Result: BLOCKED ({target_gate} criteria NOT met)")
    print("Missing requirements:")
    for m in missing:
        print(f"  - {m}")
    sys.exit(1)
PYEOF
}

# --- Command: advance --------------------------------------------------------

cmd_advance() {
  local id="$1"
  local target_gate="${2:-}"
  local state_file
  state_file="$(find_state_file "$id" "${VENDOR_ARG:-}")" || {
    echo "error: state.json for initiative '$id' not found." >&2
    exit 1
  }

  [[ -n "$target_gate" ]] && target_gate="$(normalize_gate_id "$target_gate")"

  # Run check first unless force is passed
  if [[ "$FORCE_FLAG" != "true" ]]; then
    if ! cmd_check "$id" "$target_gate" >/dev/null 2>&1; then
      echo "[sdd-gate] Cannot advance: gate requirements check failed."
      cmd_check "$id" "$target_gate"
      echo ""
      echo "To override and force advance anyway, pass --force."
      exit 1
    fi
  fi

  local now
  now="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

  python3 - "$state_file" "$PROJECT_DIR" "$target_gate" "$now" "$FORCE_FLAG" <<'PYEOF'
import json, os, sys, glob

state_path, root_dir, target_gate, now, force = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5] == "true"

with open(state_path, "r", encoding="utf-8") as f:
    state = json.load(f)

init_id = state.get("initiative", "")
tier = state.get("tier", "feature")
vendor = state.get("vendor") or ""
gates = state.get("gates", {})

gate_keys = ["gate_1_specify", "gate_2_architecture", "gate_3_implementation", "gate_4_release"]

if not target_gate:
    for gid in gate_keys:
        st = gates.get(gid, {}).get("status")
        if st not in ["passed", "bypassed"]:
            target_gate = gid
            break
    if not target_gate:
        print("[sdd-gate] All gates are already passed or bypassed.")
        sys.exit(0)

# Discover matching artifacts
found = []
if target_gate == "gate_1_specify":
    for p in [f"docs/{init_id}/phase-1-specify/prd.md", f"teams/{vendor}/docs/{init_id}/phase-1-specify/prd.md"]:
        if os.path.exists(os.path.join(root_dir, p)):
            found.append(p)
elif target_gate == "gate_2_architecture":
    for p in [f"docs/{init_id}/phase-3-plan/asd.md", f"teams/{vendor}/docs/{init_id}/phase-3-plan/asd.md",
              f"plans/features/{init_id}/plan.md", f"plans/fixes/{init_id}/plan.md",
              f"teams/{vendor}/plans/features/{init_id}/plan.md", f"teams/{vendor}/plans/fixes/{init_id}/plan.md"]:
        if os.path.exists(os.path.join(root_dir, p)):
            found.append(p)
elif target_gate == "gate_4_release":
    for p in [f"docs/{init_id}/phase-6-verify/release-notes.md", f"teams/{vendor}/docs/{init_id}/phase-6-verify/release-notes.md"]:
        if os.path.exists(os.path.join(root_dir, p)):
            found.append(p)

gate_obj = gates.setdefault(target_gate, {})
gate_obj["status"] = "passed"
gate_obj["timestamp"] = now
if found:
    gate_obj["artifacts"] = list(set(gate_obj.get("artifacts", []) + found))

# Unlock next gate
idx = gate_keys.index(target_gate) if target_gate in gate_keys else -1
if idx >= 0 and idx < len(gate_keys) - 1:
    next_gid = gate_keys[idx + 1]
    next_gate = gates.setdefault(next_gid, {})
    if next_gate.get("status") == "locked":
        next_gate["status"] = "pending"

# Update phase
phase_map = {
    "gate_1_specify": 2,
    "gate_2_architecture": 5,
    "gate_3_implementation": 6,
    "gate_4_release": 7
}
new_phase = phase_map.get(target_gate, state.get("current_phase", 1))
state["current_phase"] = new_phase

# Check overall completion
all_passed = all(gates.get(k, {}).get("status") in ["passed", "bypassed"] for k in gate_keys)
if all_passed:
    state["status"] = "completed"

state.setdefault("history", []).append({
    "phase": new_phase,
    "action": f"{target_gate}_passed",
    "timestamp": now
})

with open(state_path, "w", encoding="utf-8") as f:
    json.dump(state, f, indent=2)
    f.write("\n")

print(f"[sdd-gate] Successfully advanced {target_gate} to PASSED for {init_id}!")
print(f"  Current Phase: Phase {new_phase}")
print(f"  Status:        {state['status']}")
PYEOF
}

# --- Command: is-passed ------------------------------------------------------

cmd_is_passed() {
  local id="$1"
  local target_gate="$2"
  local state_file
  state_file="$(find_state_file "$id" "${VENDOR_ARG:-}")" || exit 1

  target_gate="$(normalize_gate_id "$target_gate")"

  python3 - "$state_file" "$target_gate" <<'PYEOF'
import json, sys
state_path, target_gate = sys.argv[1], sys.argv[2]
try:
    with open(state_path, "r", encoding="utf-8") as f:
        st = json.load(f)
    g = st.get("gates", {}).get(target_gate, {})
    status = g.get("status", "locked").lower()
    if status in ["passed", "bypassed"]:
        sys.exit(0)
    else:
        sys.exit(1)
except Exception:
    sys.exit(1)
PYEOF
}

# --- Command: resolve --------------------------------------------------------

cmd_resolve() {
  local branch
  branch="$(get_current_branch)"
  local inferred
  inferred="$(infer_from_branch "$branch")"
  local vendor="${inferred%%|*}"
  local id="${inferred#*|}"

  local state_file=""
  if [[ -n "$id" ]]; then
    state_file="$(find_state_file "$id" "$vendor" 2>/dev/null || echo "")"
  fi

  python3 - "$branch" "$vendor" "$id" "$state_file" <<'PYEOF'
import json, sys
branch, vendor, init_id, state_path = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
out = {
    "branch": branch,
    "vendor": vendor or None,
    "initiative": init_id or None,
    "state_path": state_path or None,
    "bound": bool(state_path)
}
print(json.dumps(out, indent=2))
PYEOF
}

# --- Main Dispatch -----------------------------------------------------------

[[ $# -ge 1 ]] || usage
COMMAND="$1"
shift

parse_global_args "$@"

case "$COMMAND" in
  init)
    [[ ${#POSITIONAL_ARGS[@]} -ge 1 ]] || { echo "error: init requires <initiative-id>" >&2; usage; }
    cmd_init "${POSITIONAL_ARGS[0]}"
    ;;
  status)
    local_id="${POSITIONAL_ARGS[0]:-}"
    cmd_status "$local_id"
    ;;
  check)
    [[ ${#POSITIONAL_ARGS[@]} -ge 1 ]] || { echo "error: check requires <initiative-id>" >&2; usage; }
    local_gate="${POSITIONAL_ARGS[1]:-}"
    cmd_check "${POSITIONAL_ARGS[0]}" "$local_gate"
    ;;
  advance)
    [[ ${#POSITIONAL_ARGS[@]} -ge 1 ]] || { echo "error: advance requires <initiative-id>" >&2; usage; }
    local_gate="${POSITIONAL_ARGS[1]:-}"
    cmd_advance "${POSITIONAL_ARGS[0]}" "$local_gate"
    ;;
  is-passed)
    [[ ${#POSITIONAL_ARGS[@]} -ge 2 ]] || { echo "error: is-passed requires <initiative-id> <gate>" >&2; usage; }
    cmd_is_passed "${POSITIONAL_ARGS[0]}" "${POSITIONAL_ARGS[1]}"
    ;;
  resolve)
    cmd_resolve
    ;;
  help|--help|-h)
    usage
    ;;
  *)
    echo "error: unknown command '$COMMAND'" >&2
    usage
    ;;
esac
