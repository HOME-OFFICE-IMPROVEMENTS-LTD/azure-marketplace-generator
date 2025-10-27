# Azure Deployment Validation Tests

## Overview

This directory contains automated deployment validation tests that deploy generated ARM templates to live Azure environments. These tests validate end-to-end functionality, including resource creation, configuration, monitoring, and cleanup.

## Prerequisites

### Azure Requirements
- Active Azure subscription with contributor access
- Service principal with contributor role on subscription
- Azure CLI installed (`az --version`)
- jq installed for JSON parsing (`jq --version`)

### Environment Setup
1. Copy the environment template:
   ```bash
   cp config/azure.env.template config/azure.env
   ```

2. Fill in your Azure credentials in `config/azure.env`:
   ```bash
   AZURE_SUBSCRIPTION_ID="your-subscription-id"
   AZURE_TENANT_ID="your-tenant-id"
   AZURE_CLIENT_ID="your-service-principal-client-id"
   AZURE_CLIENT_SECRET="your-service-principal-secret"
   AZURE_LOCATION="eastus"
   ```

3. Never commit `azure.env` (it's in `.gitignore`)

## Test Scripts

### Deployment Scripts
- `deploy-vm.sh` - Deploy VM template to Azure
- `deploy-storage.sh` - Deploy storage template to Azure
- `deploy-combined.sh` - Deploy multi-resource combined template

### Validation Scripts
- `validate-monitoring.sh` - Verify monitoring and diagnostics
- `analyze-costs.sh` - Analyze deployment costs
- `cleanup.sh` - Clean up test resources

### Helper Scripts (scripts/)
- `azure-login.sh` - Authenticate with Azure
- `generate-templates.sh` - Generate ARM templates using generator
- `deploy-template.sh` - Common deployment logic
- `wait-for-deployment.sh` - Wait for deployment completion
- `validate-deployment.sh` - Validate deployment success
- `cleanup-resources.sh` - Delete resource groups

## Usage

### Quick Start
```bash
# 1. Set up environment
cp config/azure.env.template config/azure.env
# Edit config/azure.env with your credentials

# 2. Run a basic VM deployment test
./deploy-vm.sh basic

# 3. Check the results
cat results/vm-basic-deployment-report.md

# 4. Clean up
./cleanup.sh vm-basic
```

### Test Scenarios

#### VM Deployment Tests
```bash
# Basic VM (Ubuntu, small size)
./deploy-vm.sh basic

# Enterprise VM (Windows, with extensions)
./deploy-vm.sh enterprise

# HA VM (availability set, load balancer)
./deploy-vm.sh ha
```

#### Storage Deployment Tests
```bash
# Basic storage (Standard LRS)
./deploy-storage.sh basic

# Premium storage (Premium SSD)
./deploy-storage.sh premium

# Geo-redundant storage
./deploy-storage.sh geo
```

#### Combined Deployment Tests
```bash
# VM + Storage
./deploy-combined.sh vm-storage

# Full enterprise stack
./deploy-combined.sh enterprise-stack
```

## Test Configuration Files

Configuration files in `config/` define test scenarios:

- `vm-test-config.json` - VM deployment configurations
- `storage-test-config.json` - Storage deployment configurations
- `combined-test-config.json` - Combined deployment configurations

Example configuration:
```json
{
  "basic": {
    "resourceGroup": "rg-azmp-test-vm-basic",
    "location": "eastus",
    "vmSize": "Standard_B2s",
    "osType": "Linux",
    "osVersion": "Ubuntu-2204",
    "adminUsername": "azureuser",
    "diskType": "Standard_LRS",
    "extensions": [],
    "monitoring": true,
    "ttl": "4h"
  }
}
```

## Cost Management

### Budget Limits
- **Per-deployment:** $10 maximum
- **Daily limit:** $50
- **Weekly limit:** $200

### Cost Tracking
Each deployment generates a cost report:
```bash
./analyze-costs.sh vm-basic
# Output: results/vm-basic-cost-report.md
```

### Auto-Cleanup
Resources are automatically tagged with TTL (time-to-live):
- Test resources: 4 hours
- Manual cleanup if needed: `./cleanup.sh <test-name>`

## Validation Checks

Each deployment runs these validation checks:

1. **Deployment Status**
   - ARM deployment succeeded
   - All resources created
   - No deployment errors

2. **Resource Validation**
   - VM is running (for VM tests)
   - Storage account accessible (for storage tests)
   - Expected resources exist
   - Resource properties correct

3. **Monitoring Validation**
   - Diagnostic settings configured
   - Log Analytics workspace receiving data
   - Metrics available

4. **Security Validation**
   - NSG rules correct
   - Managed identity assigned
   - Encryption enabled

5. **Output Validation**
   - Template outputs populated
   - Output values correct

## Test Results

Results are stored in `results/`:
- Deployment logs: `<test-name>-deployment.log`
- Deployment report: `<test-name>-deployment-report.md`
- Cost report: `<test-name>-cost-report.md`
- Validation results: `<test-name>-validation.json`

## Troubleshooting

### Common Issues

**Authentication Errors**
```bash
# Verify service principal
./scripts/azure-login.sh --verify
```

**Deployment Timeouts**
```bash
# Check deployment status
az deployment group show \
  --resource-group rg-azmp-test-vm-basic \
  --name azmp-deployment
```

**Quota Limits**
```bash
# Check VM quotas
az vm list-usage --location eastus --output table
```

**Cleanup Stuck**
```bash
# Force delete resource group
az group delete --name rg-azmp-test-vm-basic --yes --no-wait
```

## CI/CD Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# .github/workflows/deployment-validation.yml
name: Deployment Validation

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  deploy-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Azure credentials
        run: |
          echo "AZURE_SUBSCRIPTION_ID=${{ secrets.AZURE_SUBSCRIPTION_ID }}" >> config/azure.env
          # ... other credentials
      - name: Run VM deployment test
        run: ./tests/deployment/deploy-vm.sh basic
      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: deployment-results
          path: tests/deployment/results/
```

## Safety Features

1. **Resource Group Isolation** - Each test uses unique resource group
2. **TTL Tags** - All resources tagged with expiration time
3. **Budget Alerts** - Alerts at 50%, 80%, 100% of budget
4. **Auto-Cleanup** - Resources cleaned up after test or on timeout
5. **Cost Caps** - Deployments fail if exceeding budget

## Support

For issues or questions:
1. Check the main docs: `docs/PHASE2_DEPLOYMENT_VALIDATION.md`
2. Review test logs in `results/`
3. Check Azure Portal for resource status
4. File an issue in the repository

## Next Steps

1. Set up Azure credentials
2. Review and customize test configurations
3. Run basic deployment test
4. Review results and adjust
5. Integrate into CI/CD pipeline
