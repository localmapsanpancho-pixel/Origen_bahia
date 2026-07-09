$git = "C:\Program Files\Git\cmd\git.exe"

& $git add .

$changes = & $git status --short
if (-not $changes) {
    Write-Host "No hay cambios para confirmar."
    exit 0
}

$commitMessage = if ($args.Count -gt 0) { $args[0] } else { "Descripción de los cambios" }
$branch = (& $git branch --show-current).Trim()

if (-not $branch) {
    $branch = "main"
}

& $git commit -m $commitMessage
& $git push origin $branch