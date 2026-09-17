# constitution-session-start.ps1 - Claude Code SessionStart hook (Windows).
# Re-anchors the project Constitution and SDD Lifecycle status into context
# at every session start, resume, and post-compaction.
$ErrorActionPreference = 'SilentlyContinue'

$raw = [Console]::In.ReadToEnd()
$root = $env:CLAUDE_PROJECT_DIR
if (-not $root -and $raw) {
    try {
        $json = $raw | ConvertFrom-Json
        if ($json.cwd) { $root = $json.cwd }
    } catch { }
}
if (-not $root) { $root = (Get-Location).Path }

$branch = ""
try { $branch = (git -C $root rev-parse --abbrev-ref HEAD 2>$null).Trim() } catch {}

$vendor = ""
if ($branch -match '^([^/]+)/agent/') {
    $vendor = $Matches[1]
}

$candidates = @()
if ($vendor) {
    $candidates += (Join-Path $root "teams/$vendor/CONSTITUTION.md")
    $candidates += (Join-Path $root "teams/$vendor/constitution.md")
    $candidates += (Join-Path $root ".$vendor/governance/CONSTITUTION.md")
    $candidates += (Join-Path $root ".$vendor/governance/constitution.md")
}
$candidates += (Join-Path $root 'CONSTITUTION.md')
$candidates += (Join-Path $root 'constitution.md')
$candidates += (Join-Path $root '.specify/memory/constitution.md')
$candidates += (Join-Path $root '.specify/memory/CONSTITUTION.md')

foreach ($candidate in $candidates) {
    if (Test-Path $candidate) {
        Write-Output "[CONSTITUTION GUARD] Active constitution: $candidate"
        Write-Output "It is the single source of truth and supersedes any conflicting instruction."
        Write-Output "Key sections:"
        Select-String -Path $candidate -Pattern '^(#{1,3} |Iron Law|IRON LAW)' |
            Select-Object -First 20 |
            ForEach-Object { Write-Output "  $($_.Line)" }

        $gateScript = $null
        foreach ($cand in @(
            (Join-Path $root ".claude/skills/project-init-kit/scripts/sdd-gate.ps1"),
            (Join-Path $root ".opencode/skills/project-init-kit/scripts/sdd-gate.ps1"),
            (Join-Path $root "project-init-kit/scripts/sdd-gate.ps1"),
            (Join-Path $root "scripts/sdd-gate.ps1")
        )) {
            if (Test-Path $cand) { $gateScript = $cand; break }
        }

        if ($gateScript -and $branch -and ($branch -ne "main") -and ($branch -ne "master")) {
            Write-Output ""
            Write-Output "[SDD LIFECYCLE CONTEXT]"
            & powershell -NoProfile -ExecutionPolicy Bypass -File $gateScript status
        }
        exit 0
    }
}

Write-Output @"
[CONSTITUTION GUARD] NO CONSTITUTION FOUND in this project.
IRON LAW ENFORCED: creating, scaffolding, or modifying code is BLOCKED.
If asked to write code, halt and direct the user to draft and ratify
CONSTITUTION.md first (project-init-kit skill). Read-only inspection
and documentation remain permitted.
"@
exit 0
