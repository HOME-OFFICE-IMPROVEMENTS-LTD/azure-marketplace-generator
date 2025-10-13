#!/bin/bash

echo "🚀 Deploying AI-Enhanced Security Platform..."
echo "Resource Group: rg-ai-security-test"
echo "Template: mainTemplate.json"
echo ""

# Deploy the template
az deployment group create \
  --resource-group rg-ai-security-test \
  --template-file mainTemplate.json \
  --parameters applicationName=aisec environment=test \
  --name "ai-security-live-deployment" \
  --verbose

# Check deployment status
echo ""
echo "📊 Checking deployment status..."
az deployment group show \
  --resource-group rg-ai-security-test \
  --name "ai-security-live-deployment" \
  --query "properties.provisioningState" \
  --output tsv

# List created resources
echo ""
echo "📋 Resources created:"
az resource list \
  --resource-group rg-ai-security-test \
  --output table