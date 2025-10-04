# Development Environment Setup & Validation Prompts

## 🚨 MANDATORY CHECKS BEFORE ENVIRONMENT OPERATIONS

### Initial Environment Setup Checklist

```bash
# STOP! Before starting development work, verify:
□ Node.js version matches project requirements (check package.json)
□ Azure CLI installed and authenticated
□ PowerShell with ARM-TTK module available
□ Git configured with proper user credentials
□ VS Code with required extensions installed
□ Environment variables properly configured
```

### Node.js Environment Validation

```bash
# Check Node.js and npm versions:
node --version
npm --version

# Verify project compatibility:
# Required: Node.js >= 18.0.0
# Check package.json engines field

# Install dependencies:
npm install

# Verify installation:
npm list --depth=0

# Run project setup:
npm run build
npm test
```

### Azure CLI Environment Setup

```bash
# Install/Update Azure CLI:
# Linux: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
# Windows: Download from https://aka.ms/installazurecliwindows

# Verify installation:
az --version

# Login and set subscription:
az login
az account list --output table
az account set --subscription "your-subscription-id"

# Install required extensions:
az extension add --name resource-graph
az extension add --name application-insights
```

### PowerShell and ARM-TTK Setup

```bash
# Install PowerShell (if needed):
# Linux: sudo snap install powershell --classic
# Windows: Built-in or from Microsoft Store

# Verify PowerShell version:
pwsh --version

# Install ARM-TTK module:
Import-Module ./tools/arm-ttk/arm-ttk/arm-ttk.psd1

# Verify ARM-TTK installation:
Get-Command Test-AzTemplate
```

### Git Configuration Validation

```bash
# Verify Git configuration:
git config --global user.name
git config --global user.email

# If not set, configure:
git config --global user.name "Your Name"
git config --global user.email "your.email@company.com"

# Verify repository configuration:
git remote -v
git status
git branch -a
```

### VS Code Extensions Checklist

```bash
# Required VS Code extensions:
□ Azure Resource Manager Tools
□ Azure CLI Tools
□ PowerShell
□ GitLens
□ Azure Account
□ ARM Template Viewer
□ JSON Tools
□ markdownlint
□ TypeScript and JavaScript Language Features
```

### Environment Variables Setup

```bash
# Required environment variables:
export AZURE_SUBSCRIPTION_ID="your-subscription-id"
export AZURE_TENANT_ID="your-tenant-id"
export AZURE_CLIENT_ID="your-client-id" # if using service principal
export ARM_TTK_PATH="./tools/arm-ttk/arm-ttk"

# Verify environment variables:
echo $AZURE_SUBSCRIPTION_ID
echo $ARM_TTK_PATH

# For Windows PowerShell:
$env:AZURE_SUBSCRIPTION_ID = "your-subscription-id"
$env:ARM_TTK_PATH = "./tools/arm-ttk/arm-ttk"
```

### Development Dependencies Validation

```bash
# TypeScript development setup:
npm install -g typescript
tsc --version

# Project build verification:
npm run build
npm run lint
npm run test

# Check for vulnerabilities:
npm audit
npm audit fix
```

### Azure Resource Testing Environment

```bash
# Create development resource group:
az group create \
  --name "rg-marketplace-dev-eastus" \
  --location "eastus" \
  --tags \
    Environment=Development \
    Project=azure-marketplace-generator \
    Owner=$(az account show --query user.name -o tsv)

# Verify access permissions:
az group show --name "rg-marketplace-dev-eastus"
az role assignment list --resource-group "rg-marketplace-dev-eastus"
```

### Local Testing Setup

```bash
# ARM template local testing:
# 1. Validate template syntax
az deployment group validate \
  --resource-group "rg-marketplace-dev-eastus" \
  --template-file "./azure-deployment/mainTemplate.json" \
  --parameters @"./azure-deployment/parameters.json"

# 2. Run ARM-TTK validation
Test-AzTemplate -TemplatePath "./azure-deployment/mainTemplate.json"

# 3. Test createUiDefinition.json
Test-AzMarketplacePackage -Path "./azure-deployment"
```

### Troubleshooting Common Setup Issues

```bash
# Node.js version conflicts:
# Use nvm (Node Version Manager):
nvm install 18
nvm use 18

# Azure CLI authentication issues:
az logout
az login --tenant "your-tenant-id"

# PowerShell execution policy (Windows):
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Git authentication issues:
git config --global credential.helper store
```

### Development Workflow Validation

```bash
# Complete workflow test:
# 1. Create feature branch
git checkout develop
git pull origin develop
git checkout -b feature/test-environment-setup

# 2. Make small change
echo "# Environment Test" >> test-file.md

# 3. Add and commit
git add test-file.md
git commit -m "test: verify development environment setup"

# 4. Run validation
npm run build
npm run test
npm run lint

# 5. Clean up test
git checkout develop
git branch -D feature/test-environment-setup
rm test-file.md
```

### Performance and Resource Monitoring

```bash
# Monitor local development resources:
# System resources
top # Linux/macOS
Get-Process # PowerShell

# Node.js memory usage
node --max-old-space-size=4096 # if needed

# Azure resource usage
az consumption usage list --output table
```

### Backup and Recovery Procedures

```bash
# Backup development configuration:
# 1. Export VS Code settings
code --list-extensions > vscode-extensions.txt

# 2. Backup environment variables
env | grep AZURE > azure-env-backup.txt

# 3. Export npm global packages
npm list -g --depth=0 > npm-global-packages.txt

# 4. Git configuration backup
git config --list > git-config-backup.txt
```

### Environment Cleanup Procedures

```bash
# Clean up development environment:
# 1. Remove test resource groups
az group list --tag Environment=Development --output table
az group delete --name "rg-marketplace-dev-eastus" --yes --no-wait

# 2. Clean npm cache
npm cache clean --force

# 3. Clean Git branches
git branch --merged | grep -v main | grep -v develop | xargs git branch -d

# 4. Clean Docker (if used)
docker system prune -a
```

### CI/CD Environment Validation

```bash
# Prepare for CI/CD pipeline:
□ All secrets stored in Azure Key Vault or GitHub Secrets
□ Service principal created with minimal permissions
□ Build scripts tested locally
□ Environment-specific configuration separated
□ ARM template parameters externalized
□ Test automation implemented
□ Deployment scripts validated
```

### Security Environment Checklist

```bash
# Development security validation:
□ No secrets in code or configuration files
□ Azure CLI authenticated with proper permissions
□ Git commits signed (if required)
□ Dependency vulnerability scanning enabled
□ Local firewall configured appropriately
□ VPN connected to corporate network (if required)
□ Azure resources properly secured in development subscription
```

## ⚠️ Common Development Environment Issues

### Problems and Solutions

```bash
# Issue: Node.js version mismatch
# Solution: Use nvm to manage Node.js versions
nvm install 18.0.0
nvm alias default 18.0.0

# Issue: ARM-TTK module not found
# Solution: Import module with full path
Import-Module "$(pwd)/tools/arm-ttk/arm-ttk/arm-ttk.psd1" -Force

# Issue: Azure CLI authentication expired
# Solution: Re-authenticate with device code
az login --use-device-code

# Issue: Git credential issues
# Solution: Reset and reconfigure credentials
git config --global --unset credential.helper
git config --global credential.helper store
```

### Performance Optimization

```bash
# Optimize development environment performance:
# 1. Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# 2. Configure npm for better performance
npm config set audit false # disable security audit for faster installs
npm config set fund false # disable funding messages

# 3. Use npm ci for faster installs in CI
npm ci # instead of npm install

# 4. Configure Git for better performance
git config core.preloadindex true
git config core.fscache true
git config gc.auto 256
```

## 🔧 Quick Reference Commands

### Daily Development Startup

```bash
# Start of day checklist:
cd /home/msalsouri/Projects/azure-marketplace-generator
git checkout develop
git pull origin develop
npm install # if package.json changed
az account show # verify Azure context
npm run build # verify project builds
npm test # verify tests pass
```

### End of Day Cleanup

```bash
# End of day checklist:
git status # check for uncommitted changes
npm run lint # verify code quality
git stash # stash any work in progress
az group list --tag Environment=Development # check for leftover resources
docker ps # check for running containers
```