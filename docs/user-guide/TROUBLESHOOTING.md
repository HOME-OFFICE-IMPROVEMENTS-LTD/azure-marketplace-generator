# Troubleshooting Guide

Common issues and solutions for Azure Marketplace Generator.

## Installation Issues

### Node.js Version Compatibility

**Problem:** Installation fails with Node.js version errors.

**Solution:**
1. Check Node.js version: `node --version`
2. Required version: Node.js 18.0.0 or higher
3. Update Node.js through your package manager or download from nodejs.org

### NPM Permission Errors

**Problem:** Global installation fails with permission errors.

**Solution:**
```bash
# Option 1: Use npx (recommended)
npx @azure/marketplace-generator

# Option 2: Use npm prefix
npm config set prefix ~/.npm-global
export PATH=$PATH:~/.npm-global/bin

# Option 3: Use sudo (not recommended)
sudo npm install -g @azure/marketplace-generator
```

### Package Not Found

**Problem:** `azmp` command not found after installation.

**Solution:**
1. Verify installation: `npm list -g @azure/marketplace-generator`
2. Check PATH: `echo $PATH`
3. Reinstall: `npm uninstall -g @azure/marketplace-generator && npm install -g @azure/marketplace-generator`

## Authentication Issues

### Azure CLI Not Logged In

**Problem:** Azure operations fail with authentication errors.

**Solution:**
```bash
# Login to Azure CLI
az login

# Verify login
az account show

# Set subscription if needed
az account set --subscription "your-subscription-id"
```

### Multi-Factor Authentication (MFA) Issues

**Problem:** Authentication fails with MFA-enabled accounts.

**Solution:**
```bash
# Use device code authentication
az login --use-device-code

# Or use service principal for automation
azmp auth --setup
```

### Service Principal Configuration

**Problem:** Service principal authentication fails.

**Solution:**
1. Verify environment variables:
   ```bash
   echo $AZURE_TENANT_ID
   echo $AZURE_CLIENT_ID
   echo $AZURE_CLIENT_SECRET
   ```
2. Check service principal permissions:
   ```bash
   az role assignment list --assignee $AZURE_CLIENT_ID
   ```

### GitHub Token Issues

**Problem:** GitHub operations fail with authentication errors.

**Solution:**
1. Create personal access token at github.com/settings/tokens
2. Required scopes: repo, workflow, read:org
3. Set environment variable:
   ```bash
   export GITHUB_TOKEN="your-token-here"
   ```

## Template Validation Issues

### ARM Template Syntax Errors

**Problem:** Validation fails with JSON syntax errors.

**Solution:**
1. Use JSON validator: `azmp validate . --fix`
2. Check common syntax issues:
   - Missing commas
   - Unmatched brackets
   - Invalid escape sequences

### Resource Provider Not Registered

**Problem:** Deployment fails with provider registration errors.

**Solution:**
```bash
# List available providers
az provider list --output table

# Register required provider
az provider register --namespace Microsoft.Storage
```

### API Version Issues

**Problem:** Template uses outdated API versions.

**Solution:**
```bash
# Check latest API versions
az provider list --query "[?namespace=='Microsoft.Storage']" --output table

# Update template with latest versions
azmp validate . --intelligent --fix
```

## Packaging Issues

### ZIP File Corruption

**Problem:** Generated package appears corrupted.

**Solution:**
1. Check disk space: `df -h`
2. Verify write permissions
3. Try different output location:
   ```bash
   azmp package . --output /tmp/my-package.zip
   ```

### File Size Limits

**Problem:** Package exceeds marketplace size limits.

**Solution:**
1. Optimize package: `azmp package . --optimize`
2. Remove unnecessary files from .azmpignore
3. Check package contents:
   ```bash
   unzip -l my-package.zip
   ```

### Missing Dependencies

**Problem:** Package validation fails due to missing files.

**Solution:**
1. Check template dependencies
2. Verify file paths in mainTemplate.json
3. Use intelligent packaging:
   ```bash
   azmp package . --intelligent
   ```

## Deployment Issues

### Resource Group Not Found

**Problem:** Deployment fails with resource group errors.

**Solution:**
```bash
# Create resource group
az group create --name my-rg --location eastus

# Verify resource group
az group show --name my-rg
```

### Insufficient Permissions

**Problem:** Deployment fails with permission errors.

**Solution:**
1. Check user permissions:
   ```bash
   az role assignment list --assignee user@domain.com
   ```
2. Required roles: Contributor or Owner on subscription/resource group

### Resource Name Conflicts

**Problem:** Deployment fails with name already exists errors.

**Solution:**
1. Use unique naming in templates
2. Add random suffix: `"[concat('storage', uniqueString(resourceGroup().id))]"`
3. Check existing resources:
   ```bash
   az resource list --resource-group my-rg
   ```

## GitHub Integration Issues

### Pull Request Creation Fails

**Problem:** PR creation fails with repository errors.

**Solution:**
1. Verify repository access: `gh repo view`
2. Check branch exists: `git branch -a`
3. Ensure clean working directory: `git status`

### Workflow Status Errors

**Problem:** GitHub Actions workflows fail or show incorrect status.

**Solution:**
1. Check workflow file syntax: `.github/workflows/*.yml`
2. Verify secrets are configured
3. Check workflow runs: `gh workflow list`

### Branch Protection Issues

**Problem:** Cannot push to protected branch.

**Solution:**
1. Create feature branch: `git checkout -b feature/my-changes`
2. Use pull request workflow: `azmp workflow feature/my-changes "Description"`
3. Check protection rules: `gh api repos/:owner/:repo/branches/main/protection`

## Performance Issues

### Slow Validation

**Problem:** Template validation takes too long.

**Solution:**
1. Use targeted validation: `azmp validate specific-template.json`
2. Skip non-critical checks: `azmp validate . --fast`
3. Check system resources: `top` or `htop`

### Memory Issues

**Problem:** CLI runs out of memory with large templates.

**Solution:**
1. Increase Node.js memory: `export NODE_OPTIONS="--max-old-space-size=8192"`
2. Process templates in smaller chunks
3. Use streaming validation for large files

### Network Timeouts

**Problem:** Operations timeout due to network issues.

**Solution:**
1. Increase timeout: `azmp deploy . --timeout 30m`
2. Check internet connectivity
3. Use different Azure region if current region is slow

## Configuration Issues

### Environment Variables Not Set

**Problem:** CLI cannot find required configuration.

**Solution:**
1. Check .env file exists and is properly formatted
2. Verify environment variables:
   ```bash
   azmp status --verbose
   ```
3. Use interactive setup: `azmp auth --setup`

### Wrong Azure Subscription

**Problem:** Operations target wrong subscription.

**Solution:**
```bash
# List subscriptions
az account list --output table

# Set correct subscription
az account set --subscription "correct-subscription-id"

# Verify change
az account show
```

### Proxy Configuration

**Problem:** Network requests fail behind corporate proxy.

**Solution:**
```bash
# Set proxy environment variables
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
export NO_PROXY=localhost,127.0.0.1,.company.com

# Configure npm proxy
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
```

## Common Error Messages

### "Template validation failed"

**Cause:** ARM template has syntax or logical errors.

**Solution:**
1. Run: `azmp validate . --verbose`
2. Check validation output for specific errors
3. Use: `azmp validate . --fix` for automatic fixes

### "Authentication required"

**Cause:** Not logged into Azure or GitHub.

**Solution:**
1. Azure: `az login`
2. GitHub: `gh auth login`
3. Verify: `azmp auth --check`

### "Resource quota exceeded"

**Cause:** Azure subscription limits reached.

**Solution:**
1. Check quotas: `az vm list-usage --location eastus`
2. Request quota increase through Azure portal
3. Use different region or subscription

### "Package too large"

**Cause:** Generated package exceeds marketplace limits.

**Solution:**
1. Use: `azmp package . --optimize`
2. Review and remove unnecessary files
3. Check .azmpignore file

### "Branch protection rule violated"

**Cause:** Attempting to push directly to protected branch.

**Solution:**
1. Create feature branch: `git checkout -b feature/changes`
2. Use PR workflow: `azmp pr --create "Description"`
3. Follow review process

## Getting Help

### Enable Debug Mode

For detailed debugging information:

```bash
export DEBUG=azmp:*
azmp command --verbose
```

### Check System Information

```bash
# Node.js and npm versions
node --version
npm --version

# Azure CLI version
az --version

# GitHub CLI version
gh --version

# AZMP version and configuration
azmp status --verbose
```

### Log Analysis

Check log files for detailed error information:

```bash
# View recent logs
ls -la ~/.azmp/logs/

# Check latest error log
tail -f ~/.azmp/logs/error.log
```

### Report Issues

When reporting issues, include:

1. Command that failed
2. Complete error message
3. System information (`azmp status --verbose`)
4. Relevant log files
5. Steps to reproduce

Submit issues at: https://github.com/your-org/azure-marketplace-generator/issues

### Community Support

- Documentation: https://docs.azmarketplace.dev
- Stack Overflow: Tag questions with `azure-marketplace-generator`
- Discord: https://discord.gg/azmp-community