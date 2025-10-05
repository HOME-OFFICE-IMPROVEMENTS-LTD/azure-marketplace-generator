# 🔧 MCP Environment Variables Configuration
## HOME-OFFICE-IMPROVEMENTS-LTD Phase 2 Setup Guide

### 🎯 **Required Environment Variables**

Set these environment variables in your GitHub repository secrets and local development environment.

---

## 🔐 **Azure Integration Variables**

### **Core Azure Services**
```bash
# Azure Authentication
AZURE_TENANT_ID=your-tenant-id-here
AZURE_CLIENT_ID=your-client-id-here  
AZURE_SUBSCRIPTION_ID=your-subscription-id-here

# Azure Service Principal Secret
AZURE_CLIENT_SECRET=your-client-secret-here
```

### **Azure Marketplace Integration**
```bash
# Marketplace API Access
AZURE_MARKETPLACE_API_KEY=your-marketplace-api-key
AZURE_MARKETPLACE_PUBLISHER_ID=your-publisher-id

# Partner Center Integration
PARTNER_CENTER_TENANT_ID=your-partner-tenant-id
PARTNER_CENTER_CLIENT_ID=your-partner-client-id
```

---

## 📚 **Documentation & Knowledge Variables**

### **Microsoft Documentation**
```bash
# Microsoft Learn API
MICROSOFT_DOCS_API_KEY=your-docs-api-key

# Documentation Preferences
DOCS_LANGUAGE=en-us
CONTENT_FILTER=azure,arm-templates,marketplace,bicep
CACHE_DURATION=3600
```

### **Enterprise Knowledge Base**
```bash
# HOILTD Internal Documentation
ENTERPRISE_KNOWLEDGE_BASE=https://docs.home-office-improvements.ltd
ENTERPRISE_DOCS_API_KEY=your-enterprise-api-key

# Organization Settings
ORGANIZATION=HOME-OFFICE-IMPROVEMENTS-LTD
COMPLIANCE_LEVEL=enterprise-strict
SECURITY_CLEARANCE=internal-confidential
```

---

## 🔍 **Search & Intelligence Variables**

### **Web Search Integration**
```bash
# Bing Search API
BING_SEARCH_API_KEY=your-bing-search-api-key

# Search Configuration
ALLOWED_DOMAINS=microsoft.com,azure.com,github.com,docs.microsoft.com,learn.microsoft.com
SEARCH_FILTERS=azure,marketplace,security,enterprise
RESULT_LIMIT=10
```

### **GitHub Enterprise**
```bash
# GitHub Integration
GITHUB_TOKEN=your-github-token
GITHUB_ENTERPRISE_URL=https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD

# Repository Settings
DEFAULT_BRANCH=main
REVIEW_REQUIRED=true
```

---

## 🛡️ **Security & Compliance Variables**

### **Security Configuration**
```bash
# Security Policy Settings
SECURITY_POLICY=enterprise-strict
COMPLIANCE_STANDARD=HOILTD-2024

# Monitoring & Alerts
SECURITY_NOTIFICATION_EMAIL=security@home-office-improvements.ltd
INCIDENT_WEBHOOK=https://hooks.security.hoiltd.com/incidents
```

### **File System Security**
```bash
# Allowed Paths for File Operations
ALLOWED_PATHS=/workspace,/tmp,/home/runner/work

# File Access Restrictions
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_EXTENSIONS=.json,.yaml,.yml,.md,.ts,.js
```

---

## 🚀 **Setup Instructions**

### **1. GitHub Secrets Configuration**
```bash
# Navigate to your repository
# Go to Settings > Secrets and variables > Actions
# Add each secret with the exact names above

# Example using GitHub CLI:
gh secret set AZURE_TENANT_ID --body "your-tenant-id"
gh secret set AZURE_CLIENT_ID --body "your-client-id"
gh secret set AZURE_SUBSCRIPTION_ID --body "your-subscription-id"
```

### **2. Local Development Setup**
```bash
# Create .env file (DO NOT COMMIT TO GIT)
cp .env.example .env

# Edit .env file with your values
nano .env

# Source environment variables
source .env
```

### **3. Azure Service Principal Setup**
```bash
# Create service principal for MCP integration
az ad sp create-for-rbac \
  --name "HOILTD-MCP-Integration" \
  --role "Contributor" \
  --scopes "/subscriptions/YOUR_SUBSCRIPTION_ID" \
  --sdk-auth

# Add Marketplace API permissions
az ad app permission add \
  --id YOUR_CLIENT_ID \
  --api 797f4846-ba00-4fd7-ba43-dac1f8f63013 \
  --api-permissions 41094075-9dad-400e-a0bd-54e686782033=Scope
```

---

## 🔄 **Environment Variable Validation**

### **Required Variables Checklist**
- [ ] `AZURE_TENANT_ID` - Your Azure AD tenant ID
- [ ] `AZURE_CLIENT_ID` - Service principal application ID  
- [ ] `AZURE_SUBSCRIPTION_ID` - Target Azure subscription
- [ ] `MICROSOFT_DOCS_API_KEY` - Microsoft Learn API access
- [ ] `ENTERPRISE_DOCS_API_KEY` - Internal documentation API
- [ ] `BING_SEARCH_API_KEY` - Web search capabilities
- [ ] `GITHUB_TOKEN` - Repository management access

### **Optional Enhancement Variables**
- [ ] `AZURE_CLIENT_SECRET` - Service principal secret (for enhanced access)
- [ ] `PARTNER_CENTER_CLIENT_ID` - Marketplace publishing access
- [ ] `SECURITY_NOTIFICATION_EMAIL` - Security incident alerts
- [ ] `INCIDENT_WEBHOOK` - Automated incident reporting

---

## 🧪 **Testing Your Configuration**

### **1. Environment Validation Script**
```bash
#!/bin/bash
# validate-environment.sh

echo "🔍 Validating MCP Environment Variables..."

# Check required variables
REQUIRED_VARS=(
  "AZURE_TENANT_ID"
  "AZURE_CLIENT_ID" 
  "AZURE_SUBSCRIPTION_ID"
  "MICROSOFT_DOCS_API_KEY"
  "BING_SEARCH_API_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!var}" ]]; then
    echo "❌ Missing required variable: $var"
    exit 1
  else
    echo "✅ Found: $var"
  fi
done

echo "🎉 All required environment variables are configured!"
```

### **2. Azure Authentication Helper**
**NEW: Automated authentication troubleshooting for MFA issues**

```bash
# Fix MFA authentication issues (RECOMMENDED)
./scripts/azure-auth-helper.sh fix-mfa

# Check current authentication status
./scripts/azure-auth-helper.sh check

# Clear cached credentials and reset
./scripts/azure-auth-helper.sh full-reset

# Use service principal authentication (non-interactive)
export AZURE_CLIENT_ID="your-client-id"
export AZURE_CLIENT_SECRET="your-client-secret"
export AZURE_TENANT_ID="your-tenant-id"
./scripts/azure-auth-helper.sh service-principal
```

### **3. Azure DevOps & Lighthouse Testing**
**NEW: Comprehensive testing for DevOps and Performance MCP servers**

```bash
# Test all systems for info@hoiltd.com
./scripts/test-devops-lighthouse.sh info@hoiltd.com

# Test Azure DevOps connectivity only
./scripts/test-devops-lighthouse.sh devops

# Test Lighthouse performance capabilities
./scripts/test-devops-lighthouse.sh lighthouse

# Create test work item
./scripts/test-devops-lighthouse.sh workitem
```

### **4. Legacy Azure Connectivity Test**
```bash
# Test Azure authentication
az login --service-principal \
  --username $AZURE_CLIENT_ID \
  --password $AZURE_CLIENT_SECRET \
  --tenant $AZURE_TENANT_ID

# Verify subscription access
az account set --subscription $AZURE_SUBSCRIPTION_ID
az account show
```

---

## 🔧 **Troubleshooting Common Issues**

### **Azure MFA Authentication Problems**

**Problem**: "Authentication failed... must use multi-factor authentication"  
**Solution**: Use our automated authentication helper

```bash
# RECOMMENDED: Fix MFA issues automatically
./scripts/azure-auth-helper.sh fix-mfa

# Alternative: Use device code flow (avoids browser issues)
az login --use-device-code --tenant 473c2116-bcd0-4936-8d3b-dea0f76371a5
```

### **Cached Credentials Issues**

**Problem**: "Already logged in" but still getting authentication errors  
**Solution**: Clear cached credentials

```bash
# Clear all cached Azure CLI credentials
./scripts/azure-auth-helper.sh clear

# Or manually clear cache
az account clear
rm -rf ~/.azure/accessTokens.json
rm -rf ~/.azure/azureProfile.json
```

### **Service Principal Authentication**

**Problem**: Interactive login required in CI/CD environments  
**Solution**: Use service principal authentication

```bash
# Set environment variables
export AZURE_CLIENT_ID="your-service-principal-id"
export AZURE_CLIENT_SECRET="your-service-principal-secret"
export AZURE_TENANT_ID="473c2116-bcd0-4936-8d3b-dea0f76371a5"

# Login using service principal
./scripts/azure-auth-helper.sh service-principal
```

### **Azure DevOps Access Issues**

**Problem**: Cannot access Azure DevOps projects or PAT token issues  
**Solution**: Verify and test DevOps configuration

```bash
# Test Azure DevOps connectivity
./scripts/test-devops-lighthouse.sh devops

# Set required environment variables
export AZURE_DEVOPS_ORG_URL="https://dev.azure.com/home-office-improvements-ltd"
export AZURE_DEVOPS_PAT="your-personal-access-token"
export AZURE_DEVOPS_PROJECT="azure-marketplace-generator"
```

### **MCP Server Connection Issues**

**Problem**: MCP servers not responding or authentication failures  
**Solution**: Validate all environment variables and test connectivity

```bash
# Run comprehensive testing
./scripts/test-devops-lighthouse.sh all

# Check specific environment variables
./scripts/azure-auth-helper.sh check
```

---

## 🔐 **Security Best Practices**

### **1. Secret Management**
- ✅ **Never commit secrets** to version control
- ✅ **Use GitHub Secrets** for CI/CD pipelines
- ✅ **Rotate secrets regularly** (90-day maximum)
- ✅ **Use Azure Key Vault** for production environments

### **2. Access Control**
- 🔒 **Principle of least privilege** for service principals
- 🔒 **Time-limited access tokens** where possible
- 🔒 **Regular access reviews** quarterly
- 🔒 **Audit logging** for all secret access

### **3. Environment Separation**
```bash
# Development Environment
ENVIRONMENT=development
AZURE_SUBSCRIPTION_ID=dev-subscription-id

# Staging Environment  
ENVIRONMENT=staging
AZURE_SUBSCRIPTION_ID=staging-subscription-id

# Production Environment
ENVIRONMENT=production
AZURE_SUBSCRIPTION_ID=prod-subscription-id
```

---

## 📊 **Monitoring & Alerting**

### **1. Environment Health Checks**
- 🔍 **Daily validation** of environment variables
- 🔍 **API connectivity tests** every 15 minutes
- 🔍 **Secret expiration monitoring** with 30-day alerts
- 🔍 **Usage analytics** for optimization insights

### **2. Error Handling**
```bash
# Environment variable fallbacks
CACHE_DURATION=${CACHE_DURATION:-3600}
RESULT_LIMIT=${RESULT_LIMIT:-10}
COMPLIANCE_LEVEL=${COMPLIANCE_LEVEL:-enterprise-strict}
```

---

**Document Version:** 1.0  
**Last Updated:** October 2025  
**Owner:** HOME-OFFICE-IMPROVEMENTS-LTD DevOps Team  
**Next Review:** November 2025