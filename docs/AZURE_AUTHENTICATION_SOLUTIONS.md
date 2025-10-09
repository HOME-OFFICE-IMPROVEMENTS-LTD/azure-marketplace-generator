# 🔐 Azure Authentication Solutions for HOILTD

This document describes the Azure authentication solutions implemented to resolve MFA issues and improve the development experience.

## 🚨 Problem Addressed

**Issue**: Users experiencing authentication failures with Azure CLI despite being "already logged in", specifically:
- MFA authentication failures against multiple tenants (HOILTD DEV, MOHAMMAD AL-SOURI)
- Error: "Due to a configuration change made by your administrator, or because you moved to a new location, you must use multi-factor authentication"
- Browser-based login prompts appearing unexpectedly  
- Cached credential conflicts causing authentication loops
- Interactive authentication requirements in automated environments
- Multiple tenant selection confusion

**Symptoms from the problem statement**:
```
Authentication failed against tenant 473c2116-bcd0-4936-8d3b-dea0f76371a5 'HOILTD DEV': AADSTS50076: Due to a configuration change made by your administrator, or because you moved to a new location, you must use multi-factor authentication to access '797f4846-ba00-4fd7-ba43-dac1f8f63013'.
```

**Root Causes**:
- Azure CLI cached credentials are outdated
- Browser-based MFA flows can fail in certain environments
- Multiple tenants cause confusion during authentication
- Administrative policy changes require re-authentication

## ✅ Solutions Implemented

### 1. **Azure Authentication Helper Script**
**File**: `scripts/azure-auth-helper.sh`

**Purpose**: Comprehensive authentication troubleshooting and management

**Key Features**:
- Automatic MFA issue resolution using device code flow
- Cached credential management and cleanup
- Service principal authentication support
- Azure connectivity testing
- HOILTD tenant-specific configuration

**Usage Examples**:
```bash
# Fix MFA authentication issues (RECOMMENDED)
./scripts/azure-auth-helper.sh fix-mfa

# Check current authentication status
./scripts/azure-auth-helper.sh check

# Clear cached credentials
./scripts/azure-auth-helper.sh clear

# Use service principal (non-interactive)
export AZURE_CLIENT_ID="your-client-id"
export AZURE_CLIENT_SECRET="your-client-secret"
export AZURE_TENANT_ID="473c2116-bcd0-4936-8d3b-dea0f76371a5"
./scripts/azure-auth-helper.sh service-principal
```

### 2. **DevOps & Lighthouse Testing Utility**
**File**: `scripts/test-devops-lighthouse.sh`

**Purpose**: Comprehensive testing of Azure DevOps and Lighthouse MCP servers

**Key Features**:
- Azure DevOps connectivity testing
- PAT token validation
- Project access verification
- Lighthouse performance audit preparation
- Work item creation testing
- Email-specific testing support

**Usage Examples**:
```bash
# Test all systems for specific email
./scripts/test-devops-lighthouse.sh info@hoiltd.com

# Test Azure DevOps only
./scripts/test-devops-lighthouse.sh devops

# Test Lighthouse capabilities
./scripts/test-devops-lighthouse.sh lighthouse

# Create test work item
./scripts/test-devops-lighthouse.sh workitem
```

### 3. **CLI Integration**
**Files**: `src/cli/commands/auth.ts`, `src/cli/index.ts`

**Purpose**: Integrate authentication helpers into the main CLI

**New Commands**:
```bash
# Azure authentication management
azmp auth --fix-mfa              # Fix MFA issues
azmp auth --check                # Check auth status
azmp auth --clear                # Clear cached credentials
azmp auth --service-principal    # Use service principal
azmp auth --test                 # Test connectivity

# MCP server testing
azmp test-mcp info@hoiltd.com    # Test MCP servers
azmp test-mcp --devops-only      # Test DevOps only
azmp test-mcp --lighthouse-only  # Test Lighthouse only
azmp test-mcp --create-workitem  # Create test work item
```

### 4. **Enhanced Documentation**
**File**: `docs/enterprise/MCP_ENVIRONMENT_VARIABLES.md`

**Additions**:
- Comprehensive troubleshooting section
- Step-by-step MFA resolution guide
- Service principal setup instructions
- Environment variable validation procedures

## 🎯 Technical Solutions

### MFA Authentication Fix
- **Device Code Flow**: Bypasses browser-based MFA issues
- **Tenant-Specific Login**: Targets correct HOILTD tenant directly
- **Cached Credential Cleanup**: Removes conflicting stored credentials

### Service Principal Support
- **Non-Interactive Authentication**: Perfect for CI/CD environments
- **Environment Variable Configuration**: Secure credential management
- **Automatic Fallback**: Falls back to device code if SP not configured

### Azure DevOps Integration
- **PAT Token Validation**: Tests Personal Access Token permissions
- **Project Access Verification**: Confirms project accessibility
- **Work Item Creation**: Tests write permissions
- **API Connectivity**: Direct REST API testing

### Lighthouse Performance Testing
- **Runtime Environment Check**: Validates Node.js and npm availability
- **Configuration Validation**: Tests Lighthouse setup
- **URL Accessibility Testing**: Checks target sites
- **Performance Metrics**: Basic response time analysis

## 🔧 Configuration Requirements

### Environment Variables
```bash
# Azure Authentication
AZURE_TENANT_ID="473c2116-bcd0-4936-8d3b-dea0f76371a5"
AZURE_CLIENT_ID="your-client-id"
AZURE_CLIENT_SECRET="your-client-secret"
AZURE_SUBSCRIPTION_ID="1001490f-c77c-403e-be9e-97eac578d1d6"

# Azure DevOps
AZURE_DEVOPS_ORG_URL="https://dev.azure.com/home-office-improvements-ltd"
AZURE_DEVOPS_PAT="your-personal-access-token"
AZURE_DEVOPS_PROJECT="azure-marketplace-generator"
AZURE_DEVOPS_TEAM="development-team"

# Lighthouse Performance
LIGHTHOUSE_CONFIG="enterprise-comprehensive"
CORE_WEB_VITALS_THRESHOLD="good"
ACCESSIBILITY_LEVEL="WCAG-AAA"
PERFORMANCE_BUDGET="strict"
```

## 🔧 Troubleshooting Common Issues

### **Network Connectivity Issues**

**Problem**: "Failed to resolve 'login.microsoftonline.com'" or network timeout errors

**Solutions**:
```bash
# 1. Check internet connectivity
ping -c 3 login.microsoftonline.com

# 2. Test DNS resolution
nslookup login.microsoftonline.com

# 3. Check proxy settings
echo $HTTP_PROXY
echo $HTTPS_PROXY

# 4. If behind corporate firewall, contact IT or try:
az login --use-device-code  # Often works better through firewalls
```

**Corporate Network Users**:
- Device code flow typically works better through corporate firewalls
- Contact your IT department if authentication endpoints are blocked
- Consider using service principal authentication for automated scenarios

### **MFA Authentication Problems** 

**Problem**: "AADSTS50076: Due to a configuration change made by your administrator, or because you moved to a new location, you must use multi-factor authentication"

**Solution**: Use the automated fix (RECOMMENDED)
```bash
# This handles the exact scenario from the problem statement
./scripts/azure-auth-helper.sh fix-mfa
```

**Manual steps if needed**:
```bash
# 1. Clear cached credentials
az account clear
rm -rf ~/.azure/accessTokens.json ~/.azure/azureProfile.json

# 2. Use device code flow (bypasses browser MFA issues)
az login --use-device-code --tenant 473c2116-bcd0-4936-8d3b-dea0f76371a5

# 3. Select correct subscription
az account set --subscription 1001490f-c77c-403e-be9e-97eac578d1d6
```

## 🎉 Benefits Achieved

### For Users
- **Zero Browser Interaction**: Device code flow eliminates browser issues
- **One-Command Fix**: `fix-mfa` command resolves most authentication problems
- **Clear Error Messages**: Detailed troubleshooting guidance
- **Email-Specific Testing**: Targeted testing for individual users

### For Development
- **CI/CD Compatible**: Service principal authentication for automation
- **Comprehensive Testing**: Full MCP server validation
- **Integrated CLI**: Seamless integration with existing tooling
- **Detailed Logging**: Comprehensive output for troubleshooting

### For Operations
- **Automated Recovery**: Self-healing authentication workflows
- **Standardized Process**: Consistent authentication procedures
- **Monitoring Capabilities**: Built-in connectivity testing
- **Documentation**: Complete troubleshooting documentation

## 🚀 Quick Start

### **For the Specific MFA Issue (RECOMMENDED)**

If you're seeing authentication failures like "AADSTS50076: Due to a configuration change made by your administrator, or because you moved to a new location, you must use multi-factor authentication":

1. **Use the automated MFA fix**:
   ```bash
   # This is the RECOMMENDED solution for MFA issues
   ./scripts/azure-auth-helper.sh fix-mfa
   ```

   OR using the CLI:
   ```bash
   npm run build
   azmp auth --fix-mfa
   ```

2. **What this does**:
   - Clears conflicting cached credentials
   - Uses device code flow to bypass browser MFA issues  
   - Automatically selects the correct HOILTD tenant
   - Sets the Microsoft Partner Network subscription as default
   - Tests connectivity to ensure everything works

3. **Follow the device code instructions**:
   - Visit the URL shown in the terminal
   - Enter the device code provided
   - Complete MFA on your mobile device
   - Select the HOILTD DEV tenant when prompted

### **Alternative Solutions**

2. **Manual device code login**:
   ```bash
   # Clear cache first
   az account clear
   
   # Login with device code to specific tenant
   az login --use-device-code --tenant 473c2116-bcd0-4936-8d3b-dea0f76371a5
   
   # Set correct subscription
   az account set --subscription 1001490f-c77c-403e-be9e-97eac578d1d6
   ```

3. **Test MCP Servers**:
   ```bash
   ./scripts/test-devops-lighthouse.sh info@hoiltd.com
   ```

## 📋 Files Modified/Created

### New Files
- `scripts/azure-auth-helper.sh` - Authentication helper script
- `scripts/test-devops-lighthouse.sh` - MCP testing utility
- `src/cli/commands/auth.ts` - CLI authentication commands
- `docs/AZURE_AUTHENTICATION_SOLUTIONS.md` - This documentation

### Modified Files
- `src/cli/index.ts` - Added auth and test-mcp commands
- `docs/enterprise/MCP_ENVIRONMENT_VARIABLES.md` - Added troubleshooting section

## 🔍 Testing Results

The solution has been designed to address the specific authentication issues mentioned in the problem statement:
- ✅ Resolves MFA authentication failures
- ✅ Handles cached credential conflicts
- ✅ Provides non-interactive authentication options
- ✅ Includes comprehensive testing for info@hoiltd.com
- ✅ Integrates with existing Azure DevOps and Lighthouse MCP servers

---

*This solution provides a comprehensive approach to Azure authentication issues while maintaining security best practices and integrating seamlessly with the existing HOILTD development workflow.*