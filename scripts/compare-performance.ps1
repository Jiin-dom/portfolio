[CmdletBinding()]
param([switch]$SkipBuild)

$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$baselineRoot = Join-Path $env:USERPROFILE '.codex\tmp\portfolio-performance-before-20261103'
$logRoot = Join-Path $env:USERPROFILE '.codex\tmp\portfolio-performance-logs'
$nodeExe = (Get-Command node.exe -ErrorAction Stop).Source

# Validate the saved snapshot, including both junction targets, before doing work.
foreach ($relative in @('package.json', 'next.config.ts', 'tsconfig.json', 'src', 'node_modules\next\dist\bin\next', 'public')) {
    if (-not (Test-Path -LiteralPath (Join-Path $baselineRoot $relative))) {
        throw "Baseline incomplete: missing $relative in $baselineRoot. Restore the saved snapshot before running this script."
    }
}
if ([System.IO.Path]::GetFullPath($baselineRoot) -eq $projectRoot) {
    throw 'The baseline must be a separate saved source snapshot.'
}
if (-not (Test-Path -LiteralPath (Join-Path $baselineRoot 'src\components\hero\desk\Performance.tsx'))) {
    throw 'Baseline comparison instrumentation is missing (src\components\hero\desk\Performance.tsx).'
}
$baselinePackage = Get-Content -LiteralPath (Join-Path $baselineRoot 'package.json') -Raw | ConvertFrom-Json
if (-not $baselinePackage.dependencies.next) { throw 'Baseline package.json does not declare Next.js.' }
foreach ($relative in @('node_modules', 'public')) {
    $junction = Get-Item -LiteralPath (Join-Path $baselineRoot $relative)
    $expected = [System.IO.Path]::GetFullPath((Join-Path $projectRoot $relative)).TrimEnd('\')
    if ($junction.LinkType -ne 'Junction' -or @($junction.Target).Count -ne 1 -or
        [System.IO.Path]::GetFullPath([string]@($junction.Target)[0]).TrimEnd('\') -ne $expected) {
        throw "Baseline $relative must be the saved junction to $expected."
    }
}
New-Item -ItemType Directory -Path $logRoot -Force | Out-Null
$runId = Get-Date -Format 'yyyyMMdd-HHmmss-fff'

function Test-ListeningPort([int]$Port) {
    # Inspect all local listener addresses without taking ownership of any listener.
    return @([System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners() |
        Where-Object { $_.Port -eq $Port }).Count -gt 0
}

$targets = @(
    [pscustomobject]@{ Name = 'before'; Root = $baselineRoot; Port = 3001 },
    [pscustomobject]@{ Name = 'after'; Root = $projectRoot; Port = 3002 }
)

foreach ($target in $targets) {
    if (Test-ListeningPort $target.Port) {
        Write-Warning "Port $($target.Port) is already listening. Skipping build/start for $($target.Name); verify it is the intended webpack production server. No listener was stopped."
        continue
    }
    $nextBin = Join-Path $target.Root 'node_modules\next\dist\bin\next'
    if (-not (Test-Path -LiteralPath $nextBin)) { throw "Next CLI missing: $nextBin" }
    if (-not $SkipBuild) {
        Write-Host "Building $($target.Name) with webpack: $($target.Root)"
        $buildOut = Join-Path $logRoot "$($target.Name)-$runId-build.log"
        $buildErr = Join-Path $logRoot "$($target.Name)-$runId-build.err.log"
        $build = Start-Process -FilePath $nodeExe -ArgumentList @("`"$nextBin`"", 'build', '--webpack') `
            -WorkingDirectory $target.Root -WindowStyle Hidden -PassThru -Wait `
            -RedirectStandardOutput $buildOut -RedirectStandardError $buildErr
        if ($build.ExitCode -ne 0) { throw "Build failed for $($target.Name). See $buildOut and $buildErr" }
    }
    if (-not (Test-Path -LiteralPath (Join-Path $target.Root '.next\BUILD_ID'))) {
        throw "No production build for $($target.Name). Run without -SkipBuild after the build is ready."
    }
    # Recheck after a potentially long build; never compete with another launcher.
    if (Test-ListeningPort $target.Port) {
        Write-Warning "Port $($target.Port) became occupied. Skipping start; verify the listener manually."
        continue
    }
    $stdout = Join-Path $logRoot "$($target.Name)-$runId-start.log"
    $stderr = Join-Path $logRoot "$($target.Name)-$runId-start.err.log"
    $server = Start-Process -FilePath $nodeExe `
        -ArgumentList @("`"$nextBin`"", 'start', '--hostname', '0.0.0.0', '--port', [string]$target.Port) `
        -WorkingDirectory $target.Root -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput $stdout -RedirectStandardError $stderr
    $deadline = [DateTime]::UtcNow.AddSeconds(30)
    do {
        $server.Refresh()
        if ($server.HasExited) { throw "Server $($target.Name) exited. See $stdout and $stderr" }
        if (Test-ListeningPort $target.Port) { break }
        Start-Sleep -Milliseconds 250
    } while ([DateTime]::UtcNow -lt $deadline)
    if (-not (Test-ListeningPort $target.Port)) {
        throw "Server readiness timed out; process $($server.Id) was left running. Inspect $stdout and $stderr before retrying."
    }
    Write-Host "$($target.Name): http://localhost:$($target.Port)/ (PID $($server.Id))"
    Write-Host "Logs: $stdout and $stderr"
}
Write-Host 'Comparison: http://localhost:3002/performance-comparison.html'
Write-Host "Existing listeners were left alone. Logs: $logRoot"
