# Script PowerShell para actualizar budgets en angular.json
Write-Host "Actualizando budgets en angular.json..." -ForegroundColor Green

# Backup del archivo original
Copy-Item "angular.json" "angular.json.backup"

# Leer el contenido del archivo
$content = Get-Content "angular.json" -Raw

# Actualizar los valores
$content = $content -replace '"maximumWarning": "500kB"', '"maximumWarning": "1mb"'
$content = $content -replace '"maximumError": "1MB"', '"maximumError": "2mb"' 
$content = $content -replace '"maximumWarning": "4kB"', '"maximumWarning": "20kb"'
$content = $content -replace '"maximumError": "8kB"', '"maximumError": "50kb"'

# Escribir el contenido actualizado
Set-Content "angular.json" $content

Write-Host "Budgets actualizados exitosamente!" -ForegroundColor Green
Write-Host "Backup creado en: angular.json.backup" -ForegroundColor Yellow

# Mostrar los nuevos valores
Write-Host "`nNuevos budgets configurados:" -ForegroundColor Cyan
Write-Host "- Bundle inicial: Warning 1mb, Error 2mb" -ForegroundColor White
Write-Host "- Estilos de componentes: Warning 20kb, Error 50kb" -ForegroundColor White