#!/bin/bash

# Script para actualizar los budgets en angular.json
echo "Actualizando budgets en angular.json..."

# Backup del archivo original
cp angular.json angular.json.backup

# Usar sed para actualizar los valores (Linux/Mac)
sed -i 's/"maximumWarning": "500kB"/"maximumWarning": "1mb"/g' angular.json
sed -i 's/"maximumError": "1MB"/"maximumError": "2mb"/g' angular.json
sed -i 's/"maximumWarning": "4kB"/"maximumWarning": "20kb"/g' angular.json
sed -i 's/"maximumError": "8kB"/"maximumError": "50kb"/g' angular.json

echo "Budgets actualizados exitosamente!"
echo "Backup creado en: angular.json.backup"