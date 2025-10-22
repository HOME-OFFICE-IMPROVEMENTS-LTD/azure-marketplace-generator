# Data Protection Guide

Comprehensive guide to data protection, backup, recovery, and disaster planning for Azure Marketplace Generator templates.

## Overview

Azure Marketplace Generator templates include enterprise-grade data protection features that ensure business continuity, compliance, and data recovery capabilities.

## Data Protection Features

### Summary Table

| Feature | Purpose | Retention | Cost Impact | Recommended |
|---------|---------|-----------|-------------|-------------|
| **Blob Soft Delete** | Recover deleted blobs | 7-365 days | Low | ✅ Yes |
| **Container Soft Delete** | Recover deleted containers | 7-365 days | Low | ✅ Yes |
| **Blob Versioning** | Track blob modifications | Automatic | Medium | ✅ Yes |
| **Change Feed** | Audit trail of changes | 7-146,000 days | Low | ✅ Yes |
| **Last Access Time** | Cost optimization tracking | Continuous | None | ✅ Yes |
| **Point-in-Time Restore** | Restore to specific time | 1-365 days | Medium | Optional |
| **Geo-Redundancy** | Multi-region replication | Real-time | High | Optional |

## 1. Blob Soft Delete

### What It Does

Protects blobs from accidental deletion by retaining deleted data for a configurable retention period.

### Configuration

**Default (7 days):**

```json
{
  "properties": {
    "deleteRetentionPolicy": {
      "enabled": true,
      "days": 7
    }
  }
}
```

**Extended retention (365 days):**

```json
{
  "properties": {
    "deleteRetentionPolicy": {
      "enabled": true,
      "days": 365
    }
  }
}
```

### CLI Usage

```bash
# Create with default soft delete (7 days)
azmp create storage --name "MyStorage" --publisher "Acme"

# Custom retention period
azmp create storage \
  --name "MyStorage" \
  --publisher "Acme" \
  --blob-soft-delete-days 90
```

### Recovery Process

**Using Azure Portal:**

1. Navigate to Storage Account → Containers → [Container]
2. Click **"Show deleted blobs"**
3. Select deleted blob
4. Click **"Undelete"**

**Using Azure CLI:**

```bash
# List deleted blobs
az storage blob list \
  --container-name mycontainer \
  --account-name mystorageaccount \
  --include d

# Undelete blob
az storage blob undelete \
  --container-name mycontainer \
  --name myblob.txt \
  --account-name mystorageaccount
```

**Using PowerShell:**

```powershell
# Get deleted blobs
Get-AzStorageBlob -Container "mycontainer" -Context $ctx -IncludeDeleted

# Restore deleted blob
Restore-AzStorageBlob -Container "mycontainer" -Blob "myblob.txt" -Context $ctx
```

### Best Practices

- ✅ **Minimum 7 days** for development environments
- ✅ **30-90 days** for production environments
- ✅ **365 days** for compliance-critical data
- ⚠️ Consider **storage costs** for large data volumes

### Cost Impact

- **Storage cost:** Pay for retained deleted data
- **Formula:** `deleted_data_size × retention_days × storage_price`
- **Example:** 100GB deleted data × 90 days retention = ~$1.80/month (Standard)

## 2. Container Soft Delete

### What It Does

Protects entire containers from accidental deletion, including all blobs within.

### Configuration

```json
{
  "properties": {
    "containerDeleteRetentionPolicy": {
      "enabled": true,
      "days": 7
    }
  }
}
```

### CLI Usage

```bash
# Default (7 days)
azmp create storage --name "MyStorage" --publisher "Acme"

# Custom retention
azmp create storage \
  --name "MyStorage" \
  --publisher "Acme" \
  --container-soft-delete-days 30
```

### Recovery Process

**Using Azure Portal:**

1. Navigate to Storage Account → Containers
2. Click **"Show deleted containers"**
3. Select deleted container
4. Click **"Recover"**

**Using Azure CLI:**

```bash
# List deleted containers
az storage container list \
  --account-name mystorageaccount \
  --include-deleted

# Restore container
az storage container restore \
  --account-name mystorageaccount \
  --name mycontainer \
  --deleted-version "01234567890123"
```

### Best Practices

- ✅ **Match blob soft delete retention** for consistency
- ✅ **Longer retention** for critical containers
- ✅ **Test recovery** procedures regularly
- ⚠️ **Document** container naming conventions

## 3. Blob Versioning

### What It Does

Automatically maintains previous versions of blobs when modified, enabling rollback to any version.

### Configuration

```json
{
  "properties": {
    "isVersioningEnabled": true
  }
}
```

### How It Works

Every time a blob is modified:

1. Current version becomes a previous version
2. New version is created with timestamp
3. All versions accessible via unique version ID
4. Delete operations create new version marker

### Version Management

**List versions:**

```bash
az storage blob list \
  --container-name mycontainer \
  --account-name mystorageaccount \
  --include v
```

**Download specific version:**

```bash
az storage blob download \
  --container-name mycontainer \
  --name myblob.txt \
  --version-id "2024-10-22T10:30:45.1234567Z" \
  --account-name mystorageaccount \
  --file ./myblob-v1.txt
```

**Promote version to current:**

```bash
az storage blob copy start \
  --source-container mycontainer \
  --source-blob myblob.txt \
  --source-blob-version-id "2024-10-22T10:30:45.1234567Z" \
  --destination-container mycontainer \
  --destination-blob myblob.txt \
  --account-name mystorageaccount
```

### Lifecycle Management

Automatically delete old versions to control costs:

```json
{
  "rules": [
    {
      "name": "delete-old-versions",
      "enabled": true,
      "type": "Lifecycle",
      "definition": {
        "filters": {
          "blobTypes": ["blockBlob"]
        },
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

### Best Practices

- ✅ **Enable for all production data**
- ✅ **Combine with lifecycle policies** to manage costs
- ✅ **Document version retention policy**
- ⚠️ **Monitor storage growth** from versions
- ⚠️ **Test version restoration** procedures

### Cost Impact

- **Storage cost:** Each version consumes storage
- **Mitigation:** Use lifecycle management to delete old versions
- **Example:** 1GB blob modified 100 times = 100GB total (without lifecycle)

## 4. Change Feed

### What It Does

Creates an ordered, immutable log of all blob and container changes for auditing and compliance.

### Configuration

```json
{
  "properties": {
    "changeFeed": {
      "enabled": true,
      "retentionInDays": 90
    }
  }
}
```

### Retention Options

| Retention | Use Case | Cost |
|-----------|----------|------|
| **7 days** | Short-term audit | Low |
| **30 days** | Standard compliance | Medium |
| **90 days** | Extended audit trail | Medium |
| **365 days** | Long-term compliance | High |
| **146,000 days** | Maximum retention | Very High |

### Accessing Change Feed

**Using Azure SDK (.NET):**

```csharp
BlobServiceClient blobServiceClient = new BlobServiceClient(connectionString);
BlobChangeFeedClient changeFeedClient = blobServiceClient.GetChangeFeedClient();

var changes = changeFeedClient.GetChanges();
foreach (var change in changes)
{
    Console.WriteLine($"Event: {change.EventType}");
    Console.WriteLine($"Subject: {change.Subject}");
    Console.WriteLine($"Time: {change.EventTime}");
}
```

**Using Azure CLI (query logs):**

```bash
# Query change feed logs
az monitor log-analytics query \
  --workspace <workspace-id> \
  --analytics-query "StorageBlobLogs | where TimeGenerated > ago(24h)" \
  --output table
```

### Common Queries

**Recent changes:**

```kql
StorageBlobLogs
| where TimeGenerated > ago(24h)
| summarize count() by OperationName, bin(TimeGenerated, 1h)
| order by TimeGenerated desc
```

**Deleted blobs:**

```kql
StorageBlobLogs
| where OperationName == "DeleteBlob"
| where TimeGenerated > ago(7d)
| project TimeGenerated, Uri, CallerIpAddress
```

**Large uploads:**

```kql
StorageBlobLogs
| where OperationName == "PutBlob"
| where ObjectSize > 1000000000  // > 1GB
| project TimeGenerated, Uri, ObjectSize
```

### Best Practices

- ✅ **Enable for compliance** requirements
- ✅ **30+ days retention** for most scenarios
- ✅ **Integrate with SIEM** systems
- ✅ **Regular log analysis** for anomalies

## 5. Last Access Time Tracking

### What It Does

Tracks when each blob was last accessed for cost optimization and lifecycle management.

### Configuration

```json
{
  "properties": {
    "lastAccessTimeTrackingPolicy": {
      "enable": true,
      "name": "AccessTimeTracking",
      "trackingGranularityInDays": 1,
      "blobType": ["blockBlob"]
    }
  }
}
```

### Use Cases

**1. Move cold data to cool storage:**

```json
{
  "rules": [
    {
      "name": "move-to-cool",
      "enabled": true,
      "type": "Lifecycle",
      "definition": {
        "actions": {
          "baseBlob": {
            "tierToCool": {
              "daysAfterLastAccessTimeGreaterThan": 30
            }
          }
        }
      }
    }
  ]
}
```

**2. Archive rarely accessed data:**

```json
{
  "actions": {
    "baseBlob": {
      "tierToArchive": {
        "daysAfterLastAccessTimeGreaterThan": 180
      }
    }
  }
}
```

**3. Delete unused data:**

```json
{
  "actions": {
    "baseBlob": {
      "delete": {
        "daysAfterLastAccessTimeGreaterThan": 365
      }
    }
  }
}
```

### Cost Optimization

**Example scenario:**

- **Hot storage:** $0.018/GB/month
- **Cool storage:** $0.01/GB/month
- **Archive storage:** $0.00099/GB/month

**Savings:**

- 1TB data not accessed in 30 days → Move to Cool = **$8/month savings**
- 1TB data not accessed in 180 days → Move to Archive = **$17/month savings**

## Backup and Recovery Strategies

### Strategy 1: Soft Delete Only (Basic)

**Best for:** Development, non-critical data

**Configuration:**

```bash
azmp create storage \
  --name "DevStorage" \
  --publisher "DevTeam" \
  --blob-soft-delete-days 7 \
  --container-soft-delete-days 7
```

**Recovery capabilities:**
- ✅ Recover from accidental deletion
- ❌ No point-in-time restore
- ❌ No version history

### Strategy 2: Versioning + Soft Delete (Standard)

**Best for:** Production data, general use

**Configuration:**

```bash
azmp create storage \
  --name "ProdStorage" \
  --publisher "ProdTeam" \
  --blob-soft-delete-days 30 \
  --container-soft-delete-days 30 \
  --enable-versioning
```

**Recovery capabilities:**
- ✅ Recover from accidental deletion
- ✅ Rollback to previous versions
- ✅ Audit trail via change feed
- ❌ No point-in-time restore

### Strategy 3: Full Protection (Enterprise)

**Best for:** Mission-critical, compliance data

**Configuration:**

```bash
azmp create storage \
  --name "EnterpriseStorage" \
  --publisher "Enterprise" \
  --blob-soft-delete-days 90 \
  --container-soft-delete-days 90 \
  --enable-versioning \
  --change-feed-retention 365 \
  --enable-point-in-time-restore \
  --point-in-time-restore-days 30 \
  --geo-redundancy "RA-GRS"
```

**Recovery capabilities:**
- ✅ Recover from accidental deletion
- ✅ Rollback to previous versions
- ✅ Restore to any point in time (30 days)
- ✅ Geographic redundancy
- ✅ Complete audit trail (1 year)

## Disaster Recovery Planning

### Recovery Time Objective (RTO)

Time to restore service after disaster.

| Strategy | RTO | Configuration |
|----------|-----|---------------|
| **Local redundancy (LRS)** | Minutes | Single datacenter |
| **Zone redundancy (ZRS)** | Minutes | Multiple zones |
| **Geo-redundancy (GRS)** | Hours | Secondary region (manual) |
| **RA-GRS** | Minutes | Secondary region (read-only) |

### Recovery Point Objective (RPO)

Maximum acceptable data loss.

| Strategy | RPO | Configuration |
|----------|-----|---------------|
| **Soft delete** | 0 (if within retention) | Retention period |
| **Versioning** | 0 (all versions kept) | With lifecycle |
| **Point-in-time restore** | 0 (within window) | Restore window |
| **Geo-replication** | ~15 minutes | GRS/RA-GRS |

### Disaster Recovery Runbook

**1. Minor incident (accidental deletion):**

```bash
# Restore deleted blob (soft delete)
az storage blob undelete \
  --container-name mycontainer \
  --name myblob.txt \
  --account-name mystorageaccount
```

**2. Major incident (container corruption):**

```bash
# Restore container (container soft delete)
az storage container restore \
  --account-name mystorageaccount \
  --name mycontainer \
  --deleted-version "01234567890123"
```

**3. Critical incident (account compromise):**

```bash
# Failover to secondary region (RA-GRS)
az storage account failover \
  --name mystorageaccount \
  --resource-group myResourceGroup \
  --yes
```

**4. Data corruption (point-in-time):**

```bash
# Restore to point in time
az storage account blob-service-properties update \
  --account-name mystorageaccount \
  --enable-restore-policy true \
  --restore-days 30

# Perform restore
az storage blob restore \
  --account-name mystorageaccount \
  --time-to-restore "2024-10-22T10:00:00Z" \
  --blob-range container1/prefix1
```

## Compliance and Legal Hold

### Immutability Policies

Prevent modification or deletion for compliance (WORM - Write Once, Read Many).

**Time-based retention:**

```json
{
  "immutabilityPolicy": {
    "immutabilityPeriodSinceCreationInDays": 2555,
    "state": "Unlocked"
  }
}
```

**Legal hold:**

```json
{
  "legalHold": {
    "tags": ["case-123", "audit-2024"],
    "hasLegalHold": true
  }
}
```

### Compliance Retention

| Regulation | Retention | Implementation |
|------------|-----------|----------------|
| **GDPR** | Varies | Soft delete + versioning |
| **HIPAA** | 6 years | Immutability policy (2190 days) |
| **SOX** | 7 years | Immutability policy (2555 days) |
| **SEC 17a-4** | 7 years | Immutability + legal hold |

## Monitoring and Alerts

### Key Metrics to Monitor

**1. Soft delete usage:**

```kql
StorageBlobLogs
| where OperationName == "UndeleteBlob"
| summarize RecoveryCount = count() by bin(TimeGenerated, 1d)
```

**2. Version growth:**

```kql
StorageBlobLogs
| where OperationName == "PutBlob"
| summarize VersionCount = count() by AccountName, bin(TimeGenerated, 1h)
```

**3. Storage capacity:**

```kql
StorageAccountCapacity
| where TimeGenerated > ago(30d)
| summarize avg(UsedCapacity) by bin(TimeGenerated, 1d)
```

### Alert Configuration

**High recovery rate:**

```json
{
  "alertRule": {
    "name": "High Undelete Rate",
    "condition": {
      "query": "StorageBlobLogs | where OperationName == 'UndeleteBlob' | count",
      "threshold": 100,
      "timeAggregation": "Total"
    },
    "actions": {
      "emailTo": ["admin@company.com"]
    }
  }
}
```

## Best Practices Summary

### ✅ DO

- **Enable soft delete** for all storage accounts (minimum 7 days)
- **Use versioning** for production data
- **Enable change feed** for compliance tracking
- **Test recovery procedures** regularly
- **Monitor storage growth** from protection features
- **Use lifecycle policies** to manage costs
- **Document recovery procedures** in runbooks
- **Set up alerts** for unusual activity

### ❌ DON'T

- **Disable data protection** in production
- **Ignore storage costs** from versioning
- **Skip regular backup testing**
- **Use soft delete as only backup** for critical data
- **Forget to clean up old versions**
- **Overlook compliance requirements**

## Next Steps

- **[Security Features](Security-Features)** - Security configuration
- **[Configuration Guide](Configuration-Guide)** - Configure data protection
- **[FAQ](FAQ)** - Common questions

---

**Questions?** Ask in [GitHub Discussions](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/discussions)
