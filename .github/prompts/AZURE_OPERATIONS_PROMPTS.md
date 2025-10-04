# Azure Resource Operations Prompts & Best Practices

## 🚨 MANDATORY CHECKS BEFORE AZURE OPERATIONS

### Pre-Operation Azure Checklist

```bash
# STOP! Before any Azure resource operation, verify:
□ Are you in the correct subscription and resource group?
□ Have you reviewed cost implications?
□ Are security requirements met?
□ Have you checked quota and limits?
□ Is the operation reversible or backed up?
□ Do you have proper permissions?
```

### Azure CLI Authentication Check

```bash
# Always verify your Azure context before operations:
az account show --output table
az account list --output table

# If needed, switch subscription:
az account set --subscription "subscription-name-or-id"

# Verify resource group exists:
az group show --name "your-resource-group-name"
```

### Cost Optimization Checklist

```bash
# Before creating/modifying Azure resources:
□ Choose appropriate pricing tier (not premium unless needed)
□ Select optimal region for your use case
□ Consider reserved instances for long-term resources
□ Review auto-scaling settings
□ Check for unused or orphaned resources
□ Implement proper tagging for cost tracking
□ Use Azure Cost Management alerts
```

### Security Configuration Prompts

```bash
# Azure security best practices checklist:
□ Enable Azure Security Center recommendations
□ Configure network security groups (NSGs)
□ Use managed identities instead of service principals
□ Enable diagnostic logging for all resources
□ Implement least privilege access (RBAC)
□ Enable Azure Monitor alerts
□ Configure backup and disaster recovery
□ Use Azure Key Vault for secrets
```

### Resource Tagging Standards

```bash
# MANDATORY tags for all resources:
{
  "Environment": "Development|Staging|Production",
  "Project": "azure-marketplace-generator",
  "Owner": "team-or-individual-email",
  "CostCenter": "department-or-budget-code",
  "CreatedDate": "YYYY-MM-DD",
  "Purpose": "brief-description"
}

# Example tagging command:
az resource tag --tags \
  Environment=Development \
  Project=azure-marketplace-generator \
  Owner=msalsouri@company.com \
  CostCenter=engineering \
  CreatedDate=2025-10-04 \
  Purpose=storage-marketplace-solution \
  --resource-group myRG \
  --name myResource \
  --resource-type Microsoft.Storage/storageAccounts
```

### Storage Account Configuration

```bash
# Storage account security and performance settings:
□ Enable secure transfer required (HTTPS only)
□ Configure minimum TLS version (1.2+)
□ Enable blob public access only if necessary
□ Configure network access rules
□ Enable soft delete for containers and blobs
□ Set up lifecycle management policies
□ Configure monitoring and alerts
□ Enable Azure Defender for Storage
```

### Event Grid Topic Configuration

```bash
# Event Grid security and reliability:
□ Configure proper authentication (SAS, AAD, or webhook)
□ Set up dead letter destination
□ Configure retry policies
□ Enable diagnostic logs
□ Set up monitoring and alerts
□ Implement proper filtering
□ Configure HTTPS endpoints only
□ Set appropriate message TTL
```

### Networking Best Practices

```bash
# Azure networking security checklist:
□ Use virtual networks (VNets) for resource isolation
□ Configure network security groups (NSGs)
□ Implement Azure Firewall or third-party NVA
□ Use private endpoints for PaaS services
□ Enable DDoS protection standard
□ Configure proper DNS resolution
□ Use Azure Bastion for secure VM access
□ Implement network monitoring
```

### Monitoring and Alerting Setup

```bash
# Essential monitoring configuration:
□ Enable Azure Monitor for all resources
□ Configure Log Analytics workspace
□ Set up Application Insights for applications
□ Create alerts for critical metrics
□ Configure action groups for notifications
□ Set up Azure Service Health alerts
□ Implement custom dashboard views
□ Configure log retention policies
```

### Backup and Recovery Procedures

```bash
# Backup strategy checklist:
□ Enable automated backups for databases
□ Configure blob storage backup policies
□ Set up Azure Site Recovery for VMs
□ Test recovery procedures regularly
□ Document recovery time objectives (RTO)
□ Document recovery point objectives (RPO)
□ Store backups in different regions
□ Verify backup integrity regularly
```

### Resource Scaling Considerations

```bash
# Auto-scaling configuration:
□ Define appropriate scaling metrics
□ Set conservative scale-out/scale-in rules
□ Configure cooldown periods
□ Set minimum and maximum instance counts
□ Test scaling behavior under load
□ Monitor scaling events and costs
□ Use predictive scaling when available
□ Configure notifications for scaling events
```

### Azure Policy Compliance

```bash
# Policy compliance checklist:
□ Review applicable Azure policies
□ Ensure resource configurations meet policy requirements
□ Check for policy violations before deployment
□ Understand exemption processes
□ Monitor compliance dashboard
□ Implement custom policies as needed
□ Document policy compliance procedures
```

### Common Azure Commands Reference

```bash
# Resource management
az resource list --resource-group myRG --output table
az resource show --resource-group myRG --name myResource --resource-type Microsoft.Storage/storageAccounts

# Monitoring and diagnostics
az monitor metrics list --resource-group myRG --resource myResource --metric-names "metric-name"
az monitor log-analytics query --workspace myWorkspace --analytics-query "query"

# Cost management
az consumption usage list --output table
az billing invoice list --output table

# Security
az security assessment list --output table
az keyvault secret list --vault-name myKeyVault --output table
```

## ⚠️ Critical Azure Operations Warnings

### NEVER Do These Without Extreme Caution:

- ❌ Delete production resources without verified backups
- ❌ Modify network security groups without testing
- ❌ Change authentication configurations without rollback plan
- ❌ Scale down critical services during business hours
- ❌ Deploy to production without staging validation
- ❌ Modify RBAC permissions without approval
- ❌ Delete storage accounts with important data
- ❌ Change DNS configurations without coordination

### Always Do These:

- ✅ Test in development/staging environments first
- ✅ Document changes and rollback procedures
- ✅ Monitor resource health after changes
- ✅ Verify cost implications before deployment
- ✅ Check security implications of all changes
- ✅ Coordinate with team for shared resources
- ✅ Use infrastructure as code when possible
- ✅ Maintain proper change management processes

## 🔧 Emergency Procedures

### Resource Recovery Commands

```bash
# Restore deleted resource group (if soft-deleted)
az group show --name deleted-rg

# Restore deleted storage account
az storage account restore --deleted-account-name myaccount --deleted-account-resource-group myRG

# Recover deleted key vault
az keyvault recover --name myvault

# Check activity logs for troubleshooting
az monitor activity-log list --resource-group myRG --max-events 50
```