# Script para build exitoso sin SSR
Write-Host "🔧 Build sin SSR para solucionar errores..." -ForegroundColor Cyan

# Limpiar carpeta docs si existe
if (Test-Path "docs") {
    Remove-Item -Recurse -Force "docs"
    Write-Host "🧹 Carpeta docs limpiada" -ForegroundColor Yellow
}

# Build solo cliente (sin servidor/prerendering)
Write-Host "🏗️ Ejecutando build solo cliente..." -ForegroundColor Yellow
ng build --output-path docs --base-href ./ --configuration production

# Verificar resultado
if (Test-Path "docs/index.html") {
    Write-Host "✅ Build exitoso! Carpeta docs creada" -ForegroundColor Green
    Write-Host "📁 Archivos principales:" -ForegroundColor Cyan
    Get-ChildItem docs -Name "*.html", "*.js", "*.css" | ForEach-Object { 
        Write-Host "   - $_" -ForegroundColor White 
    }
} else {
    Write-Host "❌ Build falló. Intentando sin warnings..." -ForegroundColor Red
    Write-Host "🔄 Intentando build development..." -ForegroundColor Yellow
    ng build --output-path docs --base-href ./ --configuration development
}

Write-Host "`n🚀 Para probar:" -ForegroundColor Cyan
Write-Host "   npx http-server docs" -ForegroundColor White