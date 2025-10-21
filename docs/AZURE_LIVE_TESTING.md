# Azure Live Testing Guide

## Overview

This document outlines the comprehensive Azure live testing procedure that **MUST** be completed before any v3.0.0 release. All security and data protection parameters must be validated in a real Azure environment.

## Prerequisites

### Required Tools
- Azure CLI installed and configured
- Active Azure subscription with appropriate permissions
- PowerShell (for ARM-TTK validation)
- Node.js 18+ and npm

### Required Permissions
- Contributor role on target subscription
- Permission to create resource groups
- Permission to create storage accounts
- Permission to deploy ARM templates

### Environment Setup
```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "<your-subscription-id>"

# Verify current subscription
az account show

# Create test resource group
az group create --name "azmp-live-test-rg" --location "eastus"
```

---

## Test Plan

### Phase 1: Template Generation Test

**Objective:** Verify CLI generates valid templates with all v3.0.0 parameters

```bash
# Build the CLI
npm run build

# Generate storage application templates
node dist/cli/index.js create storage \
  --publisher "TestPublisher" \
  --name "LiveTestStorageApp" \
  --output ./azure-live-test

# Verify generated files
ls -la ./azure-live-test/
```

**Expected Output:**
- ✅ mainTemplate.json
- ✅ createUiDefinition.json
- ✅ viewDefinition.json
- ✅ nestedtemplates/storageAccount.json

**Validation:**
```bash
# Run ARM-TTK validation
node dist/cli/index.js validate ./azure-live-test
```

**Success Criteria:**
- All 4 files generated
- No ARM-TTK errors
- All security parameters present in mainTemplate.json
- All data protection parameters present in nested template

---

### Phase 2: Basic Deployment Test

**Objective:** Deploy with default secure settings

#### Step 1: Create Parameters File
Create `azure-live-test/test-parameters.json`:

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "storageAccountNamePrefix": {
      "value": "azmptest"
    },
    "storageAccountType": {
      "value": "Standard_LRS"
    },
    "location": {
      "value": "eastus"
    },
    "applicationName": {
      "value": "LiveTestApp"
    }
  }
}
```

#### Step 2: Deploy to Azure
```bash
# Deploy with Azure CLI
az deployment group create \
  --name "azmp-live-test-basic" \
  --resource-group "azmp-live-test-rg" \
  --template-file ./azure-live-test/mainTemplate.json \
  --parameters ./azure-live-test/test-parameters.json
```

#### Step 3: Verify Deployment
```bash
# Check deployment status
az deployment group show \
  --name "azmp-live-test-basic" \
  --resource-group "azmp-live-test-rg" \
  --query "properties.provisioningState"

# List created resources
az resource list \
  --resource-group "azmp-live-test-rg" \
  --output table

# Get storage account name
STORAGE_ACCOUNT=$(az storage account list \
  --resource-group "azmp-live-test-rg" \
  --query "[0].name" -o tsv)

echo "Storage Account: $STORAGE_ACCOUNT"
```

**Success Criteria:**
- ✅ Deployment succeeds (provisioningState: "Succeeded")
- ✅ Storage account created
- ✅ No errors in deployment logs

---

### Phase 3: Security Parameters Validation

**Objective:** Verify all 7 security parameters are correctly applied

#### Test 3.1: Blob Public Access Control
```bash
# Check allowBlobPublicAccess (should be false by default)
az storage account show \
  --name $STORAGE_ACCOUNT \
  --resource-group "azmp-live-test-rg" \
  --query "allowBlobPublicAccess"
```
**Expected:** `false`

#### Test 3.2: Minimum TLS Version
```bash
# Check minimumTlsVersion (should be TLS1_2)
az storage account show \
  --name $STORAGE_ACCOUNT \
  --resource-group "azmp-live-test-rg" \
  --query "minimumTlsVersion"
```
**Expected:** `"TLS1_2"`

#### Test 3.3: HTTPS Traffic Only
```bash
# Check supportsHttpsTrafficOnly (should be true)
az storage account show \
  --name $STORAGE_ACCOUNT \
  --resource-group "azmp-live-test-rg" \
  --query "enableHttpsTrafficOnly"
```
**Expected:** `true`

#### Test 3.4: Public Network Access
```bash
# Check publicNetworkAccess (should be Enabled by default)
az storage account show \
  --name $STORAGE_ACCOUNT \
  --resource-group "azmp-live-test-rg" \
  --query "publicNetworkAccess"
```
**Expected:** `"Enabled"`

#### Test 3.5: Default to OAuth Authentication
```bash
# Check defaultToOAuthAuthentication
az storage account show \
  --name $STORAGE_ACCOUNT \
  --resource-group "azmp-live-test-rg" \
  --query "defaultToOAuthAuthentication"
```
**Expected:** `false` (default, can be customized by user)

#### Test 3.6: Allow Shared Key Access
```bash
# Check allowSharedKeyAccess
az storage account show \
  --name $STORAGE_ACCOUNT \
  --resource-group "azmp-live-test-rg" \
  --query "allowSharedKeyAccess"
```
**Expected:** `true` (default, can be disabled by user)

#### Test 3.7: Infrastructure Encryption
```bash
# Check requireInfrastructureEncryption
az storage account show \
  --name $STORAGE_ACCOUNT \
  --resource-group "azmp-live-test-rg" \
  --query "encryption.requireInfrastructureEncryption"
```
**Expected:** `false` (default, can be enabled for sensitive data)

---

### Phase 4: Data Protection Parameters Validation

**Objective:** Verify all 5 data protection features are correctly configured

#### Test 4.1: Blob Soft Delete
```bash
# Check blob soft delete settings
az storage account blob-service-properties show \
  --account-name $STORAGE_ACCOUNT \
  --resource-group "azmp-live-test-rg" \
  --query "deleteRetentionPolicy"
```
**Expected:** 
```json
{
  "days": 7,
  "enabled": true
}
```

#### Test 4.2: Container Soft Delete
```bash
# Check container soft delete settings
az storage account blob-service-properties show \
  --account-name $STORAGE_ACCOUNT \
  --resource-group "azmp-live-test-rg" \
  --query "containerDeleteRetentionPolicy"
```
**Expected:**
```json
{
  "days": 7,
  "enabled": true
}
```

#### Test 4.3: Blob Versioning
```bash
# Check versioning
az storage account blob-service-properties show \
  --account-name $STORAGE_ACCOUNT \
  --resource-group "azmp-live-test-rg" \
  --query "isVersioningEnabled"
```
**Expected:** `true`

#### Test 4.4: Change Feed
```bash
# Check change feed
az storage account blob-service-properties show \
  --account-name $STORAGE_ACCOUNT \
  --resource-group "azmp-live-test-rg" \
  --query "changeFeed.enabled"
```
**Expected:** `false` (default, can be enabled)

#### Test 4.5: Last Access Time Tracking
```bash
# Check last access time tracking
az storage account blob-service-properties show \
  --account-name $STORAGE_ACCOUNT \
  --resource-group "azmp-live-test-rg" \
  --query "lastAccessTimeTrackingPolicy.enable"
```
**Expected:** `false` (default, can be enabled)

---

### Phase 5: Functional Testing

**Objective:** Verify storage account works correctly with applied settings

#### Test 5.1: Create Container
```bash
# Get storage account key
STORAGE_KEY=$(az storage account keys list \
  --account-name $STORAGE_ACCOUNT \
  --resource-group "azmp-live-test-rg" \
  --query "[0].value" -o tsv)

# Create test container
az storage container create \
  --name "test-container" \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY
```
**Expected:** Container created successfully

#### Test 5.2: Upload Test Blob
```bash
# Create test file
echo "Azure Marketplace Generator v3.0.0 Live Test" > test-file.txt

# Upload blob
az storage blob upload \
  --container-name "test-container" \
  --name "test-blob.txt" \
  --file test-file.txt \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY
```
**Expected:** Blob uploaded successfully

#### Test 5.3: Verify TLS 1.2 Enforcement
```bash
# Try to access with TLS 1.1 (should fail)
# This test requires curl with specific TLS version support
curl --tlsv1.1 --tls-max 1.1 \
  "https://${STORAGE_ACCOUNT}.blob.core.windows.net/test-container/test-blob.txt" \
  2>&1 | grep -q "SSL" && echo "✅ TLS 1.1 correctly blocked" || echo "❌ TLS 1.1 not blocked"

# Access with TLS 1.2 (should succeed)
curl --tlsv1.2 \
  "https://${STORAGE_ACCOUNT}.blob.core.windows.net/test-container/test-blob.txt?${SAS_TOKEN}" \
  && echo "✅ TLS 1.2 works" || echo "❌ TLS 1.2 failed"
```

#### Test 5.4: Test Blob Soft Delete
```bash
# Delete blob
az storage blob delete \
  --container-name "test-container" \
  --name "test-blob.txt" \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY

# List deleted blobs (should show deleted blob)
az storage blob list \
  --container-name "test-container" \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY \
  --include d \
  --query "[?properties.deletedTime].name"
```
**Expected:** Deleted blob appears in list

#### Test 5.5: Recover Deleted Blob
```bash
# Undelete blob
az storage blob undelete \
  --container-name "test-container" \
  --name "test-blob.txt" \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY

# Verify blob is restored
az storage blob exists \
  --container-name "test-container" \
  --name "test-blob.txt" \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY
```
**Expected:** Blob successfully restored

#### Test 5.6: Test Blob Versioning
```bash
# Download original content
az storage blob download \
  --container-name "test-container" \
  --name "test-blob.txt" \
  --file downloaded-v1.txt \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY

# Modify and upload new version
echo "Updated content - Version 2" > test-file-v2.txt
az storage blob upload \
  --container-name "test-container" \
  --name "test-blob.txt" \
  --file test-file-v2.txt \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY \
  --overwrite

# List versions
az storage blob list \
  --container-name "test-container" \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY \
  --include v \
  --prefix "test-blob.txt" \
  --query "[].{name:name, versionId:versionId, isCurrentVersion:isCurrentVersion}"
```
**Expected:** Multiple versions listed

---

### Phase 6: Custom Parameters Test

**Objective:** Test deployment with custom security and data protection settings

#### Step 1: Create Enhanced Parameters File
Create `azure-live-test/enhanced-parameters.json`:

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "storageAccountNamePrefix": {
      "value": "azmpenhanced"
    },
    "storageAccountType": {
      "value": "Standard_LRS"
    },
    "location": {
      "value": "eastus"
    },
    "applicationName": {
      "value": "EnhancedSecurityTest"
    },
    "allowBlobPublicAccess": {
      "value": false
    },
    "minimumTlsVersion": {
      "value": "TLS1_2"
    },
    "supportsHttpsTrafficOnly": {
      "value": true
    },
    "publicNetworkAccess": {
      "value": "Enabled"
    },
    "defaultToOAuthAuthentication": {
      "value": true
    },
    "allowSharedKeyAccess": {
      "value": false
    },
    "requireInfrastructureEncryption": {
      "value": true
    },
    "blobSoftDeleteDays": {
      "value": 30
    },
    "containerSoftDeleteDays": {
      "value": 30
    },
    "enableVersioning": {
      "value": true
    },
    "changeFeedEnabled": {
      "value": true
    },
    "lastAccessTimeTrackingEnabled": {
      "value": true
    }
  }
}
```

#### Step 2: Deploy Enhanced Configuration
```bash
# Deploy with enhanced security
az deployment group create \
  --name "azmp-live-test-enhanced" \
  --resource-group "azmp-live-test-rg" \
  --template-file ./azure-live-test/mainTemplate.json \
  --parameters ./azure-live-test/enhanced-parameters.json
```

#### Step 3: Verify Enhanced Settings
Run all validation tests from Phase 3 and 4 again, expecting the custom values.

---

### Phase 7: Cleanup

**Objective:** Remove all test resources

```bash
# Delete resource group and all resources
az group delete \
  --name "azmp-live-test-rg" \
  --yes \
  --no-wait

# Verify deletion
az group exists --name "azmp-live-test-rg"

# Clean up local test files
rm -rf ./azure-live-test
rm -f test-file.txt test-file-v2.txt downloaded-v1.txt
```

---

## Test Results Checklist

### ✅ Phase 1: Template Generation
- [ ] All 4 files generated successfully
- [ ] ARM-TTK validation passed
- [ ] All security parameters present
- [ ] All data protection parameters present

### ✅ Phase 2: Basic Deployment
- [ ] Deployment succeeded
- [ ] Storage account created
- [ ] No deployment errors

### ✅ Phase 3: Security Parameters
- [ ] allowBlobPublicAccess: `false`
- [ ] minimumTlsVersion: `TLS1_2`
- [ ] supportsHttpsTrafficOnly: `true`
- [ ] publicNetworkAccess: `Enabled`
- [ ] defaultToOAuthAuthentication: verified
- [ ] allowSharedKeyAccess: verified
- [ ] requireInfrastructureEncryption: verified

### ✅ Phase 4: Data Protection Parameters
- [ ] Blob soft delete: enabled (7 days)
- [ ] Container soft delete: enabled (7 days)
- [ ] Blob versioning: enabled
- [ ] Change feed: verified
- [ ] Last access time tracking: verified

### ✅ Phase 5: Functional Tests
- [ ] Container created successfully
- [ ] Blob uploaded successfully
- [ ] TLS 1.2 enforcement works
- [ ] Blob soft delete works
- [ ] Blob recovery works
- [ ] Versioning works (multiple versions)

### ✅ Phase 6: Enhanced Configuration
- [ ] Custom parameters deployed
- [ ] All 12 parameters applied correctly
- [ ] OAuth default authentication works
- [ ] Shared key access disabled works
- [ ] Infrastructure encryption enabled
- [ ] Extended retention periods applied

### ✅ Phase 7: Cleanup
- [ ] Resource group deleted
- [ ] Local files cleaned up

---

## Troubleshooting

### Common Issues

#### Issue: Deployment fails with "Storage account name not available"
**Solution:** Storage account names must be globally unique. Try a different prefix.

#### Issue: "AuthorizationFailed" error
**Solution:** Verify you have Contributor role on the subscription.

#### Issue: TLS version test fails
**Solution:** Some systems don't support TLS version restriction in curl. This is acceptable.

#### Issue: Soft delete test doesn't show deleted blob
**Solution:** Wait a few seconds and retry. Soft delete operations can take time to propagate.

---

## Sign-Off

After completing all tests, fill out this section:

**Tester Name:** ___________________________  
**Date:** ___________________________  
**Subscription ID:** ___________________________  
**Test Duration:** ___________________________  

**Overall Result:** [ ] PASS / [ ] FAIL

**Notes:**
```
[Add any observations, issues, or recommendations here]
```

**Approval for Release:** [ ] YES / [ ] NO

**Signature:** ___________________________

---

*Last Updated: October 21, 2025*  
*Version: 1.0.0*
