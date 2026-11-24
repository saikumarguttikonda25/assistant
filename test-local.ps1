$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$node = Join-Path $projectRoot '.runtime\node-v22.14.0-win-x64\node.exe'

if (-not (Test-Path -LiteralPath $node -PathType Leaf)) {
    throw 'Project-local Node.js is missing. Restore .runtime\node-v22.14.0-win-x64 first.'
}

Push-Location $projectRoot
try {
    & $node --test
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
    Pop-Location
}
