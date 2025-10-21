#!/bin/bash
# Phase 2: Real Azure Deployment Test
# Tests the generated templates with actual Azure deployment

set -e

echo "════════════════════════════════════════════════════════"
echo "Phase 2: Real Azure Deployment Test"
echo "════════════════════════════════════════════════════════"
echo ""

# Check if on develop branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "develop" ]; then
    echo "⚠️  Warning: You should be on develop branch"
    echo "Current branch: $CURRENT_BRANCH"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborted"
        exit 1
    fi
fi

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Error: Azure CLI not found"
    echo "Install: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo "❌ Error: Not logged into Azure"
    echo "Run: az login"
    exit 1
fi

SUBSCRIPTION=$(az account show --query name -o tsv)
echo "✅ Azure CLI ready"
echo "   Subscription: $SUBSCRIPTION"
echo ""

# Configuration
RG_NAME="azmp-v3-test-rg"
LOCATION="eastus"
TEST_DIR="./azure-prod-test"
PACKAGE_FILE="./azure-prod-test.zip"
TIMESTAMP=$(date +%s | tail -c 6)
STORAGE_NAME="azmpv3test${TIMESTAMP}"

echo "Configuration:"
echo "  Resource Group: $RG_NAME"
echo "  Location: $LOCATION"
echo "  Storage Account: $STORAGE_NAME"
echo ""

read -p "Proceed with deployment test? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted"
    exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "Step 1: Build and Generate Templates"
echo "════════════════════════════════════════════════════════"

npm run build

node dist/cli/index.js create storage \
  --publisher "HOI-LTD" \
  --name "production-test-v3" \
  --output "$TEST_DIR"

echo "✅ Templates generated"
echo ""

echo "════════════════════════════════════════════════════════"
echo "Step 2: Validate Templates"
echo "════════════════════════════════════════════════════════"

node dist/cli/index.js validate "$TEST_DIR" --arm-ttk

echo "✅ Validation passed"
echo ""

echo "════════════════════════════════════════════════════════"
echo "Step 3: Create Package"
echo "════════════════════════════════════════════════════════"

node dist/cli/index.js package "$TEST_DIR" --output "$PACKAGE_FILE"

echo "✅ Package created: $PACKAGE_FILE"
echo ""

echo "════════════════════════════════════════════════════════"
echo "Step 4: Deploy to Azure"
echo "════════════════════════════════════════════════════════"

# Create resource group
echo "Creating resource group..."
az group create \
  --name "$RG_NAME" \
  --location "$LOCATION" \
  --output table

echo ""
echo "Deploying ARM template (this may take 2-5 minutes)..."

# Deploy template
DEPLOYMENT_NAME="azmp-test-$(date +%s)"
az deployment group create \
  --resource-group "$RG_NAME" \
  --name "$DEPLOYMENT_NAME" \
  --template-file "${TEST_DIR}/mainTemplate.json" \
  --parameters location="$LOCATION" storageAccountName="$STORAGE_NAME" \
  --output table

echo ""
echo "✅ Deployment completed"
echo ""

echo "════════════════════════════════════════════════════════"
echo "Step 5: Verify Resources"
echo "════════════════════════════════════════════════════════"

echo ""
echo "Resources in $RG_NAME:"
az resource list \
  --resource-group "$RG_NAME" \
  --output table

echo ""
echo "Storage account details:"
az storage account show \
  --name "$STORAGE_NAME" \
  --resource-group "$RG_NAME" \
  --output table

echo ""
echo "✅ Resources verified"
echo ""

echo "════════════════════════════════════════════════════════"
echo "Step 6: Cleanup"
echo "════════════════════════════════════════════════════════"

read -p "Delete test resources? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Deleting resource group (running in background)..."
    az group delete \
      --name "$RG_NAME" \
      --yes \
      --no-wait
    echo "✅ Deletion initiated"
else
    echo "⚠️  Resources left in Azure"
    echo "   Delete manually: az group delete --name $RG_NAME --yes"
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ Phase 2 Complete - Real Azure Deployment Successful!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Test artifacts created:"
echo "  • $TEST_DIR/ (generated templates)"
echo "  • $PACKAGE_FILE (marketplace package)"
echo ""
echo "Next steps:"
echo "1. Review deployment results above"
echo "2. If all tests passed, proceed to Phase 3"
echo "   → Run: scripts/phase3-merge-to-main.sh"
echo ""
echo "Or manually:"
echo "  git checkout main"
echo "  git reset --hard develop"
echo "  git push --force origin main"
echo "  git tag -a v3.0.0 -m 'Release v3.0.0'"
echo "  git push origin v3.0.0"
echo ""
