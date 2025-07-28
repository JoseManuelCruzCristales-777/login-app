# Script final para build exitoso
Write-Host "🏗️ Build solo cliente (sin SSR)..." -ForegroundColor Cyan

# Limpiar carpeta docs
if (Test-Path "docs") {
    Remove-Item -Recurse -Force "docs"
}

# Build usando browser builder (sin SSR)
Write-Host "📦 Ejecutando build browser..." -ForegroundColor Yellow
ng build --configuration development --output-path docs --base-href ./

# Si falla, intentar con build básico
if (-not (Test-Path "docs/index.html")) {
    Write-Host "🔄 Intentando build básico..." -ForegroundColor Yellow
    ng build --output-path docs --base-href ./ --aot=false --optimization=false
}

# Verificar resultado final
if (Test-Path "docs/index.html") {
    Write-Host "✅ BUILD EXITOSO!" -ForegroundColor Green
    Write-Host "📁 Archivos creados en docs/:" -ForegroundColor Cyan
    Get-ChildItem docs -Name | Select-Object -First 10 | ForEach-Object { 
        Write-Host "   - $_" -ForegroundColor White 
    }
    Write-Host "`n🌐 Tu app está lista para desplegar!" -ForegroundColor Green
    Write-Host "🚀 Probar: npx http-server docs" -ForegroundColor White
} else {
    Write-Host "❌ Build falló completamente" -ForegroundColor Red
}