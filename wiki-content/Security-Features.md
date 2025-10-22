# Security Features

Comprehensive guide to the security features built into Azure Marketplace Generator templates.

## Overview

All generated templates include enterprise-grade security features that protect your Azure resources and customer data. These features meet Azure Marketplace security requirements and industry best practices.

## Security Features Summary

| Feature | Purpose | Default | Can Disable |
|---------|---------|---------|-------------|
| **Encryption at Rest** | Encrypt stored data using Azure-managed keys | Enabled | No |
| **Encryption in Transit** | Enforce HTTPS/TLS for all network traffic | Enabled | No |
| **Network Security** | Restrict network access and enable firewall rules | Enabled | No |
| **Access Control** | RBAC and authentication mechanisms | Enabled | No |
| **Threat Protection** | Azure Defender integration | Optional | Yes |
| **Audit Logging** | Track all operations and access | Enabled | No |
| **Secure Secrets** | Use Key Vault for sensitive values | Enabled | No |

## 1. Encryption at Rest

### What It Does

Encrypts all data stored in Azure resources using Azure Storage Service Encryption (SSE).

### Implementation (Storage Account)

```json
{
  "type": "Microsoft.Storage/storageAccounts",
  "apiVersion": "2023-01-01",
  "name": "[parameters('storageAccountName')]",
  "properties": {
    "encryption": {
      "services": {
        "blob": {
          "enabled": true,
          "keyType": "Account"
        },
        "file": {
          "enabled": true,
          "keyType": "Account"
        },
        "table": {
          "enabled": true,
          "keyType": "Account"
        },
        "queue": {
          "enabled": true,
          "keyType": "Account"
        }
      },
      "keySource": "Microsoft.Storage"
    }
  }
}
```

### Custom Key Encryption (Optional)

For customer-managed keys using Key Vault:

```json
{
  "encryption": {
    "services": {
      "blob": { "enabled": true }
    },
    "keySource": "Microsoft.Keyvault",
    "keyvaultproperties": {
      "keyname": "[parameters('encryptionKeyName')]",
      "keyvaulturi": "[parameters('keyVaultUri')]"
    }
  }
}
```

### Benefits

- ✅ **Automatic** - No configuration required
- ✅ **Transparent** - No application changes needed
- ✅ **Compliant** - Meets regulatory requirements
- ✅ **Free** - No additional cost

## 2. Encryption in Transit

### What It Does

Forces HTTPS/TLS for all network communications to prevent man-in-the-middle attacks.

### Implementation

```json
{
  "properties": {
    "supportsHttpsTrafficOnly": true,
    "minimumTlsVersion": "TLS1_2"
  }
}
```

### TLS Version Support

| Version | Support | Recommended |
|---------|---------|-------------|
| TLS 1.0 | Disabled | ❌ No |
| TLS 1.1 | Disabled | ❌ No |
| TLS 1.2 | **Enabled** | ✅ Yes (Default) |
| TLS 1.3 | Enabled | ✅ Yes |

### Configuration

```bash
# Use TLS 1.2 (default)
azmp create storage --name "MyStorage" --publisher "Acme"

# Enforce TLS 1.3 (if supported)
azmp create storage \
  --name "MyStorage" \
  --publisher "Acme" \
  --tls-version "TLS1_3"
```

### Benefits

- ✅ **Prevents** - Man-in-the-middle attacks
- ✅ **Protects** - Data during transmission
- ✅ **Required** - By Azure Marketplace standards

## 3. Network Security

### Firewall Rules

Control access to resources by IP address or virtual network.

#### Default Configuration

```json
{
  "properties": {
    "networkAcls": {
      "defaultAction": "Deny",
      "bypass": "AzureServices",
      "ipRules": [],
      "virtualNetworkRules": []
    }
  }
}
```

#### Add IP Whitelist

```json
{
  "networkAcls": {
    "defaultAction": "Deny",
    "ipRules": [
      {
        "value": "203.0.113.0/24",
        "action": "Allow"
      }
    ]
  }
}
```

### Virtual Network Integration

Secure resources within Azure Virtual Networks.

```json
{
  "virtualNetworkRules": [
    {
      "id": "[parameters('subnetId')]",
      "action": "Allow"
    }
  ]
}
```

### Private Endpoints

For maximum security, use Azure Private Link:

```json
{
  "type": "Microsoft.Network/privateEndpoints",
  "apiVersion": "2023-04-01",
  "name": "[parameters('privateEndpointName')]",
  "properties": {
    "subnet": {
      "id": "[parameters('subnetId')]"
    },
    "privateLinkServiceConnections": [
      {
        "name": "[parameters('storageAccountName')]",
        "properties": {
          "privateLinkServiceId": "[resourceId('Microsoft.Storage/storageAccounts', parameters('storageAccountName'))]",
          "groupIds": ["blob"]
        }
      }
    ]
  }
}
```

### Benefits

- ✅ **Controls** - Who can access resources
- ✅ **Prevents** - Unauthorized network access
- ✅ **Isolates** - Resources from public internet

## 4. Access Control (RBAC)

### Role-Based Access Control

Manage permissions using Azure RBAC.

#### Built-in Roles

| Role | Permissions | Use Case |
|------|-------------|----------|
| **Owner** | Full control | Administrators |
| **Contributor** | Manage resources (no access control) | Developers |
| **Reader** | Read-only access | Auditors |
| **Storage Blob Data Contributor** | Read/write/delete blobs | Applications |
| **Storage Blob Data Reader** | Read blobs | Analytics |

#### Assign Roles in Template

```json
{
  "type": "Microsoft.Authorization/roleAssignments",
  "apiVersion": "2022-04-01",
  "name": "[guid(resourceId('Microsoft.Storage/storageAccounts', parameters('storageAccountName')), parameters('principalId'), 'ba92f5b4-2d11-453d-a403-e96b0029c9fe')]",
  "properties": {
    "roleDefinitionId": "[subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'ba92f5b4-2d11-453d-a403-e96b0029c9fe')]",
    "principalId": "[parameters('principalId')]",
    "principalType": "ServicePrincipal"
  },
  "dependsOn": [
    "[resourceId('Microsoft.Storage/storageAccounts', parameters('storageAccountName'))]"
  ]
}
```

### Managed Identity

Use system-assigned or user-assigned identities for authentication.

```json
{
  "identity": {
    "type": "SystemAssigned"
  }
}
```

### Benefits

- ✅ **Principle of Least Privilege** - Grant minimal permissions
- ✅ **Centralized** - Manage access in one place
- ✅ **Auditable** - Track permission changes

## 5. Advanced Threat Protection

### Azure Defender for Storage

Detect anomalous activity and potential threats.

#### Enable Threat Protection

```json
{
  "type": "Microsoft.Security/advancedThreatProtectionSettings",
  "apiVersion": "2019-01-01",
  "name": "current",
  "properties": {
    "isEnabled": true
  },
  "dependsOn": [
    "[resourceId('Microsoft.Storage/storageAccounts', parameters('storageAccountName'))]"
  ]
}
```

#### What It Detects

- 🔍 **Unusual access patterns** - Atypical download volumes
- 🔍 **Anonymous access** - Unexpected public exposure
- 🔍 **Malware upload** - Known malicious file signatures
- 🔍 **Data exfiltration** - Large data transfers to suspicious locations

### Configuration

```bash
# Enable Defender (additional cost)
azmp create storage \
  --name "MyStorage" \
  --publisher "Acme" \
  --enable-defender

# Disable Defender (not recommended for production)
azmp create storage \
  --name "MyStorage" \
  --publisher "Acme" \
  --no-defender
```

### Cost

Azure Defender for Storage costs approximately **$0.02 per GB** analyzed.

### Benefits

- ✅ **Proactive** - Detect threats before damage
- ✅ **Intelligent** - AI-powered analysis
- ✅ **Alerts** - Real-time notifications

## 6. Audit Logging

### Diagnostic Settings

Send logs to Log Analytics workspace for analysis.

```json
{
  "type": "Microsoft.Storage/storageAccounts/providers/diagnosticSettings",
  "apiVersion": "2021-05-01-preview",
  "name": "[concat(parameters('storageAccountName'), '/Microsoft.Insights/default')]",
  "properties": {
    "workspaceId": "[parameters('logAnalyticsWorkspaceId')]",
    "logs": [
      {
        "category": "StorageRead",
        "enabled": true,
        "retentionPolicy": {
          "enabled": true,
          "days": 90
        }
      },
      {
        "category": "StorageWrite",
        "enabled": true
      },
      {
        "category": "StorageDelete",
        "enabled": true
      }
    ],
    "metrics": [
      {
        "category": "Transaction",
        "enabled": true
      }
    ]
  }
}
```

### What Gets Logged

- 📝 **Access Logs** - Who accessed what and when
- 📝 **Operation Logs** - Create, update, delete operations
- 📝 **Authentication Logs** - Successful and failed auth attempts
- 📝 **Performance Metrics** - Latency, throughput, errors

### Log Retention

| Tier | Retention | Cost |
|------|-----------|------|
| **Hot** | 0-7 days | $$$ |
| **Cool** | 8-30 days | $$ |
| **Archive** | 30+ days | $ |

### Query Logs

Use Kusto Query Language (KQL) in Azure Monitor:

```kql
StorageBlobLogs
| where TimeGenerated > ago(24h)
| where StatusCode >= 400
| summarize ErrorCount = count() by StatusCode, bin(TimeGenerated, 1h)
| order by TimeGenerated desc
```

## 7. Secure Secrets Management

### Use Azure Key Vault

Never store secrets in templates or parameters.

#### Key Vault Reference

```json
{
  "parameters": {
    "adminPassword": {
      "reference": {
        "keyVault": {
          "id": "[parameters('keyVaultId')]"
        },
        "secretName": "adminPassword"
      }
    }
  }
}
```

#### Create Key Vault

```json
{
  "type": "Microsoft.KeyVault/vaults",
  "apiVersion": "2023-02-01",
  "name": "[parameters('keyVaultName')]",
  "properties": {
    "sku": {
      "family": "A",
      "name": "standard"
    },
    "tenantId": "[subscription().tenantId]",
    "enabledForTemplateDeployment": true,
    "enableSoftDelete": true,
    "softDeleteRetentionInDays": 90,
    "accessPolicies": []
  }
}
```

### Best Practices

- ✅ **Never** hardcode secrets in templates
- ✅ **Use** Key Vault references for sensitive values
- ✅ **Enable** soft delete for recovery
- ✅ **Rotate** secrets regularly
- ✅ **Audit** secret access

## Security Compliance

### Standards Met

Generated templates comply with:

- ✅ **Azure Marketplace** - Security requirements
- ✅ **CIS Benchmarks** - Azure Foundations
- ✅ **NIST** - Cybersecurity Framework
- ✅ **ISO 27001** - Information security
- ✅ **SOC 2** - Service organization controls
- ✅ **HIPAA** - Healthcare (when configured properly)
- ✅ **PCI DSS** - Payment card industry

### Azure Policy

Apply organizational policies:

```json
{
  "policyAssignments": [
    {
      "name": "enforce-https",
      "displayName": "Enforce HTTPS traffic only",
      "policyDefinitionId": "/providers/Microsoft.Authorization/policyDefinitions/404c3081-a854-4457-ae30-26a93ef643f9"
    }
  ]
}
```

## Security Checklist

Before deploying to production:

- [ ] **Encryption at rest** enabled
- [ ] **TLS 1.2 or higher** enforced
- [ ] **Network access** restricted
- [ ] **RBAC roles** properly assigned
- [ ] **Defender** enabled (if needed)
- [ ] **Logging** configured
- [ ] **Secrets** in Key Vault
- [ ] **Firewall rules** configured
- [ ] **Private endpoints** (if required)
- [ ] **Soft delete** enabled
- [ ] **Backup** configured
- [ ] **Monitoring** alerts set up

## Common Scenarios

### High-Security Environment

```bash
azmp create storage \
  --name "HighSecStorage" \
  --publisher "SecureCorp" \
  --enable-defender \
  --tls-version "TLS1_3" \
  --private-endpoints \
  --firewall-mode "deny-all" \
  --encryption-key-vault \
  --enable-logging \
  --log-retention 365
```

### Development Environment

```bash
azmp create storage \
  --name "DevStorage" \
  --publisher "DevTeam" \
  --firewall-mode "allow-azure-services" \
  --no-defender \
  --log-retention 30
```

### Compliance (HIPAA)

```bash
azmp create storage \
  --name "HealthcareStorage" \
  --publisher "HealthOrg" \
  --enable-defender \
  --tls-version "TLS1_2" \
  --encryption-key-vault \
  --enable-logging \
  --log-retention 2555  # 7 years
  --enable-soft-delete \
  --soft-delete-retention 90
```

## Troubleshooting

### Access Denied Errors

1. **Check RBAC** - Verify role assignments
2. **Check firewall** - Add IP to whitelist
3. **Check VNet** - Verify network rules
4. **Check managed identity** - Ensure identity has permissions

### Encryption Issues

1. **Key Vault access** - Verify deployment has access
2. **Key permissions** - Check wrap/unwrap permissions
3. **API version** - Use latest supported version

### Logging Not Working

1. **Diagnostic settings** - Verify configuration
2. **Workspace** - Ensure Log Analytics exists
3. **Permissions** - Check write permissions to workspace

## Next Steps

- **[Data Protection](Data-Protection)** - Data backup and recovery
- **[Configuration Guide](Configuration-Guide)** - Configure security settings
- **[FAQ](FAQ)** - Security-related questions

---

**Questions?** Ask in [GitHub Discussions - Security](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/discussions/categories/security)
