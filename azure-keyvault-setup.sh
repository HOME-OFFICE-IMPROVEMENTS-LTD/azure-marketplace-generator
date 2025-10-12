#!/bin/bash

# Azure Key Vault Configuration for Azure Marketplace Generator
# Based on your MPN subscription and mobot-keyvault-mpn Key Vault

echo "🔧 Setting up Azure Key Vault configuration for Azure Marketplace Generator..."

# Azure Key Vault Settings
export AZURE_KEYVAULT_URL="https://mobot-keyvault-mpn.vault.azure.net/"
export AZURE_TENANT_ID="8d8fc190-bad7-469a-b9ba-fee5c60b25f4"
export AZURE_SUBSCRIPTION_ID="1001490f-c77c-403e-be9e-97eac578d1d6"

# Optional: Organization settings (already defaults in the code)
export AZMP_ORGANIZATION_NAME="HOME-OFFICE-IMPROVEMENTS-LTD"
export AZMP_DEFAULT_PUBLISHER="HOME-OFFICE-IMPROVEMENTS-LTD"

echo "✅ Environment variables set for Key Vault integration:"
echo "   🔗 Key Vault URL: $AZURE_KEYVAULT_URL"
echo "   🏢 Tenant ID: $AZURE_TENANT_ID"
echo "   📋 Subscription ID: $AZURE_SUBSCRIPTION_ID"
echo "   🏛️ Organization: $AZMP_ORGANIZATION_NAME"

echo ""
echo "💡 To make these permanent, add them to your ~/.bashrc or ~/.profile:"
echo "   echo 'export AZURE_KEYVAULT_URL=\"https://mobot-keyvault-mpn.vault.azure.net/\"' >> ~/.bashrc"
echo "   echo 'export AZURE_TENANT_ID=\"8d8fc190-bad7-469a-b9ba-fee5c60b25f4\"' >> ~/.bashrc"
echo "   echo 'export AZURE_SUBSCRIPTION_ID=\"1001490f-c77c-403e-be9e-97eac578d1d6\"' >> ~/.bashrc"

echo ""
echo "🧪 Test the Key Vault integration with:"
echo "   npm run build && node -e 'const {AppConfigManager} = require(\"./dist/config/app-config\"); AppConfigManager.getInstance().isKeyVaultAvailable().then(console.log)'"