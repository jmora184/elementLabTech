param(
  [ValidateSet("remote", "local")]
  [string]$Target = "remote",
  [string]$Database = "elementlab-db",
  [string]$Config = "wrangler.jsonc",
  [string]$OutDir = "backups",
  [int]$Keep = 30
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$fileName = "$Target-$timestamp.sql"
$outputFile = Join-Path $OutDir $fileName
$locationFlag = if ($Target -eq "remote") { "--remote" } else { "--local" }

Write-Host "Exporting D1 ($Target) to $outputFile ..."
npx wrangler d1 export $Database $locationFlag --output $outputFile --config $Config

if ($LASTEXITCODE -ne 0) {
  throw "Backup export failed."
}

if ($Keep -gt 0) {
  $pattern = "$Target-*.sql"
  $existing = Get-ChildItem -Path $OutDir -File -Filter $pattern |
    Sort-Object LastWriteTime -Descending

  if ($existing.Count -gt $Keep) {
    $remove = $existing | Select-Object -Skip $Keep
    $remove | Remove-Item -Force
    Write-Host "Removed $($remove.Count) old backup(s) for target '$Target'."
  }
}

Write-Host "Backup complete: $outputFile"
