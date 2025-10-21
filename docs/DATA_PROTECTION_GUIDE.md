# Data Protection Guide

## Overview

This guide documents the data protection features implemented in Azure Marketplace Generator v3.0.0. These features protect your data from accidental deletion, track changes, and help meet compliance requirements. All parameters are verified against official Microsoft Azure documentation.

## Data Protection Features

### 1. Blob Soft Delete

**Parameter:** `deleteRetentionPolicy`

**Type:** Object

**Properties:**
- `enabled`: Boolean (default: `true`)
- `days`: Integer (range: 1-365, default: 7)

**Description:** Protects blob data from accidental deletion by retaining deleted blobs for a specified number of days.

**Benefits:**
- ✅ Recover accidentally deleted blobs
- ✅ Protection against application errors
- ✅ Compliance with data retention policies
- ✅ Time-based recovery window

**Official Documentation:**
- [Soft delete for blobs](https://learn.microsoft.com/en-us/azure/storage/blobs/soft-delete-blob-overview)
- [BlobServiceProperties.deleteRetentionPolicy](https://learn.microsoft.com/en-us/javascript/api/@azure/arm-storage/blobserviceproperties#@azure-arm-storage-blobserviceproperties-deleteretentionpolicy)

**ARM Template Example:**
```json
{
  "type": "Microsoft.Storage/storageAccounts/blobServices",
  "name": "[concat(parameters('storageAccountName'), '/default')]",
  "properties": {
    "deleteRetentionPolicy": {
      "enabled": true,
      "days": 30
    }
  }
}
```

**Recommended Settings:**
- **Development:** 7 days
- **Production:** 30 days
- **Compliance:** 90-365 days (based on requirements)

---

### 2. Container Soft Delete

**Parameter:** `containerDeleteRetentionPolicy`

**Type:** Object

**Properties:**
- `enabled`: Boolean (default: `true`)
- `days`: Integer (range: 1-365, default: 7)

**Description:** Protects blob containers from accidental deletion by retaining deleted containers for a specified number of days.

**Benefits:**
- ✅ Recover accidentally deleted containers
- ✅ Protection against mass deletion
- ✅ Preserves container metadata
- ✅ Independent retention from blob soft delete

**Official Documentation:**
- [Soft delete for containers](https://learn.microsoft.com/en-us/azure/storage/blobs/soft-delete-container-overview)
- [BlobServiceProperties.containerDeleteRetentionPolicy](https://learn.microsoft.com/en-us/javascript/api/@azure/arm-storage/blobserviceproperties#@azure-arm-storage-blobserviceproperties-containerdeleteretentionpolicy)

**ARM Template Example:**
```json
{
  "type": "Microsoft.Storage/storageAccounts/blobServices",
  "name": "[concat(parameters('storageAccountName'), '/default')]",
  "properties": {
    "containerDeleteRetentionPolicy": {
      "enabled": true,
      "days": 30
    }
  }
}
```

**Recommended Settings:**
- **Development:** 7 days
- **Production:** 30 days
- **Compliance:** 90-365 days (based on requirements)

---

### 3. Blob Versioning

**Parameter:** `isVersioningEnabled`

**Type:** Boolean

**Default:** `true`

**Description:** Automatically maintains previous versions of a blob when it is modified or deleted.

**Benefits:**
- ✅ Complete version history
- ✅ Point-in-time recovery
- ✅ Protection against overwrites
- ✅ Compliance and audit requirements
- ✅ Works seamlessly with soft delete

**Official Documentation:**
- [Blob versioning](https://learn.microsoft.com/en-us/azure/storage/blobs/versioning-overview)
- [BlobServiceProperties.isVersioningEnabled](https://learn.microsoft.com/en-us/javascript/api/@azure/arm-storage/blobserviceproperties#@azure-arm-storage-blobserviceproperties-isversioningenabled)

**ARM Template Example:**
```json
{
  "type": "Microsoft.Storage/storageAccounts/blobServices",
  "name": "[concat(parameters('storageAccountName'), '/default')]",
  "properties": {
    "isVersioningEnabled": true
  }
}
```

**How It Works:**
1. When a blob is modified, the previous version is preserved
2. Current version is always accessible via the base blob URI
3. Previous versions accessible via version ID
4. Versions can be listed, read, or promoted to current

**Cost Considerations:**
- Each version counts as a separate blob for storage costs
- Consider lifecycle management policies to delete old versions
- Recommended: Enable for critical data only

---

### 4. Change Feed

**Parameter:** `changeFeed`

**Type:** Object

**Properties:**
- `enabled`: Boolean (default: `false`)
- `retentionInDays`: Integer (optional, default: unlimited)

**Description:** Provides ordered, guaranteed, durable, immutable, read-only logs of all changes to blobs and blob metadata.

**Benefits:**
- ✅ Complete audit trail of all changes
- ✅ Event-driven architectures
- ✅ Compliance and forensics
- ✅ Data replication and synchronization
- ✅ Immutable change log

**Official Documentation:**
- [Change feed support](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blob-change-feed)
- [BlobServiceProperties.changeFeed](https://learn.microsoft.com/en-us/javascript/api/@azure/arm-storage/blobserviceproperties)

**ARM Template Example:**
```json
{
  "type": "Microsoft.Storage/storageAccounts/blobServices",
  "name": "[concat(parameters('storageAccountName'), '/default')]",
  "properties": {
    "changeFeed": {
      "enabled": true,
      "retentionInDays": 90
    }
  }
}
```

**Change Feed Events Include:**
- Blob creation
- Blob modification
- Blob deletion
- Container creation/deletion
- Metadata changes

**Use Cases:**
- Audit and compliance logging
- Data synchronization between regions
- Event-driven processing pipelines
- Backup and disaster recovery
- Analytics and reporting

**Cost Considerations:**
- Storage costs for change feed logs
- Retention period affects storage costs
- Consider retention period based on compliance needs

---

### 5. Last Access Time Tracking

**Parameter:** `lastAccessTimeTrackingPolicy`

**Type:** Object

**Properties:**
- `enabled`: Boolean (default: `false`)
- `name`: String (value: `"AccessTimeTracking"`)
- `trackingGranularityInDays`: Integer (optional)
- `blobType`: Array of strings (optional, e.g., `["blockBlob"]`)

**Description:** Tracks the last time each blob was accessed (read), enabling data lifecycle management based on access patterns.

**Benefits:**
- ✅ Optimize storage costs
- ✅ Identify cold/inactive data
- ✅ Intelligent tiering decisions
- ✅ Data lifecycle automation
- ✅ Compliance reporting

**Official Documentation:**
- [Optimize costs by managing data lifecycle](https://learn.microsoft.com/en-us/azure/storage/blobs/lifecycle-management-overview)
- [BlobServiceProperties.lastAccessTimeTrackingPolicy](https://learn.microsoft.com/en-us/javascript/api/@azure/arm-storage/blobserviceproperties#@azure-arm-storage-blobserviceproperties-lastaccesstimetrackingpolicy)

**ARM Template Example:**
```json
{
  "type": "Microsoft.Storage/storageAccounts/blobServices",
  "name": "[concat(parameters('storageAccountName'), '/default')]",
  "properties": {
    "lastAccessTimeTrackingPolicy": {
      "enabled": true,
      "name": "AccessTimeTracking",
      "trackingGranularityInDays": 1,
      "blobType": ["blockBlob"]
    }
  }
}
```

**Use Cases:**
- Automatically tier rarely accessed data to Cool or Archive
- Delete blobs that haven't been accessed in X days
- Generate reports on data access patterns
- Optimize storage costs for large datasets

**Integration with Lifecycle Management:**
```json
{
  "rules": [
    {
      "name": "tierColdData",
      "type": "Lifecycle",
      "definition": {
        "filters": {
          "blobTypes": ["blockBlob"]
        },
        "actions": {
          "baseBlob": {
            "tierToCool": {
              "daysAfterLastAccessTimeGreaterThan": 30
            },
            "tierToArchive": {
              "daysAfterLastAccessTimeGreaterThan": 90
            }
          }
        }
      }
    }
  ]
}
```

---

## Data Protection Best Practices

### 🎯 Recommended Protection Profile

For **production environments** with critical data:

```json
{
  "deleteRetentionPolicy": {
    "enabled": true,
    "days": 30
  },
  "containerDeleteRetentionPolicy": {
    "enabled": true,
    "days": 30
  },
  "isVersioningEnabled": true,
  "changeFeed": {
    "enabled": true,
    "retentionInDays": 90
  },
  "lastAccessTimeTrackingPolicy": {
    "enabled": true,
    "name": "AccessTimeTracking",
    "trackingGranularityInDays": 1,
    "blobType": ["blockBlob"]
  }
}
```

### 📊 Protection Level Matrix

| Data Sensitivity | Blob Soft Delete | Container Soft Delete | Versioning | Change Feed | Access Tracking |
|------------------|------------------|----------------------|------------|-------------|-----------------|
| **Critical** | 90-365 days | 90-365 days | ✅ Enabled | ✅ Enabled (90+ days) | ✅ Enabled |
| **Important** | 30-90 days | 30-90 days | ✅ Enabled | ✅ Enabled (30-90 days) | ✅ Enabled |
| **Standard** | 7-30 days | 7-30 days | ✅ Enabled | Optional | ✅ Enabled |
| **Temporary** | 7 days | 7 days | ❌ Disabled | ❌ Disabled | Optional |

### 🔐 Compliance Mapping

| Compliance Framework | Required Features |
|---------------------|-------------------|
| **GDPR** | Soft Delete (30+ days), Versioning, Change Feed for audit |
| **HIPAA** | Soft Delete (30+ days), Versioning, Change Feed, Immutability policies |
| **SOX** | Versioning, Change Feed (90+ days), Immutability policies |
| **PCI-DSS** | Soft Delete, Versioning, Change Feed for audit trail |

---

## Recovery Scenarios

### Scenario 1: Recover Accidentally Deleted Blob

**Prerequisite:** Blob soft delete enabled

```bash
# List deleted blobs
az storage blob list \
  --account-name mystorageaccount \
  --container-name mycontainer \
  --include d \
  --output table

# Undelete blob
az storage blob undelete \
  --account-name mystorageaccount \
  --container-name mycontainer \
  --name myblob.txt
```

### Scenario 2: Recover Accidentally Deleted Container

**Prerequisite:** Container soft delete enabled

```bash
# List deleted containers
az storage container list \
  --account-name mystorageaccount \
  --include-deleted \
  --output table

# Restore container
az storage container restore \
  --account-name mystorageaccount \
  --name mycontainer \
  --deleted-version "2025-10-21T10:30:00.0000000Z"
```

### Scenario 3: Restore Previous Blob Version

**Prerequisite:** Blob versioning enabled

```bash
# List blob versions
az storage blob list \
  --account-name mystorageaccount \
  --container-name mycontainer \
  --prefix myblob.txt \
  --include v \
  --output table

# Copy specific version to current
az storage blob copy start \
  --account-name mystorageaccount \
  --destination-container mycontainer \
  --destination-blob myblob.txt \
  --source-container mycontainer \
  --source-blob myblob.txt \
  --source-version-id "2025-10-21T10:00:00.0000000Z"
```

### Scenario 4: Query Change Feed

**Prerequisite:** Change feed enabled

```bash
# Process change feed using Azure Storage SDK
# See: https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blob-change-feed-how-to
```

---

## Cost Optimization Strategies

### 1. Balance Protection vs. Cost

```json
{
  "deleteRetentionPolicy": {
    "enabled": true,
    "days": 30  // Shorter for non-critical data
  },
  "isVersioningEnabled": true,
  "changeFeed": {
    "enabled": true,
    "retentionInDays": 30  // Limit retention period
  }
}
```

### 2. Implement Lifecycle Management

```json
{
  "rules": [
    {
      "name": "deleteOldVersions",
      "type": "Lifecycle",
      "definition": {
        "actions": {
          "version": {
            "delete": {
              "daysAfterCreationGreaterThan": 90
            }
          }
        }
      }
    }
  ]
}
```

### 3. Use Access Tracking for Tiering

```json
{
  "lastAccessTimeTrackingPolicy": {
    "enabled": true
  },
  "lifecycleRules": {
    "tierToCool": {
      "daysAfterLastAccessTimeGreaterThan": 30
    }
  }
}
```

---

## Monitoring and Alerts

### Recommended Azure Monitor Metrics

- `BlobCapacity` - Track storage growth
- `Transactions` - Monitor access patterns
- `SuccessServerLatency` - Performance monitoring
- `DeletedBlobs` - Track deletions
- `BlobVersions` - Monitor version count

### Recommended Alert Rules

```json
{
  "alerts": [
    {
      "name": "HighDeletionRate",
      "metric": "Transactions",
      "operation": "Delete",
      "threshold": 100,
      "window": "PT5M"
    },
    {
      "name": "ExcessiveVersions",
      "metric": "BlobVersions",
      "threshold": 1000,
      "window": "PT1H"
    }
  ]
}
```

---

## Additional Resources

### Microsoft Documentation

- [Data protection overview](https://learn.microsoft.com/en-us/azure/storage/blobs/data-protection-overview)
- [Soft delete for blobs](https://learn.microsoft.com/en-us/azure/storage/blobs/soft-delete-blob-overview)
- [Soft delete for containers](https://learn.microsoft.com/en-us/azure/storage/blobs/soft-delete-container-overview)
- [Blob versioning](https://learn.microsoft.com/en-us/azure/storage/blobs/versioning-overview)
- [Change feed support](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blob-change-feed)
- [Lifecycle management](https://learn.microsoft.com/en-us/azure/storage/blobs/lifecycle-management-overview)

### Azure Verified Modules

- [Storage Account Module - Blob Services](https://github.com/Azure/bicep-registry-modules/tree/main/avm/res/storage/storage-account#parameter-blobservices)

### SDKs and APIs

- [@azure/arm-storage SDK](https://learn.microsoft.com/en-us/javascript/api/@azure/arm-storage/)
- [BlobServiceProperties Interface](https://learn.microsoft.com/en-us/javascript/api/@azure/arm-storage/blobserviceproperties)

---

*Last Updated: October 21, 2025*
*Version: 3.0.0*
