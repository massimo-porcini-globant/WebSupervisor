# sdd-gate.ps1 — Spec-Driven Development (SDD) Lifecycle Gate Engine (PowerShell)
# Evaluates, advances, checks, and queries initiative lifecycle state and gates.
# Governed by CONSTITUTION.md and SDD-FLOW.md.
# Supports multi-vendor isolation, team namespaces, and role-based ownership.

[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$Command = "help",

    [Parameter(Position = 1)]
    [string]$InitiativeId = "",

    [Parameter(Position = 2)]
    [string]$Gate = "",

    [string]$ProjectDir = "",
    [string]$Tier = "",
    [string]$Vendor = "",
    [string]$Role = "",
    [string]$OwnerName = "",
    [string]$OwnerEmail = "",
    [string]$Branch = "",
    [switch]$Force = $false
)

$ErrorActionPreference = "Stop"

if (-not $ProjectDir) {
    $ProjectDir = (Get-Location).Path
}

function Get-UserContextConf {
    if ($env:PROJECT_INIT_KIT_USER_CONTEXT) { return $env:PROJECT_INIT_KIT_USER_CONTEXT }
    if ($env:XDG_CONFIG_HOME) { return (Join-Path $env:XDG_CONFIG_HOME "project-init-kit/user-context.conf") }
    return (Join-Path $HOME ".config/project-init-kit/user-context.conf")
}

function Get-ActiveBranch {
    try {
        $b = git -C $ProjectDir rev-parse --abbrev-ref HEAD 2>$null
        return $b.Trim()
    } catch {
        return ""
    }
}

function Infer-FromBranch([string]$b) {
    if ($b -match '^([^/]+)/agent/([^/]+)$') {
        return @{ Vendor = $Matches[1]; Initiative = $Matches[2] }
    } elseif ($b -match '^agent/([^/]+)$') {
        return @{ Vendor = ""; Initiative = $Matches[1] }
    } elseif ($b -and $b -ne "main" -and $b -ne "master") {
        return @{ Vendor = ""; Initiative = $b }
    }
    return @{ Vendor = ""; Initiative = "" }
}

function Infer-TierFromId([string]$id) {
    $upper = $id.ToUpper()
    if ($upper -match '^(FIX|DEBT|BUG)-?') { return "fix" }
    if ($upper -match '^(CHORE|DOCS)-?') { return "chore" }
    return "feature"
}

function Resolve-Operator {
    $name = ""
    $email = ""
    $r = ""

    $conf = Get-UserContextConf
    if (Test-Path $conf) {
        Get-Content $conf | ForEach-Object {
            if ($_ -match '^operator_name=(.*)$') { $name = $Matches[1].Trim() }
            if ($_ -match '^operator_role=(.*)$') { $r = $Matches[1].Trim() }
        }
    }

    if (-not $name) {
        try { $name = (git -C $ProjectDir config user.name 2>$null).Trim() } catch {}
    }
    if (-not $email) {
        try { $email = (git -C $ProjectDir config user.email 2>$null).Trim() } catch {}
    }

    if (-not $name) { $name = $env:USERNAME }
    if (-not $name) { $name = "unknown" }
    if (-not $r) { $r = "developer" }

    if ($OwnerName) { $name = $OwnerName }
    if ($OwnerEmail) { $email = $OwnerEmail }
    if ($Role) { $r = $Role }

    return @{ Name = $name; Email = $email; Role = $r }
}

function Find-StateFile([string]$id, [string]$v) {
    $candidates = @()
    if ($v) {
        $candidates += Join-Path $ProjectDir "teams/$v/plans/features/$id/state.json"
        $candidates += Join-Path $ProjectDir "teams/$v/plans/fixes/$id/state.json"
        $candidates += Join-Path $ProjectDir "teams/$v/plans/chores/$id/state.json"
        $candidates += Join-Path $ProjectDir "teams/$v/plans/epics/$id/state.json"
        $candidates += Join-Path $ProjectDir ".$v/state/$id.state.json"
    }
    $candidates += Join-Path $ProjectDir "plans/features/$id/state.json"
    $candidates += Join-Path $ProjectDir "plans/fixes/$id/state.json"
    $candidates += Join-Path $ProjectDir "plans/chores/$id/state.json"
    $candidates += Join-Path $ProjectDir "plans/epics/$id/state.json"

    foreach ($c in $candidates) {
        if (Test-Path $c) { return $c }
    }

    $found = Get-ChildItem -Path (Join-Path $ProjectDir "plans"), (Join-Path $ProjectDir "teams") -Filter "state.json" -Recurse -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -match "[/\\]$id[/\\]state\.json$" } | Select-Object -First 1

    if ($found) { return $found.FullName }
    return ""
}

function Normalize-GateId([string]$g) {
    switch ($g) {
        "1" { return "gate_1_specify" }
        "gate_1" { return "gate_1_specify" }
        "specify" { return "gate_1_specify" }
        "2" { return "gate_2_architecture" }
        "gate_2" { return "gate_2_architecture" }
        "architecture" { return "gate_2_architecture" }
        "plan" { return "gate_2_architecture" }
        "3" { return "gate_3_implementation" }
        "gate_3" { return "gate_3_implementation" }
        "implement" { return "gate_3_implementation" }
        "4" { return "gate_4_release" }
        "gate_4" { return "gate_4_release" }
        "release" { return "gate_4_release" }
        default { return $g }
    }
}

# --- Command: init ---
function Invoke-Init([string]$id) {
    if (-not $id) { throw "error: init requires an initiative ID (e.g. F01-payment-gateway)" }

    $b = if ($Branch) { $Branch } else { Get-ActiveBranch }
    $inferred = Infer-FromBranch $b
    $v = if ($Vendor) { $Vendor } else { $inferred.Vendor }
    $t = if ($Tier) { $Tier } else { Infer-TierFromId $id }

    $op = Resolve-Operator

    $typeDir = "features"
    if ($t -eq "fix") { $typeDir = "fixes" }
    elseif ($t -eq "chore") { $typeDir = "chores" }
    elseif ($id.ToUpper() -match '^EPIC-?') { $typeDir = "epics" }

    $planDir = if ($v) {
        Join-Path $ProjectDir "teams/$v/plans/$typeDir/$id"
    } else {
        Join-Path $ProjectDir "plans/$typeDir/$id"
    }

    if (-not (Test-Path $planDir)) {
        New-Item -ItemType Directory -Path $planDir -Force | Out-Null
    }

    $stateFile = Join-Path $planDir "state.json"
    $planFile = Join-Path $planDir "plan.md"

    if ((Test-Path $stateFile) -and (-not $Force)) {
        Write-Host "[sdd-gate] State file already exists: $stateFile (use -Force to overwrite)"
        return
    }

    $now = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    $docRoot = if ($v) { "teams/$v/docs/$id" } else { "docs/$id" }
    $planRel = if ($v) { "teams/$v/plans/$typeDir/$id/plan.md" } else { "plans/$typeDir/$id/plan.md" }

    $g1 = "pending"; $g2 = "locked"; $g3 = "locked"; $g4 = "locked"
    $phase = 1
    if ($t -eq "chore") {
        $g1 = "bypassed"; $g2 = "bypassed"; $g3 = "bypassed"; $g4 = "bypassed"
        $phase = 5
    } elseif ($t -eq "fix") {
        $g1 = "bypassed"; $g2 = "pending"; $g3 = "locked"; $g4 = "locked"
        $phase = 3
    }

    $stateData = [ordered]@{
        "`$schema" = "https://agentskills.io/schemas/sdd-state.v1.json"
        initiative = $id
        tier = $t
        vendor = if ($v) { $v } else { $null }
        owner = [ordered]@{
            name = $op.Name
            email = $op.Email
            role = $op.Role
        }
        branch = if ($b) { $b } else { "agent/$id" }
        current_phase = $phase
        status = "in_progress"
        gates = [ordered]@{
            gate_1_specify = [ordered]@{
                status = $g1
                timestamp = if ($g1 -eq "bypassed") { $now } else { $null }
                artifacts = @()
                required = if ($g1 -ne "bypassed") { @("$docRoot/phase-1-specify/prd.md") } else { @() }
            }
            gate_2_architecture = [ordered]@{
                status = $g2
                timestamp = if ($g2 -eq "bypassed") { $now } else { $null }
                artifacts = @()
                required = if ($t -eq "feature") { @("$docRoot/phase-3-plan/asd.md", $planRel) } else { @($planRel) }
            }
            gate_3_implementation = [ordered]@{
                status = $g3
                timestamp = if ($g3 -eq "bypassed") { $now } else { $null }
                artifacts = @()
                required = @("tests")
            }
            gate_4_release = [ordered]@{
                status = $g4
                timestamp = if ($g4 -eq "bypassed") { $now } else { $null }
                artifacts = @()
                required = @("$docRoot/phase-6-verify/release-notes.md")
            }
        }
        history = @(
            [ordered]@{ phase = 0; action = "initialized"; timestamp = $now }
        )
    }

    $json = $stateData | ConvertTo-Json -Depth 6
    [System.IO.File]::WriteAllText($stateFile, $json, [System.Text.Encoding]::UTF8)

    if (-not (Test-Path $planFile)) {
        $planContent = @"
# Initiative Plan: $id

---
initiative:
  id: $id
  type: $t
  status: in_progress
  owner: $($op.Name) ($($op.Role))
  vendor: $(if ($v) { $v } else { 'none' })
flow: {phase: 1, producer: sdd-gate, consumer: team, gate: gate_1_specify}
---

## 1. Summary
Initiative $id ($t) initialized.

## 2. Alignment
- **SDD Delivery Flow**: Governed by SDD-FLOW.md (or sdd-flow.md) and CONSTITUTION.md (or constitution.md).
- **Active Branch**: $($stateData.branch)

## 3. Scope
- **In Scope**: (Defined in PRD / Root Cause)
- **Out of Scope**: (Defined in PRD)

## 4. Progress & Status
- [ ] Gate 1: Specify (PRD / Brief)
- [ ] Gate 2: Architecture & Tasks (ASD & Plan ratified)
- [ ] Gate 3: Implementation & Tests
- [ ] Gate 4: Verification & Release

### Work Log
- **$now** — Initiative initialized by $($op.Name) ($($op.Role)).
"@
        [System.IO.File]::WriteAllText($planFile, $planContent, [System.Text.Encoding]::UTF8)
    }

    Write-Host "[sdd-gate] Initialized initiative: $id"
    Write-Host "  Tier:        $t"
    Write-Host "  Vendor:      $(if ($v) { $v } else { '<none>' })"
    Write-Host "  Owner:       $($op.Name) ($($op.Role))"
    Write-Host "  State file:  $stateFile"
    Write-Host "  Plan file:   $planFile"
}

# --- Command: status ---
function Invoke-Status([string]$id) {
    $b = Get-ActiveBranch
    if (-not $id) {
        $inf = Infer-FromBranch $b
        $id = $inf.Initiative
    }
    if (-not $id) {
        throw "error: initiative ID not provided and could not be inferred from git branch '$b'."
    }

    $stateFile = Find-StateFile $id $Vendor
    if (-not $stateFile) {
        throw "error: state.json for initiative '$id' not found."
    }

    $raw = Get-Content $stateFile -Raw | ConvertFrom-Json
    $op = Resolve-Operator

    Write-Host ("=" * 64)
    Write-Host " SDD INITIATIVE STATUS: $($raw.initiative)"
    Write-Host ("=" * 64)
    Write-Host "  Tier:           $($raw.tier.ToUpper())"
    Write-Host "  Vendor:         $(if ($raw.vendor) { $raw.vendor } else { '<none>' })"
    Write-Host "  Owner:          $($raw.owner.name) ($($raw.owner.role))"
    Write-Host "  Registered Br:  $($raw.branch)"
    Write-Host "  Active Branch:  $b"
    Write-Host "  Current Phase:  Phase $($raw.current_phase)"
    Write-Host "  Status:         $($raw.status)"
    Write-Host "  State Path:     $stateFile"
    Write-Host ("-" * 64)

    if ($op.Name -and $raw.owner.name -and ($op.Name.ToLower() -ne $raw.owner.name.ToLower()) -and ($op.Name -ne "unknown")) {
        Write-Host "[OWNERSHIP ALERT] Initiative $($raw.initiative) is owned by $($raw.owner.name) ($($raw.owner.role))."
        Write-Host "                 You are $($op.Name) ($($op.Role)). Confirm if co-authoring."
        Write-Host ("-" * 64)
    }

    Write-Host "  GATES BREAKDOWN:"
    $gateOrder = @(
        @{ Id = "gate_1_specify"; Label = "Gate 1 (Specify / PRD)" },
        @{ Id = "gate_2_architecture"; Label = "Gate 2 (Architecture & Task Plan)" },
        @{ Id = "gate_3_implementation"; Label = "Gate 3 (Implementation & Tests)" },
        @{ Id = "gate_4_release"; Label = "Gate 4 (Verify & Release Clearance)" }
    )

    foreach ($item in $gateOrder) {
        $g = $raw.gates.$($item.Id)
        $gStat = if ($g -and $g.status) { $g.status.ToUpper() } else { "LOCKED" }
        $ts = if ($g -and $g.timestamp) { $g.timestamp } else { "-" }
        $badge = "[{0,9}]" -f $gStat
        Write-Host "  $badge $($item.Label)"
        Write-Host "              Status: $gStat | Timestamp: $ts"
        if ($g.required) { Write-Host "              Required: $($g.required -join ', ')" }
        if ($g.artifacts) { Write-Host "              Artifacts: $($g.artifacts -join ', ')" }
    }
    Write-Host ("=" * 64)
}

# --- Command: check ---
function Invoke-Check([string]$id, [string]$targetGate) {
    if (-not $id) { throw "error: check requires an initiative ID" }
    $stateFile = Find-StateFile $id $Vendor
    if (-not $stateFile) { throw "error: state.json for initiative '$id' not found." }

    $raw = Get-Content $stateFile -Raw | ConvertFrom-Json
    if ($targetGate) { $targetGate = Normalize-GateId $targetGate }
    else {
        foreach ($gid in @("gate_1_specify", "gate_2_architecture", "gate_3_implementation", "gate_4_release")) {
            $st = $raw.gates.$gid.status
            if ($st -ne "passed" -and $st -ne "bypassed") { $targetGate = $gid; break }
        }
        if (-not $targetGate) { $targetGate = "gate_4_release" }
    }

    Write-Host "[sdd-gate] Evaluating $targetGate for $($raw.initiative) (tier: $($raw.tier))..."
    $passed = $true
    $missing = @()

    if ($targetGate -eq "gate_1_specify") {
        if ($raw.tier -eq "fix" -or $raw.tier -eq "chore") {
            Write-Host "  [BYPASS] Gate 1 is bypassed for tier: $($raw.tier)"
            return $true
        }
        $candidates = @(
            (Join-Path $ProjectDir "docs/$($raw.initiative)/phase-1-specify/prd.md"),
            (Join-Path $ProjectDir "teams/$($raw.vendor)/docs/$($raw.initiative)/phase-1-specify/prd.md"),
            (Join-Path $ProjectDir "docs/$($raw.initiative)/prd.md")
        )
        $hit = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
        if ($hit) { Write-Host "  [OK] PRD Artifact found: $hit" }
        else {
            Write-Host "  [FAIL] Missing PRD Artifact! Checked: $($candidates -join ', ')"
            $passed = $false
            $missing += if ($raw.vendor) { "teams/$($raw.vendor)/docs/$($raw.initiative)/phase-1-specify/prd.md" } else { "docs/$($raw.initiative)/phase-1-specify/prd.md" }
        }
    } elseif ($targetGate -eq "gate_2_architecture") {
        if ($raw.tier -eq "chore") {
            Write-Host "  [BYPASS] Gate 2 is bypassed for tier: chore"
            return $true
        }
        if ($raw.tier -eq "feature") {
            $asdCandidates = @(
                (Join-Path $ProjectDir "docs/$($raw.initiative)/phase-3-plan/asd.md"),
                (Join-Path $ProjectDir "teams/$($raw.vendor)/docs/$($raw.initiative)/phase-3-plan/asd.md")
            )
            $hit = $asdCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
            if ($hit) { Write-Host "  [OK] Architecture Spec found: $hit" }
            else {
                Write-Host "  [FAIL] Missing Architecture Spec! Checked: $($asdCandidates -join ', ')"
                $passed = $false
                $missing += if ($raw.vendor) { "teams/$($raw.vendor)/docs/$($raw.initiative)/phase-3-plan/asd.md" } else { "docs/$($raw.initiative)/phase-3-plan/asd.md" }
            }
        }
        $planCandidates = @(
            (Join-Path $ProjectDir "plans/features/$($raw.initiative)/plan.md"),
            (Join-Path $ProjectDir "plans/fixes/$($raw.initiative)/plan.md"),
            (Join-Path $ProjectDir "plans/epics/$($raw.initiative)/plan.md")
        )
        if ($raw.vendor) {
            $planCandidates += @(
                (Join-Path $ProjectDir "teams/$($raw.vendor)/plans/features/$($raw.initiative)/plan.md"),
                (Join-Path $ProjectDir "teams/$($raw.vendor)/plans/fixes/$($raw.initiative)/plan.md"),
                (Join-Path $ProjectDir "teams/$($raw.vendor)/plans/epics/$($raw.initiative)/plan.md")
            )
        }
        $hitPlan = $planCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
        if ($hitPlan) { Write-Host "  [OK] Task Plan found: $hitPlan" }
        else {
            Write-Host "  [FAIL] Missing Task Plan! Checked: $($planCandidates -join ', ')"
            $passed = $false
            $missing += if ($raw.vendor) { "teams/$($raw.vendor)/plans/*/$($raw.initiative)/plan.md" } else { "plans/*/$($raw.initiative)/plan.md" }
        }
    } elseif ($targetGate -eq "gate_3_implementation") {
        $tests = Get-ChildItem -Path $ProjectDir -Recurse -Include "*.test.*", "*_test.*", "*Spec.*" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($tests) { Write-Host "  [OK] Tests verified." }
        else {
            Write-Host "  [FAIL] No automated tests found in project."
            $passed = $false
            $missing += "Automated unit/integration tests"
        }
    } elseif ($targetGate -eq "gate_4_release") {
        $relCandidates = @(
            (Join-Path $ProjectDir "docs/$($raw.initiative)/phase-6-verify/release-notes.md"),
            (Join-Path $ProjectDir "teams/$($raw.vendor)/docs/$($raw.initiative)/phase-6-verify/release-notes.md")
        )
        $hitRel = $relCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
        if ($hitRel) { Write-Host "  [OK] Release Clearance found: $hitRel" }
        else {
            Write-Host "  [FAIL] Missing Release Clearance!"
            $passed = $false
            $missing += if ($raw.vendor) { "teams/$($raw.vendor)/docs/$($raw.initiative)/phase-6-verify/release-notes.md" } else { "docs/$($raw.initiative)/phase-6-verify/release-notes.md" }
        }
    }

    if ($passed) {
        Write-Host "[sdd-gate] Result: PASS ($targetGate criteria met)"
        return $true
    } else {
        Write-Host "[sdd-gate] Result: BLOCKED ($targetGate criteria NOT met)"
        return $false
    }
}

# --- Command: advance ---
function Invoke-Advance([string]$id, [string]$targetGate) {
    $stateFile = Find-StateFile $id $Vendor
    if (-not $stateFile) { throw "error: state.json for initiative '$id' not found." }

    if (-not $Force) {
        $ok = Invoke-Check $id $targetGate
        if (-not $ok) {
            throw "Cannot advance: gate requirements check failed. (Use -Force to override)"
        }
    }

    $raw = Get-Content $stateFile -Raw | ConvertFrom-Json
    if ($targetGate) { $targetGate = Normalize-GateId $targetGate }
    else {
        foreach ($gid in @("gate_1_specify", "gate_2_architecture", "gate_3_implementation", "gate_4_release")) {
            $st = $raw.gates.$gid.status
            if ($st -ne "passed" -and $st -ne "bypassed") { $targetGate = $gid; break }
        }
    }

    $now = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    $raw.gates.$targetGate.status = "passed"
    $raw.gates.$targetGate.timestamp = $now

    $gateKeys = @("gate_1_specify", "gate_2_architecture", "gate_3_implementation", "gate_4_release")
    $idx = $gateKeys.IndexOf($targetGate)
    if ($idx -ge 0 -and $idx -lt ($gateKeys.Count - 1)) {
        $nextG = $gateKeys[$idx + 1]
        if ($raw.gates.$nextG.status -eq "locked") {
            $raw.gates.$nextG.status = "pending"
        }
    }

    $phaseMap = @{
        "gate_1_specify" = 2
        "gate_2_architecture" = 5
        "gate_3_implementation" = 6
        "gate_4_release" = 7
    }
    if ($phaseMap.ContainsKey($targetGate)) {
        $raw.current_phase = $phaseMap[$targetGate]
    }

    $json = $raw | ConvertTo-Json -Depth 6
    [System.IO.File]::WriteAllText($stateFile, $json, [System.Text.Encoding]::UTF8)

    Write-Host "[sdd-gate] Successfully advanced $targetGate to PASSED for $id!"
}

# --- Command: is-passed ---
function Invoke-IsPassed([string]$id, [string]$targetGate) {
    $stateFile = Find-StateFile $id $Vendor
    if (-not $stateFile) { exit 1 }
    $targetGate = Normalize-GateId $targetGate
    try {
        $raw = Get-Content $stateFile -Raw | ConvertFrom-Json
        $st = $raw.gates.$targetGate.status
        if ($st -eq "passed" -or $st -eq "bypassed") { exit 0 }
        else { exit 1 }
    } catch {
        exit 1
    }
}

# --- Command: resolve ---
function Invoke-Resolve {
    $b = Get-ActiveBranch
    $inf = Infer-FromBranch $b
    $stateFile = if ($inf.Initiative) { Find-StateFile $inf.Initiative $inf.Vendor } else { "" }
    [PSCustomObject]@{
        branch = $b
        vendor = if ($inf.Vendor) { $inf.Vendor } else { $null }
        initiative = if ($inf.Initiative) { $inf.Initiative } else { $null }
        state_path = if ($stateFile) { $stateFile } else { $null }
        bound = [bool]$stateFile
    } | ConvertTo-Json
}

switch ($Command.ToLower()) {
    "init"       { Invoke-Init $InitiativeId }
    "status"     { Invoke-Status $InitiativeId }
    "check"      { $ok = Invoke-Check $InitiativeId $Gate; if (-not $ok) { exit 1 } }
    "advance"    { Invoke-Advance $InitiativeId $Gate }
    "is-passed"  { Invoke-IsPassed $InitiativeId $Gate }
    "resolve"    { Invoke-Resolve }
    default      {
        Write-Host "Usage: sdd-gate.ps1 <init|status|check|advance|is-passed|resolve> [InitiativeId] [Gate]"
        exit 1
    }
}
