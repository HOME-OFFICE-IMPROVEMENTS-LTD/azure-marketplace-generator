# Storage Lifecycle Management Deployment Guide

## Prerequisites

- Azure subscription with Storage Account creation permissions

- Resource group for deployment

- Azure CLI or PowerShell (for command-line deployment)

## Deployment Methods

### Method 1: Azure Portal Deployment

1. **Access the Template**
   - Navigate to Azure Portal

   - Go to "Deploy a custom template"

   - Upload the `mainTemplate.json` file

2. **Configure Parameters**
   - **Storage Account Name Prefix**: Choose a unique prefix (max 11 characters)

   - **Performance Tier**: Select based on your performance requirements

   - **Lifecycle Management**: Configure retention policies

   - **Network Access**: Choose security configuration

3. **Deploy**
   - Review configuration

   - Click "Create" to deploy

### Method 2: Azure CLI Deployment

```bash

# Create resource group

az group create --name "rg-storage-lifecycle" --location "East US"

# Deploy template

az deployment group create \
  --resource-group "rg-storage-lifecycle" \
  --template-file "mainTemplate.json" \
  --parameters "parameters.json"

```

### Method 3: PowerShell Deployment

```powershell

# Create resource group

New-AzResourceGroup -Name "rg-storage-lifecycle" -Location "East US"

# Deploy template

New-AzResourceGroupDeployment `
  -ResourceGroupName "rg-storage-lifecycle" `
  -TemplateFile "mainTemplate.json" `
  -TemplateParameterFile "parameters.json"

```

## Post-Deployment Configuration

### 1. Verify Deployment

- Check storage account creation in Azure Portal

- Verify lifecycle policies are applied

- Test network connectivity (if private endpoint enabled)

### 2. Configure Monitoring

- Set up alerts for storage usage

- Configure cost monitoring

- Enable diagnostic logs

### 3. Test Functionality

- Upload test data to verify tiering

- Test static website hosting (if enabled)

- Verify backup and retention policies

## Troubleshooting

### Common Issues

**Storage Account Name Conflicts**

- Ensure the generated name is globally unique

- Try different prefix values

**Permission Errors**

- Verify subscription permissions

- Check resource group access

**Network Connectivity**

- Verify private endpoint configuration

- Check firewall rules and network settings

### Support

For technical support, please contact:

- Email: info@hoiltd.com

- Documentation: Available in the package README.md

## Security Considerations

- Review network access settings

- Configure appropriate RBAC permissions  

- Enable audit logging

- Regularly review lifecycle policies

## Cost Optimization Tips

- Configure appropriate lifecycle policies

- Monitor storage usage patterns

- Set up cost alerts

- Review tier transitions regularly
