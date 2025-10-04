# ARM Template Development Prompts & Checklists

## 🚨 MANDATORY CHECKS BEFORE ARM TEMPLATE MODIFICATIONS

### Pre-Edit Template Checklist

```bash
# STOP! Before editing any ARM template, verify:
□ Have you checked the latest Azure API version?
□ Are you following ARM-TTK validation rules?
□ Have you reviewed Azure best practices?
□ Is Customer Usage Attribution included?
□ Have you tested the template locally?
```

### API Version Validation Prompt

```bash
# Before using any Azure resource type:
# 1. Check latest API version using tools
# 2. Verify resource schema
# 3. Review breaking changes in changelog

# Template for checking API versions:
# Resource: Microsoft.Storage/storageAccounts
# Current: 2023-01-01
# Latest: [CHECK WITH TOOLS]
# Status: [CURRENT/OUTDATED/DEPRECATED]
```

### ARM Template Structure Checklist

```bash
# Mandatory ARM template structure:
□ $schema - correct API version
□ contentVersion - semantic versioning
□ parameters - proper types and metadata
□ variables - logical grouping
□ resources - latest API versions
□ outputs - meaningful return values
□ Customer Usage Attribution tracking
```

### Resource Naming Convention

```bash
# Naming template for resources:
# Pattern: [resourceType]-[environment]-[region]-[instance]
# Examples:
# Storage Account: "sto[uniqueString][environment]"
# Event Grid: "evgt-[purpose]-[uniqueString]"
# Resource Group: "rg-[projectname]-[environment]"

# Variables template:
"variables": {
  "storageAccountName": "[concat('sto', uniqueString(resourceGroup().id))]",
  "eventGridTopicName": "[concat('evgt-', parameters('projectName'), '-', uniqueString(resourceGroup().id))]"
}
```

### Parameter Definition Template

```bash
# Standard parameter structure:
{
  "parameters": {
    "parameterName": {
      "type": "string|int|bool|object|array",
      "metadata": {
        "description": "Clear description of parameter purpose"
      },
      "defaultValue": "safe-default-value",
      "allowedValues": ["option1", "option2"], // if applicable
      "minLength": 1, // for strings
      "maxLength": 50, // for strings
      "minValue": 1, // for integers
      "maxValue": 100 // for integers
    }
  }
}
```

### Customer Usage Attribution Template

```bash
# MANDATORY: Include this tracking resource in every template:
{
  "type": "Microsoft.Resources/deployments",
  "apiVersion": "2021-04-01",
  "name": "pid-3558aef5-9b17-4870-98ee-923a78ee4c87-partnercenter",
  "properties": {
    "mode": "Incremental",
    "template": {
      "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
      "contentVersion": "1.0.0.0",
      "resources": []
    }
  }
}
```

### Validation Commands

```bash
# Run these commands before committing template changes:

# 1. ARM-TTK Validation
Test-AzTemplate -TemplatePath "./azure-deployment/mainTemplate.json"

# 2. Azure CLI Validation
az deployment group validate \
  --resource-group test-rg \
  --template-file ./azure-deployment/mainTemplate.json \
  --parameters @./azure-deployment/parameters.json

# 3. What-If Analysis
az deployment group what-if \
  --resource-group test-rg \
  --template-file ./azure-deployment/mainTemplate.json \
  --parameters @./azure-deployment/parameters.json
```

### Security Review Checklist

```bash
# Security considerations for ARM templates:
□ No hardcoded secrets or passwords
□ Use Key Vault references for sensitive data
□ Proper RBAC assignments
□ Network security groups configured
□ Storage account secure transfer enabled
□ Event Grid authentication configured
□ Minimum required permissions only
□ Diagnostic logging enabled
```

### Performance Optimization

```bash
# ARM template performance best practices:
□ Use nested templates for complex deployments
□ Minimize template size and complexity
□ Use copy loops efficiently
□ Avoid unnecessary dependencies
□ Use condition property for optional resources
□ Optimize parameter and variable usage
□ Use unique deployment names
```

### Marketplace Compliance Checklist

```bash
# Partner Center validation requirements:
□ Template follows marketplace guidelines
□ Customer Usage Attribution included
□ Proper resource naming conventions
□ Required tags implemented
□ createUiDefinition.json aligned with template
□ All parameters properly exposed in UI
□ Outputs provide necessary information
□ No prohibited resource types used
```

### Testing Procedures

```bash
# Template testing workflow:
1. Local ARM-TTK validation
2. Azure CLI template validation
3. What-if deployment analysis
4. Test deployment in development environment
5. UI definition testing with createUiDefinition
6. End-to-end marketplace simulation
7. Resource cleanup verification
```

## ⚠️ Common ARM Template Mistakes to Avoid

- ❌ Using outdated API versions
- ❌ Missing Customer Usage Attribution
- ❌ Hardcoded values instead of parameters
- ❌ Improper dependency chains
- ❌ Missing required tags
- ❌ Overly complex single templates
- ❌ Poor error handling
- ❌ Inconsistent naming conventions
- ❌ Missing outputs for important values
- ❌ Security vulnerabilities in configurations

## 🔧 Quick Reference Commands

```bash
# Get latest API version for resource type
az provider show --namespace Microsoft.Storage --query "resourceTypes[?resourceType=='storageAccounts'].apiVersions[0]" --output tsv

# Validate template syntax
az deployment group validate --template-file template.json --parameters @parameters.json --resource-group myRG

# Deploy with what-if
az deployment group what-if --template-file template.json --parameters @parameters.json --resource-group myRG

# ARM-TTK validation
Test-AzTemplate -TemplatePath ./template.json
```