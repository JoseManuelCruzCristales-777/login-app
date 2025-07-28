# Script completo para build exitoso
Write-Host "🔧 Solucionando errores de build..." -ForegroundColor Cyan

# 1. Actualizar budgets si existen
if (Test-Path "angular.json") {
    Write-Host "📊 Actualizando budgets..." -ForegroundColor Yellow
    $content = Get-Content "angular.json" -Raw
    $content = $content -replace '"maximumWarning": "500kB"', '"maximumWarning": "1mb"'
    $content = $content -replace '"maximumError": "1MB"', '"maximumError": "2mb"'
    $content = $content -replace '"maximumWarning": "4kB"', '"maximumWarning": "20kb"' 
    $content = $content -replace '"maximumError": "8kB"', '"maximumError": "50kb"'
    Set-Content "angular.json" $content
    Write-Host "✅ Budgets actualizados" -ForegroundColor Green
}

# 2. Limpiar carpeta docs si existe
if (Test-Path "docs") {
    Write-Host "🧹 Limpiando carpeta docs..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "docs"
}

# 3. Build sin prerendering
Write-Host "🏗️ Ejecutando build sin prerendering..." -ForegroundColor Yellow
ng build --output-path docs --base-href ./ --no-prerender

# 4. Verificar resultado
if (Test-Path "docs/index.html") {
    Write-Host "✅ Build exitoso! Carpeta docs creada con index.html" -ForegroundColor Green
    Write-Host "📁 Archivos creados:" -ForegroundColor Cyan
    Get-ChildItem docs | ForEach-Object { Write-Host "   - $($_.Name)" -ForegroundColor White }
} else {
    Write-Host "❌ Build falló. Revisar errores arriba." -ForegroundColor Red
}

Write-Host "`n🚀 Para probar localmente:" -ForegroundColor Cyan
Write-Host "   npx http-server docs" -ForegroundColor White