# Script que modifica angular.json temporalmente para build exitoso
Write-Host "🔧 Configurando build sin SSR..." -ForegroundColor Cyan

# Backup del angular.json original
Copy-Item "angular.json" "angular.json.backup"

# Leer angular.json
$content = Get-Content "angular.json" -Raw | ConvertFrom-Json

# Agregar configuración build-docs
$buildDocs = @{
    "builder" = "@angular-devkit/build-angular:browser"
    "options" = @{
        "outputPath" = "docs"
        "index" = "src/index.html"
        "main" = "src/main.ts"
        "polyfills" = @("zone.js")
        "tsConfig" = "tsconfig.app.json"
        "assets" = @("src/favicon.ico", "src/assets")
        "styles" = @("src/styles.scss")
        "scripts" = @()
        "baseHref" = "./"
    }
}

# Agregar la nueva configuración
$content.projects."login-app".architect."build-docs" = $buildDocs

# Guardar angular.json modificado
$content | ConvertTo-Json -Depth 10 | Set-Content "angular.json"

Write-Host "✅ Configuración agregada. Ejecutando build..." -ForegroundColor Green

# Ejecutar build con la nueva configuración
ng run login-app:build-docs

# Restaurar angular.json original
Move-Item "angular.json.backup" "angular.json" -Force

# Verificar resultado
if (Test-Path "docs/index.html") {
    Write-Host "🎉 BUILD EXITOSO!" -ForegroundColor Green
    Write-Host "📁 Archivos en docs:" -ForegroundColor Cyan
    Get-ChildItem docs -Name | Select-Object -First 8 | ForEach-Object { 
        Write-Host "   - $_" -ForegroundColor White 
    }
} else {
    Write-Host "❌ Build falló" -ForegroundColor Red
}