# 🔐 GitHub Enterprise Organization Secrets Audit & Recommendations

## HOME-OFFICE-IMPROVEMENTS-LTD MCP Ecosystem Expansion

## 📋 **Current Secrets Status** (From Security Compliance Docs)

### ✅ **Existing Organization Secrets** (Required)

Based on `/.github/SECURITY_COMPLIANCE.md` and `/.github/copilot-mcp-config.json`:

| Secret Name | Purpose | Status | MCP Usage |
|-------------|---------|--------|-----------|
| `GITHUB_TOKEN` | GitHub API operations | ✅ Required | GitHub MCPs, Codespaces |
| `AZURE_CREDENTIALS` | Azure authentication | ✅ Required | All Azure MCPs |
| `AZURE_TENANT_ID` | Azure tenant identification | ✅ Required | Graph MCP, DevOps MCP |
| `AZURE_CLIENT_ID` | Azure service principal | ✅ Required | Authentication |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription | ✅ Required | Resource operations |
| `NPM_TOKEN` | Package publishing | ✅ Required | Package deployments |
| `PARTNER_CENTER_CLIENT_ID` | Partner Center API | ✅ Required | Marketplace operations |

## 🚀 **New Secrets Required for MCP Ecosystem**

### **High Priority - Core MCP Operations**

#### 1. **Azure OpenAI Secrets**

```yaml

# For RAG Services (ALL MCP servers with RAG)

AZURE_OPENAI_ENDPOINT: "https://your-openai.openai.azure.com/"
AZURE_OPENAI_KEY: "<azure-openai-api-key>"
AZURE_OPENAI_DEPLOYMENT_NAME: "text-embedding-ada-002"
AZURE_OPENAI_CHAT_DEPLOYMENT: "gpt-4"

```

#### 2. **Microsoft Graph Enhanced Permissions**

```yaml

# For Graph MCP Server

MS_GRAPH_CLIENT_ID: "<app-registration-client-id>"
MS_GRAPH_CLIENT_SECRET: "<app-registration-secret>"
MS_GRAPH_TENANT_ID: "<your-tenant-id>"  # May be same as AZURE_TENANT_ID

```

#### 3. **Azure DevOps Enhanced Secrets**

```yaml

# For DevOps MCP + RAG

AZURE_DEVOPS_ORG_URL: "https://dev.azure.com/HOME-OFFICE-IMPROVEMENTS-LTD"
AZURE_DEVOPS_PAT: "<personal-access-token-with-full-scope>"
AZURE_DEVOPS_PROJECT: "azure-marketplace-generator"

```

### **Medium Priority - Development Environment**

#### 4. **VS Code MCP Secrets**

```yaml

# For VS Code MCP Server

VSCODE_MARKETPLACE_PAT: "<vscode-marketplace-personal-access-token>"
VSCODE_EXTENSION_ID: "hoiltd.azmp-mcp-extension"

```

#### 5. **GitHub Codespaces Secrets**

```yaml

# For Codespaces MCP

CODESPACES_GITHUB_TOKEN: "<github-token-with-codespaces-scope>"
GITHUB_ORG: "HOME-OFFICE-IMPROVEMENTS-LTD"
CODESPACES_BILLING_USER: "HOME-OFFICE-IMPROVEMENTS-LTD"

```

#### 6. **Container Registry Secrets**

```yaml

# For Docker/Container MCP

CONTAINER_REGISTRY_URL: "ghcr.io/home-office-improvements-ltd"
CONTAINER_REGISTRY_USERNAME: "<github-username>"
CONTAINER_REGISTRY_PASSWORD: "<github-container-registry-token>"

```

### **Strategic Priority - Advanced Features**

#### 7. **Key Vault Integration**

```yaml

# For secure secret management across MCPs

AZURE_KEY_VAULT_URL: "https://azmp-secrets.vault.azure.net/"
KEY_VAULT_CLIENT_ID: "<key-vault-access-client-id>"
KEY_VAULT_CLIENT_SECRET: "<key-vault-access-secret>"

```

#### 8. **Monitoring & Analytics**

```yaml

# For MCP performance monitoring

APPLICATION_INSIGHTS_CONNECTION_STRING: "<ai-connection-string>"
LOG_ANALYTICS_WORKSPACE_ID: "<workspace-id>"
LOG_ANALYTICS_SHARED_KEY: "<shared-key>"

```

#### 9. **Third-Party Integrations**

```yaml

# For enhanced MCP capabilities

OPENAI_API_KEY: "<fallback-openai-key>"  # Fallback for Azure OpenAI

DATADOG_API_KEY: "<datadog-api-key>"     # For monitoring

SLACK_WEBHOOK_URL: "<slack-webhook>"      # For notifications

```

## 🔧 **Secret Management Strategy**

### **Tier 1: Core Operations** (Immediate Setup)

1. Azure OpenAI secrets for RAG functionality
2. Enhanced Graph API permissions
3. DevOps PAT with full repository access

### **Tier 2: Development Environment** (Phase 2)

1. VS Code marketplace integration
2. Codespaces billing and management
3. Container registry access

### **Tier 3: Advanced Features** (Phase 3)

1. Key Vault centralized secret management
2. Monitoring and analytics
3. Third-party service integrations

## 📝 **Secret Configuration Template**

### **GitHub Organization Settings**

```bash

# Navigation: GitHub.com → HOME-OFFICE-IMPROVEMENTS-LTD → Settings → Secrets and variables → Actions

# Organization secrets (available to all repositories)

gh secret set AZURE_OPENAI_ENDPOINT --org HOME-OFFICE-IMPROVEMENTS-LTD
gh secret set AZURE_OPENAI_KEY --org HOME-OFFICE-IMPROVEMENTS-LTD
gh secret set MS_GRAPH_CLIENT_ID --org HOME-OFFICE-IMPROVEMENTS-LTD
gh secret set MS_GRAPH_CLIENT_SECRET --org HOME-OFFICE-IMPROVEMENTS-LTD
gh secret set AZURE_DEVOPS_PAT --org HOME-OFFICE-IMPROVEMENTS-LTD

```

### **Repository-Specific Secrets**

```bash

# For sensitive development secrets

gh secret set VSCODE_MARKETPLACE_PAT --repo azure-marketplace-generator
gh secret set CONTAINER_REGISTRY_PASSWORD --repo azure-marketplace-generator

```

## 🛡️ **Security Best Practices**

### **Secret Rotation Schedule**

- **Monthly**: Personal Access Tokens (GitHub, DevOps, VS Code)

- **Quarterly**: Client secrets and API keys

- **Annually**: Service principal credentials

### **Access Control**

```yaml

# Example: Limited scope tokens

AZURE_DEVOPS_PAT:
  scope: 
    - "Code (read & write)"

    - "Work items (read & write)" 

    - "Build (read & execute)"

    - "Release (read & write)"

  expiry: "90 days"

```

### **Environment Separation**

```yaml

# Development vs Production

AZURE_OPENAI_ENDPOINT_DEV: "https://azmp-dev-openai.openai.azure.com/"
AZURE_OPENAI_ENDPOINT_PROD: "https://azmp-prod-openai.openai.azure.com/"

```

## 🎯 **Immediate Actions Required**

### **Step 1: Azure OpenAI Setup**

1. Create Azure OpenAI resource in your tenant
2. Deploy `text-embedding-ada-002` model
3. Deploy `gpt-4` or `gpt-4o` model
4. Get endpoint URL and API key
5. Add to GitHub organization secrets

### **Step 2: Microsoft Graph App Registration**

1. Go to Azure AD → App registrations
2. Create new app: "AZMP Graph MCP Server"
3. Add Microsoft Graph API permissions:
   - `User.Read.All`

   - `Group.Read.All`

   - `Sites.Read.All`

   - `Files.Read.All`

   - `Team.ReadBasic.All`

4. Generate client secret
5. Add to GitHub organization secrets

### **Step 3: Azure DevOps PAT**

1. Go to Azure DevOps → Personal Access Tokens
2. Create PAT with full repository access
3. Set expiry to 90 days
4. Add to GitHub organization secrets

### **Step 4: Update MCP Configurations**

Update `.github/copilot-mcp-config.json` with new secrets:

```json

{
  "mcpServers": {
    "graph-mcp-server": {
      "env": {
        "AZURE_OPENAI_ENDPOINT": "${AZURE_OPENAI_ENDPOINT}",
        "AZURE_OPENAI_KEY": "${AZURE_OPENAI_KEY}",
        "MS_GRAPH_CLIENT_ID": "${MS_GRAPH_CLIENT_ID}",
        "MS_GRAPH_CLIENT_SECRET": "${MS_GRAPH_CLIENT_SECRET}"
      }
    }
  }
}

```

## 📊 **Secret Usage Matrix**

| MCP Server | Azure OpenAI | Graph API | DevOps PAT | GitHub Token | VS Code | Codespaces |
|------------|---------------|-----------|------------|--------------|---------|------------|
| Graph MCP | ✅ Required | ✅ Required | ❌ | ❌ | ❌ | ❌ |
| DevOps MCP | ✅ Required | ❌ | ✅ Required | ❌ | ❌ | ❌ |
| Lighthouse MCP | ✅ Required | ❌ | ❌ | ❌ | ❌ | ❌ |
| VS Code MCP | ✅ Required | ❌ | ❌ | ✅ Required | ✅ Required | ❌ |
| Codespaces MCP | ✅ Required | ❌ | ❌ | ✅ Required | ❌ | ✅ Required |
| Container MCP | ❌ | ❌ | ❌ | ✅ Required | ❌ | ❌ |

## 🔍 **Audit Checklist**

### **Pre-Implementation**

- [ ] Azure OpenAI resource created and configured

- [ ] Graph API app registration with proper permissions

- [ ] DevOps PAT generated with appropriate scope

- [ ] All secrets added to GitHub organization

- [ ] Secret rotation schedule documented

- [ ] Access control policies defined

### **Post-Implementation**

- [ ] MCP servers can authenticate successfully

- [ ] RAG services can generate embeddings

- [ ] Graph API calls return organizational data

- [ ] DevOps integration retrieves project data

- [ ] No secrets exposed in logs or outputs

- [ ] Monitoring and alerting configured

## 💡 **Cost Optimization**

### **Azure OpenAI Usage Estimates**

- **Text Embeddings**: ~$0.0001 per 1K tokens

- **GPT-4 Chat**: ~$0.03 per 1K tokens

- **Monthly Estimate**: $50-200 for moderate MCP usage

### **Recommended Limits**

```yaml

# Rate limiting in MCP configurations

AZURE_OPENAI_MAX_REQUESTS_PER_MINUTE: 60
AZURE_OPENAI_MAX_TOKENS_PER_REQUEST: 8192
GRAPH_API_MAX_REQUESTS_PER_MINUTE: 100

```

---


**🎯 Priority: Set up Tier 1 secrets immediately to enable MCP ecosystem expansion.**
