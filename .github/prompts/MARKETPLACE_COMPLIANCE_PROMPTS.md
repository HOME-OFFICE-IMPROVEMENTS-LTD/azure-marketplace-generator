# Partner Center & Marketplace Compliance Prompts

## 🚨 MANDATORY CHECKS BEFORE MARKETPLACE OPERATIONS

### Pre-Publishing Validation Checklist

```bash
# STOP! Before any Partner Center submission, verify:
□ ARM-TTK validation passes with zero errors
□ Customer Usage Attribution correctly implemented
□ createUiDefinition.json tested and validated
□ All required metadata fields completed
□ Test deployment successful in clean subscription
□ Screenshots and descriptions updated
□ Pricing model properly configured
```

### ARM Template Marketplace Requirements

```bash
# Partner Center ARM template validation:
□ Template follows Azure Resource Manager best practices
□ All parameters exposed in createUiDefinition.json
□ Customer Usage Attribution (CUA) tracking implemented
□ No hardcoded values or secrets
□ Proper resource naming conventions
□ Required tags implemented
□ Outputs provide meaningful information
□ Template size under limits (4MB compressed)
□ Dependencies properly defined
```

### Customer Usage Attribution (CUA) Validation

```bash
# MANDATORY: Verify CUA tracking resource exists:
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

# Verification steps:
□ CUA resource present in mainTemplate.json
□ Partner ID matches Partner Center account
□ Resource name includes "partnercenter" suffix
□ Deployment mode set to "Incremental"
```

### createUiDefinition.json Validation

```bash
# UI definition validation checklist:
□ All mainTemplate.json parameters included
□ Parameter types match between template and UI definition
□ Default values align with template constraints
□ Required fields properly marked
□ Validation rules implemented for user inputs
□ Proper grouping and step organization
□ Clear descriptions and help text provided
□ No orphaned or unused parameters
□ Output section maps to template parameters
```

### Testing Procedure Before Submission

```bash
# Complete testing workflow:

# 1. Clean subscription testing
az group create --name marketplace-test-rg --location eastus

# 2. Deploy from marketplace (simulate customer experience)
az deployment group create \
  --resource-group marketplace-test-rg \
  --template-file ./azure-deployment/mainTemplate.json \
  --parameters @./azure-deployment/parameters.json

# 3. Verify all resources created correctly
az resource list --resource-group marketplace-test-rg --output table

# 4. Test resource functionality
# - Storage account accessible
# - Event Grid topics created
# - Proper permissions set
# - Monitoring configured

# 5. Cleanup test resources
az group delete --name marketplace-test-rg --yes --no-wait
```

### Partner Center Listing Requirements

```bash
# Marketplace listing checklist:
□ Offer name and description compelling and accurate
□ Proper categorization selected
□ Keywords relevant and searchable
□ Logo images meet size and format requirements
□ Screenshots show actual solution (not generic)
□ Pricing model correctly configured
□ Support information complete and current
□ Privacy policy and terms of use links valid
□ Preview audience properly configured
```

### ARM-TTK Validation Commands

```bash
# Run comprehensive ARM-TTK validation:

# Test main template
Test-AzTemplate -TemplatePath "./azure-deployment/mainTemplate.json"

# Test createUiDefinition
Test-AzMarketplacePackage -Path "./azure-deployment"

# Specific marketplace tests
Test-AzTemplate -TemplatePath "./azure-deployment/mainTemplate.json" -Test "Template Should Not Contain Hardcoded Values"
Test-AzTemplate -TemplatePath "./azure-deployment/mainTemplate.json" -Test "Outputs Must Not Contain Secrets"
Test-AzTemplate -TemplatePath "./azure-deployment/mainTemplate.json" -Test "Parameter Must Be Referenced"
```

### Certification Submission Checklist

```bash
# Before clicking "Publish" in Partner Center:
□ All validation tests passed
□ Preview deployment tested successfully
□ Customer support documentation ready
□ Pricing validated and approved
□ Legal review completed (if required)
□ Technical review completed
□ Marketing materials reviewed
□ Support team notified of pending publication
□ Rollback plan documented
```

### Post-Publication Monitoring

```bash
# After marketplace publication:
□ Monitor Partner Center analytics dashboard
□ Check for customer deployment errors
□ Monitor support ticket queue
□ Review customer feedback and ratings
□ Track usage analytics and trends
□ Monitor Azure costs for CUA tracking
□ Update documentation based on customer feedback
```

### Common Marketplace Validation Failures

```bash
# Frequent failure points to check:

❌ Missing Customer Usage Attribution
❌ createUiDefinition.json parameter mismatch
❌ Hardcoded values in ARM template
❌ Invalid resource naming conventions
❌ Missing required outputs
❌ Incorrect API versions (too old)
❌ Template size exceeds limits
❌ Missing marketplace metadata
❌ Improper dependency definitions
❌ Security vulnerabilities in configuration
```

### Emergency Marketplace Procedures

```bash
# If marketplace listing needs urgent fix:

# 1. Identify the issue
# 2. Create hotfix branch
git checkout main
git checkout -b hotfix/marketplace-critical-fix

# 3. Make minimal necessary changes
# 4. Test changes in isolation
# 5. Update Partner Center immediately
# 6. Monitor deployment success
# 7. Create post-mortem documentation
```

### Version Management for Marketplace

```bash
# Marketplace versioning strategy:
□ Semantic versioning (MAJOR.MINOR.PATCH)
□ Update contentVersion in ARM template
□ Update package metadata
□ Clear changelog documentation
□ Backward compatibility considerations
□ Migration guidance for existing customers
□ Deprecation timeline for old versions
```

### Customer Support Preparation

```bash
# Support readiness checklist:
□ Deployment troubleshooting guide ready
□ Common error messages documented
□ Contact information current in listing
□ Support ticket escalation process defined
□ Technical FAQ prepared
□ Video tutorials or documentation links
□ Sample configurations available
□ Monitoring and diagnostic procedures documented
```

### Compliance and Legal Considerations

```bash
# Legal and compliance checklist:
□ Privacy policy complies with regulations
□ Terms of service legally reviewed
□ Data handling procedures documented
□ Regional compliance requirements met
□ Export control restrictions considered
□ Intellectual property clearances obtained
□ Third-party license compliance verified
□ Audit trail and logging implemented
```

## 🔧 Quick Reference Commands

### Partner Center API Operations

```bash
# If using Partner Center API for automation:

# List offers
GET https://api.partner.microsoft.com/v1.0/ingestion/offers

# Get offer status
GET https://api.partner.microsoft.com/v1.0/ingestion/offers/{offer-id}/status

# Submit for publishing
POST https://api.partner.microsoft.com/v1.0/ingestion/offers/{offer-id}/publish
```

### Marketplace Package Validation

```bash
# Validate complete marketplace package:
Test-AzMarketplacePackage -Path "./azure-deployment" -Verbose

# Test specific components:
Test-AzTemplate -TemplatePath "./azure-deployment/mainTemplate.json" -Skip "Template Should Not Contain Hardcoded Values"
```

## ⚠️ Critical Success Factors

### Before Every Marketplace Update

- ✅ Test in completely clean Azure subscription
- ✅ Verify Customer Usage Attribution tracking
- ✅ Validate all ARM-TTK requirements
- ✅ Test createUiDefinition.json user experience
- ✅ Document all changes in changelog
- ✅ Prepare customer communication if needed
- ✅ Ensure support team is ready
- ✅ Have rollback plan ready

### Never Submit Without

- ❌ Skipping ARM-TTK validation
- ❌ Testing only in development subscription
- ❌ Missing Customer Usage Attribution
- ❌ Incomplete createUiDefinition.json testing
- ❌ Outdated screenshots or descriptions
- ❌ Unresolved security vulnerabilities
- ❌ Missing support documentation
- ❌ Unclear pricing information