# Quick Reference - v3.0.0 Enhancement Parameters

## 🔒 Security & Access Control (7 Parameters)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `allowBlobPublicAccess` | bool | `false` | Allow/disallow public access to blobs |
| `minimumTlsVersion` | string | `"TLS1_2"` | Minimum TLS version (TLS1_0/TLS1_1/TLS1_2) |
| `supportsHttpsTrafficOnly` | bool | `true` | Force HTTPS traffic only |
| `publicNetworkAccess` | string | `"Enabled"` | Public network access (Enabled/Disabled) |
| `defaultToOAuthAuthentication` | bool | `false` | Default to OAuth authentication |
| `allowSharedKeyAccess` | bool | `true` | Allow Shared Key authentication |
| `requireInfrastructureEncryption` | bool | `false` | Double encryption layer |

## 🛡️ Data Protection (5 Parameters)

| Parameter | Type | Default | Range | Description |
|-----------|------|---------|-------|-------------|
| `blobSoftDeleteDays` | int | `7` | 1-365 | Blob soft delete retention days |
| `containerSoftDeleteDays` | int | `7` | 1-365 | Container soft delete retention days |
| `enableVersioning` | bool | `false` | - | Enable blob versioning |
| `changeFeedEnabled` | bool | `false` | - | Enable change feed for auditing |
| `lastAccessTimeTrackingEnabled` | bool | `false` | - | Track last access time |

## 📝 ARM Template Property Mapping

### Storage Account Properties
```json
{
  "type": "Microsoft.Storage/storageAccounts",
  "properties": {
    "allowBlobPublicAccess": "[parameters('allowBlobPublicAccess')]",
    "minimumTlsVersion": "[parameters('minimumTlsVersion')]",
    "supportsHttpsTrafficOnly": "[parameters('supportsHttpsTrafficOnly')]",
    "publicNetworkAccess": "[parameters('publicNetworkAccess')]",
    "defaultToOAuthAuthentication": "[parameters('defaultToOAuthAuthentication')]",
    "allowSharedKeyAccess": "[parameters('allowSharedKeyAccess')]",
    "encryption": {
      "requireInfrastructureEncryption": "[parameters('requireInfrastructureEncryption')]",
      "services": {
        "blob": {
          "enabled": true,
          "keyType": "Account"
        }
      },
      "keySource": "Microsoft.Storage"
    }
  }
}
```

### Blob Services Properties
```json
{
  "type": "Microsoft.Storage/storageAccounts/blobServices",
  "properties": {
    "deleteRetentionPolicy": {
      "enabled": "[greater(parameters('blobSoftDeleteDays'), 0)]",
      "days": "[parameters('blobSoftDeleteDays')]"
    },
    "containerDeleteRetentionPolicy": {
      "enabled": "[greater(parameters('containerSoftDeleteDays'), 0)]",
      "days": "[parameters('containerSoftDeleteDays')]"
    },
    "isVersioningEnabled": "[parameters('enableVersioning')]",
    "changeFeed": {
      "enabled": "[parameters('changeFeedEnabled')]"
    },
    "lastAccessTimeTrackingPolicy": {
      "enable": "[parameters('lastAccessTimeTrackingEnabled')]",
      "name": "AccessTimeTracking",
      "trackingGranularityInDays": 1
    }
  }
}
```

## 🎨 UI Sections

### Section 3: Security & Access Control
- **Step Name**: `securityConfig`
- **Label**: "Security & Access Control"
- **Controls**:
  1. OptionsGroup: TLS Version
  2. CheckBox: Block Public Access
  3. CheckBox: HTTPS Only
  4. OptionsGroup: Network Access
  5. CheckBox: OAuth Default
  6. CheckBox: Allow Shared Key
  7. CheckBox: Infrastructure Encryption

### Section 4: Data Protection
- **Step Name**: `dataProtection`
- **Label**: "Data Protection"
- **Controls**:
  1. TextBox (number): Blob Soft Delete Days
  2. TextBox (number): Container Soft Delete Days
  3. CheckBox: Enable Versioning
  4. CheckBox: Enable Change Feed
  5. CheckBox: Track Last Access Time

## 📊 Test Scenarios

### Scenario 1: Default Configuration (Secure)
```json
{
  "storageAccountNamePrefix": "test",
  "storageAccountType": "Standard_LRS",
  "location": "uksouth",
  "applicationName": "TestApp"
  // All security/protection params use defaults
}
```
**Expected:**
- Public access: Blocked ✅
- TLS: 1.2 minimum ✅
- HTTPS: Required ✅
- Soft delete: 7 days ✅

### Scenario 2: Maximum Security
```json
{
  "storageAccountNamePrefix": "secure",
  "storageAccountType": "Standard_GRS",
  "location": "uksouth",
  "applicationName": "SecureApp",
  "allowBlobPublicAccess": false,
  "minimumTlsVersion": "TLS1_2",
  "supportsHttpsTrafficOnly": true,
  "publicNetworkAccess": "Disabled",
  "requireInfrastructureEncryption": true,
  "blobSoftDeleteDays": 30,
  "containerSoftDeleteDays": 30,
  "enableVersioning": true,
  "changeFeedEnabled": true,
  "lastAccessTimeTrackingEnabled": true
}
```
**Expected:**
- Public network: Disabled ✅
- Double encryption ✅
- 30-day retention ✅
- Versioning enabled ✅

### Scenario 3: Development (Relaxed)
```json
{
  "storageAccountNamePrefix": "dev",
  "storageAccountType": "Standard_LRS",
  "location": "uksouth",
  "applicationName": "DevApp",
  "allowBlobPublicAccess": true,
  "minimumTlsVersion": "TLS1_0",
  "blobSoftDeleteDays": 1,
  "containerSoftDeleteDays": 1
}
```
**Expected:**
- Public access: Allowed ⚠️
- TLS: 1.0+ ⚠️
- Soft delete: 1 day ⚠️

## 🔍 Validation Rules

### createUiDefinition.json Constraints

```javascript
// Blob Soft Delete Days
{
  "name": "blobSoftDeleteDays",
  "type": "Microsoft.Common.TextBox",
  "label": "Blob Soft Delete Days",
  "defaultValue": "7",
  "constraints": {
    "required": false,
    "regex": "^([1-9]|[1-9][0-9]|[1-2][0-9][0-9]|3[0-5][0-9]|36[0-5])$",
    "validationMessage": "Must be between 1 and 365 days"
  }
}

// Container Soft Delete Days
{
  "name": "containerSoftDeleteDays",
  "type": "Microsoft.Common.TextBox",
  "label": "Container Soft Delete Days",
  "defaultValue": "7",
  "constraints": {
    "required": false,
    "regex": "^([1-9]|[1-9][0-9]|[1-2][0-9][0-9]|3[0-5][0-9]|36[0-5])$",
    "validationMessage": "Must be between 1 and 365 days"
  }
}
```

## 📚 Documentation Snippets

### Security Features Description
```markdown
This template includes enterprise-grade security features:

- **TLS Enforcement**: Minimum TLS 1.2 by default
- **Public Access Control**: Block public blob access
- **HTTPS Only**: Force secure connections
- **Infrastructure Encryption**: Double encryption layer
- **Authentication**: OAuth and Shared Key support
```

### Data Protection Description
```markdown
Built-in data protection features:

- **Soft Delete**: 7-day retention for deleted blobs/containers
- **Versioning**: Maintain previous versions of blobs
- **Change Feed**: Audit log for all blob changes
- **Access Tracking**: Monitor last access times for lifecycle policies
```

## 🚀 Quick Commands

```bash
# Build and test enhanced templates
npm run build
npm test

# Create test package
npx azmp create storage --output ./test-enhanced

# Validate templates
npx azmp validate ./test-enhanced

# Deploy to Azure
az deployment group create \
  --resource-group rg-test-enhanced \
  --template-file ./test-enhanced/mainTemplate.json \
  --parameters @./test-enhanced/parameters.json

# Check security settings
az storage account show \
  --name <storage-account-name> \
  --resource-group rg-test-enhanced \
  --query '{publicAccess:allowBlobPublicAccess,tls:minimumTlsVersion,https:supportsHttpsTrafficOnly}'

# Check blob services settings
az storage account blob-service-properties show \
  --account-name <storage-account-name> \
  --resource-group rg-test-enhanced \
  --query '{softDelete:deleteRetentionPolicy,containerSoftDelete:containerDeleteRetentionPolicy,versioning:isVersioningEnabled}'
```

## ✅ Definition of Done

- [ ] All 12 parameters implemented in templates
- [ ] UI sections added to createUiDefinition.json
- [ ] View panels added to viewDefinition.json
- [ ] Handlebars templates updated
- [ ] TypeScript generator updated
- [ ] Unit tests added (12+ new tests)
- [ ] ARM-TTK validation passes
- [ ] Azure deployment succeeds (3 scenarios)
- [ ] Security settings verified in deployed resources
- [ ] Data protection features verified
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Git committed and pushed

---

**Ready to implement! 🚀**
