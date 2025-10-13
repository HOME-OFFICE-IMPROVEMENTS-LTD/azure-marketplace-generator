# Enterprise Azure Storage Documentation

## HOME-OFFICE-IMPROVEMENTS-LTD Secure Storage Implementation

**Template Version:** 1.0.0  
**Documentation Date:** 2024-12-19  
**Target Audience:** IT Infrastructure Team, DevOps Engineers, Security Architects  

---


## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Security Features](#security-features)
4. [Deployment Guide](#deployment-guide)
5. [Configuration Reference](#configuration-reference)
6. [Monitoring & Management](#monitoring--management)
7. [Troubleshooting](#troubleshooting)
8. [References](#references)

## Overview

This enterprise-grade Azure Storage Account template provides a secure, compliant, and cost-effective storage solution for HOME-OFFICE-IMPROVEMENTS-LTD. The template implements industry best practices for data protection, network security, and compliance monitoring.

### Key Features

- 🔐 **Customer-managed encryption** with Azure Key Vault

- 🌐 **Private endpoint connectivity** for secure network access

- 📊 **Comprehensive audit logging** with 365-day retention

- 🏷️ **Enterprise tagging strategy** for governance and cost allocation

- 🇬🇧 **UK data residency** compliance for GDPR requirements

- 🔄 **Geo-redundant storage** for business continuity

### Microsoft Learn References

- [Azure Storage security guide](https://learn.microsoft.com/en-us/azure/storage/common/storage-security-guide)

- [Azure Storage encryption for data at rest](https://learn.microsoft.com/en-us/azure/storage/common/storage-service-encryption)

- [Azure Private Endpoints](https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-overview)

## Architecture

### High-Level Architecture

```

┌─────────────────────────────────────────────────────────────┐
│                    HOME-OFFICE-IMPROVEMENTS-LTD            │
│                     Enterprise Network                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   On-Prem   │    │   Azure     │    │  Key Vault  │     │
│  │  Network    │◄──►│    VNet     │◄──►│ (UK South)  │     │
│  └─────────────┘    └─────┬───────┘    └─────────────┘     │
├─────────────────────────────┼───────────────────────────────┤
│           ┌─────────────────▼─────────────────┐             │
│           │     Private Endpoint Subnet      │             │
│           │                                  │             │
│           │  ┌─────────────────────────────┐ │             │
│           │  │      Private Endpoint       │ │             │
│           │  │  (privatelink.blob.core...) │ │             │
│           │  └─────────────┬───────────────┘ │             │
│           └─────────────────┼─────────────────┘             │
├─────────────────────────────┼───────────────────────────────┤
│  ┌─────────────────────────▼─────────────────────────┐     │
│  │          Azure Storage Account                    │     │
│  │          (Standard GRS, UK South)                 │     │
│  │                                                   │     │
│  │  Features:                                        │     │
│  │  • Customer-managed encryption                    │     │
│  │  • Public access disabled                        │     │
│  │  • TLS 1.2+ only                                 │     │
│  │  • Audit logging enabled                         │     │
│  │  • Immutable storage                             │     │
│  └─────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘

```

### Component Details

| Component | Purpose | Configuration |
|-----------|---------|---------------|
| **Storage Account** | Primary data storage | Standard GRS, StorageV2, Hot tier |
| **Private Endpoint** | Secure network access | Blob service endpoint |
| **Key Vault** | Encryption key management | Customer-managed keys |
| **Log Analytics** | Audit and monitoring | 365-day retention |
| **Private DNS Zone** | Name resolution | privatelink.blob.core.windows.net |

### Microsoft Learn References

- [Azure Storage replication](https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy)

- [Design a private endpoint architecture](https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-overview#private-endpoint-properties)

## Security Features

### Encryption at Rest

The template implements **customer-managed encryption** using Azure Key Vault:

```json

"encryption": {
    "requireInfrastructureEncryption": true,
    "keySource": "Microsoft.Keyvault",
    "keyvaultproperties": {
        "keyname": "[parameters('keyVaultKeyName')]",
        "keyvaulturi": "...",
        "keyversion": "..."
    }
}

```

**Benefits:**

- ✅ Full control over encryption keys

- ✅ Key rotation capabilities

- ✅ Compliance with HOILTD-2024 requirements

- ✅ Infrastructure-level double encryption

### Network Security

#### Private Endpoints

All storage access routes through private endpoints, eliminating public internet exposure:

```json

"publicNetworkAccess": "Disabled",
"networkAcls": {
    "defaultAction": "Deny",
    "bypass": "AzureServices"
}

```

#### IP Restrictions

Enterprise firewall IPs can be allowlisted for exceptional access:

```json

"ipRules": [
    {
        "value": "203.0.113.10",
        "action": "Allow"
    }
]

```

### Access Control

#### OAuth-Only Authentication

Shared key access is disabled to enforce Azure AD authentication:

```json

"allowSharedKeyAccess": false,
"defaultToOAuthAuthentication": true

```

#### Managed Identity

System-assigned managed identity for secure service-to-service authentication:

```json

"identity": {
    "type": "SystemAssigned"
}

```

### Microsoft Learn References

- [Configure Azure Storage firewalls and virtual networks](https://learn.microsoft.com/en-us/azure/storage/common/storage-network-security)

- [Authorize access to Azure Storage](https://learn.microsoft.com/en-us/azure/storage/common/authorize-data-access)

## Deployment Guide

### Prerequisites

1. **Azure Subscription** with Contributor access
2. **Resource Groups** for storage, networking, and security
3. **Virtual Network** with dedicated subnet for private endpoints
4. **Key Vault** with encryption key created
5. **Log Analytics Workspace** for audit logging

### Step-by-Step Deployment

#### 1. Prepare Environment

```bash

# Set environment variables

export AZURE_SUBSCRIPTION_ID="your-subscription-id"
export RESOURCE_GROUP="rg-hoiltd-storage-prod-uksouth"
export LOCATION="uksouth"

# Login to Azure

az login
az account set --subscription $AZURE_SUBSCRIPTION_ID

```

#### 2. Validate Template

```bash

# Validate ARM template

az deployment group validate \
    --resource-group $RESOURCE_GROUP \
    --template-file storage-account-secure.json \
    --parameters @storage-account-secure.parameters.json

```

#### 3. Deploy Infrastructure

```bash

# Deploy using provided script

./scripts/deploy-secure-storage.sh

```

#### 4. Post-Deployment Configuration

```bash

# Verify deployment

az storage account show \
    --name "your-storage-account-name" \
    --resource-group $RESOURCE_GROUP \
    --query "properties"

```

### Microsoft Learn References

- [Deploy ARM templates with Azure CLI](https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/deploy-cli)

- [Best practices for ARM templates](https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/best-practices)

## Configuration Reference

### Required Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `storageAccountNamePrefix` | string | Storage account name prefix (3-11 chars) | "hoiltdprod" |
| `virtualNetworkResourceGroupName` | string | VNet resource group | "rg-hoiltd-network-prod" |
| `virtualNetworkName` | string | Virtual network name | "vnet-hoiltd-prod-uksouth" |
| `subnetName` | string | Subnet for private endpoints | "snet-storage-pe" |
| `logAnalyticsWorkspaceResourceId` | string | Log Analytics workspace ID | "/subscriptions/.../workspaces/law-hoiltd-prod" |
| `keyVaultResourceId` | string | Key Vault resource ID | "/subscriptions/.../vaults/kv-hoiltd-prod" |
| `keyVaultKeyName` | string | Encryption key name | "storage-encryption-key" |
| `businessUnit` | string | Business unit for tagging | "IT", "Finance", "Operations" |
| `environment` | string | Environment classification | "Production", "Staging", "Development" |
| `dataClassification` | string | Data sensitivity level | "Public", "Internal", "Confidential", "Restricted" |

### Optional Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `location` | string | "uksouth" | Azure region |
| `keyVaultKeyVersion` | string | "" | Specific key version (empty = latest) |
| `allowedIPAddresses` | array | [] | Allowed IP addresses for network ACL |

### Output Values

| Output | Type | Description |
|--------|------|-------------|
| `storageAccountName` | string | Generated storage account name |
| `storageAccountResourceId` | string | Full resource ID |
| `primaryBlobEndpoint` | string | Blob service endpoint URL |
| `privateEndpointIP` | string | Private endpoint IP address |
| `complianceStatus` | object | Security compliance summary |

## Monitoring & Management

### Azure Monitor Integration

The template configures comprehensive monitoring through Log Analytics:

#### Collected Logs

- **StorageRead**: All blob read operations

- **StorageWrite**: All blob write operations  

- **StorageDelete**: All blob delete operations

#### Collected Metrics

- **Transaction**: Request counts and response times

- **Capacity**: Storage utilization and growth

### Recommended Alerts

```bash

# Create cost alert

az monitor metrics alert create \
    --name "Storage Cost Alert" \
    --resource-group $RESOURCE_GROUP \
    --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP \
    --condition "total BillingAccountId > 50" \
    --description "Alert when monthly storage costs exceed £50"

# Create availability alert

az monitor metrics alert create \
    --name "Storage Availability Alert" \
    --resource-group $RESOURCE_GROUP \
    --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP \
    --condition "average Availability < 99.9" \
    --description "Alert when storage availability drops below 99.9%"

```

### KQL Queries for Analysis

```kql

// Storage access patterns
StorageWriteLogs
| where TimeGenerated > ago(24h)
| summarize RequestCount = count() by bin(TimeGenerated, 1h), CallerIpAddress
| render timechart

// Security audit - unauthorized access attempts

StorageReadLogs
| where TimeGenerated > ago(7d)
| where StatusCode >= 400
| summarize FailedRequests = count() by CallerIpAddress, StatusCode
| order by FailedRequests desc

```

### Microsoft Learn References

- [Monitor Azure Storage](https://learn.microsoft.com/en-us/azure/storage/common/monitor-storage)

- [Azure Storage monitoring data reference](https://learn.microsoft.com/en-us/azure/storage/common/monitor-storage-reference)

## Troubleshooting

### Common Issues

#### Issue: Private Endpoint Connectivity

**Symptoms:** Cannot connect to storage account from VNet
**Solution:**
1. Verify private endpoint is properly configured
2. Check DNS resolution: `nslookup your-storage-account.blob.core.windows.net`
3. Ensure subnet has private endpoint policies disabled

```bash

# Check private endpoint status

az network private-endpoint show \
    --name "your-private-endpoint" \
    --resource-group $RESOURCE_GROUP \
    --query "provisioningState"

```

#### Issue: Key Vault Access Denied

**Symptoms:** Storage account cannot access encryption key
**Solution:**
1. Verify Key Vault access policies for storage account managed identity
2. Check key permissions (Get, WrapKey, UnwrapKey)

```bash

# Grant Key Vault permissions

az keyvault set-policy \
    --name "your-key-vault" \
    --object-id "storage-account-principal-id" \
    --key-permissions get wrapKey unwrapKey

```

#### Issue: High Storage Costs

**Symptoms:** Unexpected charges in billing
**Analysis:**
1. Review access tier optimization
2. Check transaction patterns
3. Analyze data egress charges

```bash

# Review storage metrics

az monitor metrics list \
    --resource "/subscriptions/.../storageAccounts/your-account" \
    --metric "BlobCount,BlobCapacity" \
    --interval PT1H

```

### Support Escalation

| Issue Type | Contact | SLA |
|------------|---------|-----|
| **P1 - Critical** | IT Emergency Hotline | 1 hour |

| **P2 - High** | Azure Support Premium | 4 hours |

| **P3 - Medium** | Internal IT Team | 24 hours |

| **P4 - Low** | Service Desk Ticket | 48 hours |

### Microsoft Learn References

- [Troubleshoot Azure Storage connectivity](https://learn.microsoft.com/en-us/azure/storage/common/storage-troubleshooting)

- [Troubleshoot private endpoints](https://learn.microsoft.com/en-us/azure/private-link/troubleshoot-private-endpoint-connectivity)

## References

### Official Microsoft Documentation

- [Azure Storage documentation](https://learn.microsoft.com/en-us/azure/storage/)

- [Azure Resource Manager templates](https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/)

- [Azure Security Benchmark](https://learn.microsoft.com/en-us/security/benchmark/azure/)

### HOME-OFFICE-IMPROVEMENTS-LTD Standards

- **HOILTD-2024**: Enterprise Security Policy

- **INFRA-001**: Infrastructure Naming Conventions

- **COMP-002**: Data Classification Guidelines

- **NET-003**: Network Security Standards

### External References

- [ISO 27001:2022 Information Security Management](https://www.iso.org/standard/27001)

- [SOC 2 Type II Compliance Framework](https://www.aicpa.org/soc-for-service-organizations)

- [UK GDPR Compliance Guide](https://ico.org.uk/for-organisations/guide-to-data-protection/)

---


**Document Information:**

- **Classification:** Internal Use Only

- **Owner:** IT Infrastructure Team

- **Version:** 1.0.0

- **Last Updated:** 2024-12-19

- **Next Review:** 2025-03-19

- **Approved By:** [Pending IT Director Approval]
