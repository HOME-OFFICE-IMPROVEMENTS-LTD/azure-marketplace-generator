# Security Features Guide

## Overview

This guide documents the comprehensive security features implemented in Azure Marketplace Generator v3.0.0. All parameters are verified against official Microsoft Azure documentation to ensure production compliance.

## Security Parameters

### 1. Blob Public Access Control

**Parameter:** `allowBlobPublicAccess`

**Type:** Boolean

**Default:** `false` (secure default)

**Description:** Controls whether anonymous public access is allowed to blobs or containers in the storage account.

**Security Impact:**
- ✅ **Recommended:** `false` - Prevents anonymous access, requires authentication
- ⚠️ **Use with caution:** `true` - Allows public internet access to blobs

**Official Documentation:**
- [Azure Storage Account Properties](https://learn.microsoft.com/en-us/javascript/api/@azure/arm-storage/storageaccount)
- [Prevent anonymous public read access](https://learn.microsoft.com/en-us/azure/storage/blobs/anonymous-read-access-prevent)

**ARM Template Example:**
```json
{
  "type": "Microsoft.Storage/storageAccounts",
  "properties": {
    "allowBlobPublicAccess": false
  }
}
```

---

### 2. Minimum TLS Version

**Parameter:** `minimumTlsVersion`

**Type:** String

**Default:** `TLS1_2`

**Allowed Values:** `TLS1_0`, `TLS1_1`, `TLS1_2`

**Description:** Sets the minimum TLS version required for all requests to the storage account.

**Security Impact:**
- ✅ **Recommended:** `TLS1_2` - Industry standard, secure encryption
- ⚠️ **Deprecated:** `TLS1_0`, `TLS1_1` - Known vulnerabilities, use only for legacy compatibility

**Official Documentation:**
- [Enforce minimum TLS version](https://learn.microsoft.com/en-us/azure/storage/common/transport-layer-security-configure-minimum-version)
- [StorageAccountCreateParameters](https://learn.microsoft.com/en-us/javascript/api/@azure/arm-storage/storageaccountcreateparameters)

**ARM Template Example:**
```json
{
  "type": "Microsoft.Storage/storageAccounts",
  "properties": {
    "minimumTlsVersion": "TLS1_2"
  }
}
```

---

### 3. HTTPS Traffic Only

**Parameter:** `supportsHttpsTrafficOnly`

**Type:** Boolean

**Default:** `true` (secure default since API version 2019-04-01)

**Description:** Enforces that all traffic to the storage account must use HTTPS (secure transport).

**Security Impact:**
- ✅ **Recommended:** `true` - Encrypts data in transit, prevents man-in-the-middle attacks
- ❌ **Not recommended:** `false` - Allows unencrypted HTTP traffic

**Official Documentation:**
- [Require secure transfer](https://learn.microsoft.com/en-us/azure/storage/common/storage-require-secure-transfer)
- [Azure Verified Modules - Storage Account](https://github.com/Azure/bicep-registry-modules/tree/main/avm/res/storage/storage-account)

**ARM Template Example:**
```json
{
  "type": "Microsoft.Storage/storageAccounts",
  "properties": {
    "supportsHttpsTrafficOnly": true
  }
}
```

---

### 4. Public Network Access

**Parameter:** `publicNetworkAccess`

**Type:** String

**Default:** `Enabled`

**Allowed Values:** `Enabled`, `Disabled`, `SecuredByPerimeter`

**Description:** Controls whether the storage account is accessible from public networks or only through private endpoints.

**Security Impact:**
- ✅ **High Security:** `Disabled` - Blocks all public access, requires private endpoints
- ✅ **Perimeter Security:** `SecuredByPerimeter` - Uses Network Security Perimeter for advanced control
- ⚠️ **Standard:** `Enabled` - Allows public access (can be restricted with network rules)

**Official Documentation:**
- [Configure Azure Storage firewalls and virtual networks](https://learn.microsoft.com/en-us/azure/storage/common/storage-network-security)
- [StorageAccount Interface](https://learn.microsoft.com/en-us/javascript/api/@azure/arm-storage/storageaccount)

**ARM Template Example:**
```json
{
  "type": "Microsoft.Storage/storageAccounts",
  "properties": {
    "publicNetworkAccess": "Enabled",
    "networkAcls": {
      "bypass": "AzureServices",
      "defaultAction": "Deny",
      "ipRules": [],
      "virtualNetworkRules": []
    }
  }
}
```

---

### 5. Default OAuth Authentication

**Parameter:** `defaultToOAuthAuthentication`

**Type:** Boolean

**Default:** `false`

**Description:** When set to `true`, the storage account defaults to Microsoft Entra ID (formerly Azure AD) OAuth authentication instead of Shared Key.

**Security Impact:**
- ✅ **Recommended:** `true` - Uses modern OAuth 2.0 with Microsoft Entra ID
- ⚠️ **Legacy:** `false` - Defaults to Shared Key authentication

**Official Documentation:**
- [Authorize access to data in Azure Storage](https://learn.microsoft.com/en-us/azure/storage/common/authorize-data-access)
- [StorageAccount.defaultToOAuthAuthentication](https://learn.microsoft.com/en-us/javascript/api/@azure/arm-storage/storageaccount#@azure-arm-storage-storageaccount-defaulttooauthauthentication)

**ARM Template Example:**
```json
{
  "type": "Microsoft.Storage/storageAccounts",
  "properties": {
    "defaultToOAuthAuthentication": true
  }
}
```

---

### 6. Allow Shared Key Access

**Parameter:** `allowSharedKeyAccess`

**Type:** Boolean

**Default:** `null` (equivalent to `true`)

**Description:** Controls whether the storage account permits authorization via Shared Key (account keys). When `false`, all requests must use Microsoft Entra ID.

**Security Impact:**
- ✅ **High Security:** `false` - Disables account key access, forces Microsoft Entra ID
- ⚠️ **Standard:** `true` - Allows account key authentication (easier but less secure)

**Official Documentation:**
- [Prevent Shared Key authorization](https://learn.microsoft.com/en-us/azure/storage/common/shared-key-authorization-prevent)
- [StorageAccount Properties](https://learn.microsoft.com/en-us/javascript/api/@azure/arm-storage/storageaccount)

**ARM Template Example:**
```json
{
  "type": "Microsoft.Storage/storageAccounts",
  "properties": {
    "allowSharedKeyAccess": false
  }
}
```

---

### 7. Infrastructure Encryption

**Parameter:** `requireInfrastructureEncryption`

**Type:** Boolean

**Default:** `false`

**Description:** Enables double encryption (infrastructure-level encryption in addition to service-level encryption) for data at rest.

**Security Impact:**
- ✅ **Maximum Security:** `true` - Double encryption for highly sensitive data
- ✅ **Standard:** `false` - Single encryption (Microsoft-managed keys)

**Official Documentation:**
- [Azure Storage encryption for data at rest](https://learn.microsoft.com/en-us/azure/storage/common/storage-service-encryption)
- [Infrastructure encryption](https://learn.microsoft.com/en-us/azure/storage/common/infrastructure-encryption-enable)

**ARM Template Example:**
```json
{
  "type": "Microsoft.Storage/storageAccounts",
  "properties": {
    "encryption": {
      "services": {
        "blob": {
          "enabled": true
        }
      },
      "requireInfrastructureEncryption": true,
      "keySource": "Microsoft.Storage"
    }
  }
}
```

---

## Security Best Practices

### 🎯 Recommended Security Profile

For **production environments** handling sensitive data:

```json
{
  "allowBlobPublicAccess": false,
  "minimumTlsVersion": "TLS1_2",
  "supportsHttpsTrafficOnly": true,
  "publicNetworkAccess": "Disabled",
  "defaultToOAuthAuthentication": true,
  "allowSharedKeyAccess": false,
  "requireInfrastructureEncryption": true,
  "networkAcls": {
    "bypass": "AzureServices",
    "defaultAction": "Deny"
  }
}
```

### 🔐 Security Compliance Matrix

| Security Feature | GDPR | HIPAA | PCI-DSS | SOC 2 |
|------------------|------|-------|---------|-------|
| Blob Public Access Disabled | ✅ | ✅ | ✅ | ✅ |
| TLS 1.2 Minimum | ✅ | ✅ | ✅ | ✅ |
| HTTPS Only | ✅ | ✅ | ✅ | ✅ |
| Public Network Disabled | ✅ | ✅ | ✅ | ✅ |
| OAuth Default | ✅ | ✅ | ✅ | ✅ |
| Shared Key Disabled | ✅ | ✅ | ✅ | ✅ |
| Infrastructure Encryption | ✅ | ✅ | ✅ | ✅ |

### 📋 Security Checklist

- [ ] Disable blob public access (`allowBlobPublicAccess: false`)
- [ ] Enforce TLS 1.2 minimum (`minimumTlsVersion: "TLS1_2"`)
- [ ] Enable HTTPS-only traffic (`supportsHttpsTrafficOnly: true`)
- [ ] Configure network access restrictions (`publicNetworkAccess: "Disabled"` or use `networkAcls`)
- [ ] Enable OAuth as default (`defaultToOAuthAuthentication: true`)
- [ ] Consider disabling Shared Key access (`allowSharedKeyAccess: false`)
- [ ] Enable infrastructure encryption for sensitive data (`requireInfrastructureEncryption: true`)
- [ ] Configure private endpoints for network isolation
- [ ] Enable Microsoft Defender for Storage
- [ ] Configure Azure Monitor alerts for suspicious activities

---

## Network Security Configuration

### Network ACLs Structure

```json
{
  "networkAcls": {
    "bypass": "AzureServices",
    "defaultAction": "Deny",
    "ipRules": [
      {
        "value": "203.0.113.0/24",
        "action": "Allow"
      }
    ],
    "virtualNetworkRules": [
      {
        "id": "/subscriptions/{subscription-id}/resourceGroups/{rg}/providers/Microsoft.Network/virtualNetworks/{vnet}/subnets/{subnet}",
        "action": "Allow"
      }
    ],
    "resourceAccessRules": []
  }
}
```

**Official Documentation:**
- [Configure Azure Storage firewalls and virtual networks](https://learn.microsoft.com/en-us/azure/storage/common/storage-network-security)
- [Azure Verified Modules - networkAcls](https://github.com/Azure/bicep-registry-modules/tree/main/avm/res/storage/storage-account#parameter-networkacls)

---

## Additional Security Resources

### Microsoft Documentation
- [Azure Storage security guide](https://learn.microsoft.com/en-us/azure/storage/blobs/security-recommendations)
- [Azure Storage security baseline](https://learn.microsoft.com/en-us/security/benchmark/azure/baselines/storage-security-baseline)
- [Configure Azure Storage firewalls](https://learn.microsoft.com/en-us/azure/storage/common/storage-network-security)

### Azure Verified Modules
- [Storage Account Module](https://github.com/Azure/bicep-registry-modules/tree/main/avm/res/storage/storage-account)

### SDKs and APIs
- [@azure/arm-storage SDK](https://learn.microsoft.com/en-us/javascript/api/@azure/arm-storage/)
- [Storage REST API](https://learn.microsoft.com/en-us/rest/api/storagerp/)

---

*Last Updated: October 21, 2025*
*Version: 3.0.0*
