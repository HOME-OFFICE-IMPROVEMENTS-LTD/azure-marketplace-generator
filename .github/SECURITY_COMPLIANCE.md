# 🔒 ENTERPRISE SECURITY COMPLIANCE FRAMEWORK
## HOME-OFFICE-IMPROVEMENTS-LTD Standards

### 🚨 SECURITY VIOLATIONS DETECTED & SOLUTIONS

#### ❌ ARM Template Security Violations
**Issue:** Templates are outputting secrets directly
```json
// ❌ VIOLATION - Current templates
"outputs": {
  "connectionString": {
    "value": "[connection string with keys]"
  },
  "primaryKey": {
    "value": "[listKeys(...).keys[0].value]"
  }
}
```

**✅ ENTERPRISE SOLUTION:** Azure Key Vault Integration
```json
// ✅ COMPLIANT - Store in Key Vault, reference only
"outputs": {
  "keyVaultId": {
    "value": "[resourceId('Microsoft.KeyVault/vaults', variables('keyVaultName'))]"
  },
  "storageAccountName": {
    "value": "[variables('storageAccountName')]"
  }
  // NO SECRET OUTPUTS
}
```

### 🏢 ORGANIZATION SECURITY POLICY

#### **RULE #1: NO LOCAL SECRETS EVER**
- ✅ Use `secrets.GITHUB_TOKEN` for GitHub operations
- ✅ Use `secrets.AZURE_CREDENTIALS` for Azure deployments  
- ✅ Use `secrets.NPM_TOKEN` for package publishing
- ✅ Store all secrets in GitHub Enterprise organization secrets

#### **RULE #2: AZURE KEY VAULT MANDATORY**
- ✅ All connection strings → Azure Key Vault
- ✅ All access keys → Azure Key Vault  
- ✅ All API keys → Azure Key Vault
- ✅ ARM templates reference Key Vault, never output secrets

#### **RULE #3: SSO INTEGRATION**
- ✅ Use `sso.hoiltd.com` for all authentication
- ✅ No local service principals
- ✅ Managed identities where possible

### 🔧 IMMEDIATE FIX ACTIONS

#### 1. Fix ARM Template Outputs
**Files to modify:**
- `packages/marketplace/azure-storage/*/mainTemplate.json`
- `src/templates/storage/nestedtemplates/storageAccount.json.hbs`
- `azure-deployment/mainTemplate.json`

**Change from:**
```json
"outputs": {
  "connectionString": { "value": "[connectionString]" },
  "primaryKey": { "value": "[key]" }
}
```

**Change to:**
```json
"outputs": {
  "keyVaultId": { "value": "[resourceId('Microsoft.KeyVault/vaults', variables('keyVaultName'))]" },
  "storageAccountId": { "value": "[resourceId('Microsoft.Storage/storageAccounts', variables('storageAccountName'))]" }
}
```

#### 2. Add Key Vault Integration
```json
{
  "type": "Microsoft.KeyVault/vaults/secrets",
  "apiVersion": "2023-07-01",
  "name": "[concat(variables('keyVaultName'), '/storage-connection-string')]",
  "properties": {
    "value": "[concat('DefaultEndpointsProtocol=https;AccountName=', variables('storageAccountName'), ';AccountKey=', listKeys(resourceId('Microsoft.Storage/storageAccounts', variables('storageAccountName')), '2023-01-01').keys[0].value)]"
  },
  "dependsOn": [
    "[resourceId('Microsoft.Storage/storageAccounts', variables('storageAccountName'))]",
    "[resourceId('Microsoft.KeyVault/vaults', variables('keyVaultName'))]"
  ]
}
```

#### 3. Clean Test Output
**Issue:** Validation reports contain sensitive information
```bash
# Clean all test outputs
rm -rf test-output/
rm -rf packages/validated/*.json
```

#### 4. Update .gitignore
Add enterprise security exclusions:
```
# Security - NO EXCEPTIONS
*.key
*.pem
*.p12
*.pfx
.env*
.secrets
secrets.json
appsettings.*.json
local.settings.json

# ARM-TTK Reports (may contain sensitive info)
packages/validated/
test-output/
validation-output/
arm-ttk-output/

# Azure CLI cache
.azure/

# Terraform
*.tfstate
*.tfstate.backup
.terraform/
```

### 🚀 GITHUB ENTERPRISE ACTIONS SETUP

#### Required Organization Secrets:
```yaml
# In HOME-OFFICE-IMPROVEMENTS-LTD organization secrets
AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}
AZURE_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}  
AZURE_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
AZURE_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

#### Workflow Security Template:
```yaml
name: Enterprise Security Validation
on: [push, pull_request]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Azure Login (SSO)
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
          
      - name: ARM-TTK Security Validation
        uses: Azure/arm-ttk-action@v1
        with:
          template-path: './packages/marketplace'
          
      - name: Secret Scanning
        run: |
          if grep -r "connectionString\|primaryKey\|accessKey" --include="*.json" packages/; then
            echo "❌ Security violation: Secrets found in templates"
            exit 1
          fi
          
      - name: Dependency Security Audit
        run: npm audit --audit-level moderate
```

### 📋 ENTERPRISE COMPLIANCE CHECKLIST

#### Pre-Deployment Security Audit:
- [ ] No secrets in template outputs
- [ ] All connections via Key Vault references
- [ ] No hardcoded credentials anywhere
- [ ] Test outputs cleaned
- [ ] ARM-TTK security validation passes
- [ ] GitHub secret scanning enabled
- [ ] SSO authentication configured

#### Organization Standards:
- [ ] Two-factor authentication enforced ✅
- [ ] Signed commits required ✅  
- [ ] Branch protection with required reviews ✅
- [ ] Secret scanning with push protection
- [ ] Advanced security features enabled
- [ ] SAML SSO integration (sso.hoiltd.com)

### 🎯 IMMEDIATE ACTION PLAN

1. **Fix ARM template outputs** (remove secret outputs)
2. **Clean validation reports** (remove sensitive test data)
3. **Update .gitignore** (add enterprise security rules)
4. **Set up GitHub Actions** (with organization secrets)
5. **Enable advanced security** (secret scanning + push protection)

**ZERO TOLERANCE POLICY: No secrets, no exceptions, enterprise-grade security always.**