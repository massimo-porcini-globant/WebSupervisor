# constitution-gate.ps1 - Claude Code PreToolUse hook (Windows).
# Blocks code-mutation tools while no constitution exists (Iron Law),
# blocks edits on protected branches (main/master), blocks unstaged commits,
# enforces SDD Gate 2 for application code, and enforces the destructive deny floor.
# Exit code 2 blocks the tool call; stderr is fed back to the model.
$ErrorActionPreference = 'SilentlyContinue'

$raw = [Console]::In.ReadToEnd()

$cwd = $null
$toolName = $null
$command = $null
$filePath = $null
try {
    $json = $raw | ConvertFrom-Json
    $cwd = $json.cwd
    $toolName = $json.tool_name
    $command = $json.tool_input.command
    $filePath = if ($json.tool_input.file_path) { $json.tool_input.file_path } else { $json.tool_input.path }
} catch { }

$root = $env:CLAUDE_PROJECT_DIR
if (-not $root) { $root = $cwd }
if (-not $root) { $root = (Get-Location).Path }

$branch = ""
try { $branch = (git -C $root rev-parse --abbrev-ref HEAD 2>$null).Trim() } catch {}

# Prefer PowerShell 7+ when available, fall back to Windows PowerShell 5.1.
$psExe = if (Get-Command pwsh -ErrorAction SilentlyContinue) { 'pwsh' } else { 'powershell' }

$vendor = ""
$initiative = ""
if ($branch -match '^([^/]+)/agent/([^/]+)$') {
    $vendor = $Matches[1]
    $initiative = $Matches[2]
} elseif ($branch -match '^agent/([^/]+)$') {
    $initiative = $Matches[1]
}

# Find constitution
$constitution = $null
if ($vendor) {
    foreach ($cand in @(
        (Join-Path $root "teams/$vendor/CONSTITUTION.md"),
        (Join-Path $root "teams/$vendor/constitution.md"),
        (Join-Path $root ".$vendor/governance/CONSTITUTION.md"),
        (Join-Path $root ".$vendor/governance/constitution.md")
    )) {
        if (Test-Path $cand) { $constitution = $cand; break }
    }
}

if (-not $constitution) {
    $dir = $root
    while ($dir -and $dir -ne [System.IO.Path]::GetPathRoot($dir)) {
        foreach ($candidate in @(
            (Join-Path $dir 'CONSTITUTION.md'),
            (Join-Path $dir 'constitution.md'),
            (Join-Path $dir '.specify/memory/constitution.md'),
            (Join-Path $dir '.specify/memory/CONSTITUTION.md')
        )) {
            if (Test-Path $candidate) { $constitution = $candidate; break }
        }
        if ($constitution) { break }
        $dir = Split-Path -Parent $dir
    }
}

switch -Regex ($toolName) {
    '^(Write|Edit|MultiEdit|NotebookEdit)$' {
        if (-not $constitution) {
            [Console]::Error.WriteLine("[CONSTITUTION GUARD] '$toolName' BLOCKED: no CONSTITUTION.md found in or above $root. IRON LAW: no code may be created without an active constitution. Halt code generation and ask the user to ratify one (project-init-kit skill).")
            exit 2
        }
        if ($branch -eq 'main' -or $branch -eq 'master') {
            [Console]::Error.WriteLine("[CONSTITUTION GUARD] '$toolName' BLOCKED: currently on protected branch '$branch'. Edits on a protected branch are forbidden. Ask the user to create or switch to a feature branch first.")
            exit 2
        }
        if ($filePath) {
            # Case-insensitive prefix strip: Windows paths are case-insensitive,
            # so a literal .Replace() could miss the project-root prefix.
            $rootNorm = ($root -replace '\\', '/').TrimEnd('/')
            $rel = $filePath -replace '\\', '/'
            if ($rel.ToLower().StartsWith($rootNorm.ToLower() + '/')) {
                $rel = $rel.Substring($rootNorm.Length + 1)
            }
            if ($rel -match '^docs/' -and -not ($rel -match '^docs/([^/]+/phase-[0-7]-|phase-[0-7]-|[^/]+\.md$|legacy/|templates/)')) {
                [Console]::Error.WriteLine("[SDD GUARD BLOCKED] Write to '$rel' REJECTED: invalid documentation path. Phase documentation must follow 'docs/<ID>/phase-<N>-<name>/...'.")
                exit 2
            }
            if ($rel -match '^teams/[^/]+/docs/' -and -not ($rel -match '^teams/[^/]+/docs/([^/]+/phase-[0-7]-|phase-[0-7]-|[^/]+\.md$|legacy/|templates/)')) {
                [Console]::Error.WriteLine("[SDD GUARD BLOCKED] Write to '$rel' REJECTED: invalid documentation path. Multi-vendor phase documentation must follow 'teams/<vendor>/docs/<ID>/phase-<N>-<name>/...'.")
                exit 2
            }
            if ($rel -match '^plans/' -and -not ($rel -match '^plans/(templates/|(epics|features|fixes|chores)/[^/]+/)')) {
                [Console]::Error.WriteLine("[SDD GUARD BLOCKED] Write to '$rel' REJECTED: invalid plan path. Initiative plans must follow 'plans/<type>/<ID>/...'.")
                exit 2
            }
            if ($rel -match '^teams/[^/]+/plans/' -and -not ($rel -match '^teams/[^/]+/plans/(templates/|(epics|features|fixes|chores)/[^/]+/)')) {
                [Console]::Error.WriteLine("[SDD GUARD BLOCKED] Write to '$rel' REJECTED: invalid plan path. Multi-vendor initiative plans must follow 'teams/<vendor>/plans/<type>/<ID>/...'.")
                exit 2
            }
            if ($rel -match '^input/' -and -not ($rel -match '^input/context/')) {
                [Console]::Error.WriteLine("[SDD GUARD BLOCKED] Write to '$rel' REJECTED: invalid input path. Context inputs must follow 'input/context/...'.")
                exit 2
            }
            if ($rel -match '^teams/[^/]+/input/' -and -not ($rel -match '^teams/[^/]+/input/context/')) {
                [Console]::Error.WriteLine("[SDD GUARD BLOCKED] Write to '$rel' REJECTED: invalid input path. Multi-vendor context inputs must follow 'teams/<vendor>/input/context/...'.")
                exit 2
            }
            if ($vendor -and ($rel -match '^(docs|input|plans)/')) {
                [Console]::Error.WriteLine("[SDD GUARD BLOCKED] Write to '$rel' REJECTED: multi-vendor isolation violation. Active vendor '$vendor' must store deliverables under 'teams/$vendor/' ('teams/$vendor/docs/', 'teams/$vendor/input/context/', 'teams/$vendor/plans/'), not at repository root.")
                exit 2
            }
            if (($rel -match '^(src|app|lib|packages/[^/]+/src)/') -and $initiative) {
                $gateScript = $null
                foreach ($candidate in @(
                    (Join-Path $root ".claude/skills/project-init-kit/scripts/sdd-gate.ps1"),
                    (Join-Path $root ".opencode/skills/project-init-kit/scripts/sdd-gate.ps1"),
                    (Join-Path $root "project-init-kit/scripts/sdd-gate.ps1"),
                    (Join-Path $root "scripts/sdd-gate.ps1")
                )) {
                    if (Test-Path $candidate) { $gateScript = $candidate; break }
                }
                if ($gateScript) {
                    & $psExe -NoProfile -ExecutionPolicy Bypass -File $gateScript is-passed $initiative gate_2_architecture
                    if ($LASTEXITCODE -ne 0) {
                        $relGate = $gateScript -replace '\\', '/'
                        if ($relGate.ToLower().StartsWith($rootNorm.ToLower() + '/')) {
                            $relGate = $relGate.Substring($rootNorm.Length + 1)
                        }
                        [Console]::Error.WriteLine("[SDD GUARD BLOCKED] Write to '$rel' REJECTED. Active initiative: $initiative. Gate 2 (Architecture & Task Plan) is NOT passed. Produce ASD and Task Plan, then run '$relGate advance $initiative gate_2_architecture'.")
                        exit 2
                    }
                }
            }
        }
    }
    '^Bash$' {
        if ($command -and $command -match 'git\s+push[^&|;]*\s+(-f(\s|$)|--force|--no-verify)|git\s+reset\s+--hard|rm\s+-[a-zA-Z]*[rf]{2}[a-zA-Z]*\s+(/|~|\$HOME)') {
            [Console]::Error.WriteLine("[CONSTITUTION GUARD] Bash command BLOCKED as destructive/forbidden: $command. Requires explicit human execution per the project constitution.")
            exit 2
        }
        if ($command -and $command -match 'git\s+commit(\s|$)') {
            if ($branch -eq 'main' -or $branch -eq 'master') {
                [Console]::Error.WriteLine("[CONSTITUTION GUARD] 'git commit' BLOCKED: currently on protected branch '$branch'. Committing directly to a protected branch is forbidden. Create or switch to a feature branch first.")
                exit 2
            }
            $staged = git -C $root status --porcelain 2>$null | Where-Object { $_ -notmatch '^[? ]' }
            if (-not $staged) {
                [Console]::Error.WriteLine("[CONSTITUTION GUARD] 'git commit' BLOCKED: nothing is staged in $root. Run 'git status' and 'git diff' to review changes, stage the intended files explicitly, then commit.")
                exit 2
            }
        }
    }
}

exit 0
