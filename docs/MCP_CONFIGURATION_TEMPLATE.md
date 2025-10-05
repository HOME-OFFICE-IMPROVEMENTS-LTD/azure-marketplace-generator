# 🚀 MCP Configuration Template for HOME-OFFICE-IMPROVEMENTS-LTD

## 📋 **Validated Schema Pattern**
*Successfully tested on azure-marketplace-generator repository - October 5, 2025*

### **✅ Schema Requirements:**
- `"type"`: Must be one of: "stdio", "local", "http", "sse"
- `"command"`: Command to execute the MCP server  
- `"args"`: Array of command arguments
- `"tools"`: Array of tool names the server provides
- `"env"`: Environment variables (optional)

### **❌ Invalid Properties:**
- ~~`"description"`~~ - Not allowed in GitHub schema
- ~~`"capabilities"`~~ - Not allowed in GitHub schema

---

## 🔧 **Enterprise MCP Configuration Template**

```json
{
  "mcpServers": {
    "azure-marketplace": {
      "type": "stdio",
      "command": "npx",
      "args": ["@azure/mcp-server-marketplace"],
      "tools": ["list-offerings", "get-pricing", "search-publishers", "get-marketplace-stats"],
      "env": {
        "AZURE_TENANT_ID": "${AZURE_TENANT_ID}",
        "AZURE_CLIENT_ID": "${AZURE_CLIENT_ID}"
      }
    },
    "azure-arm-templates": {
      "type": "stdio",
      "command": "npx",
      "args": ["@azure/mcp-server-arm"],
      "tools": ["validate-template", "get-schema", "check-best-practices", "lint-template"],
      "env": {
        "AZURE_SUBSCRIPTION_ID": "${AZURE_SUBSCRIPTION_ID}"
      }
    },
    "microsoft-docs": {
      "type": "stdio",
      "command": "npx",
      "args": ["@microsoft/mcp-server-docs"],
      "tools": ["search-docs", "get-api-reference", "fetch-tutorial", "check-latest-version"]
    },
    "enterprise-knowledge": {
      "type": "stdio",
      "command": "npx",
      "args": ["@enterprise/mcp-server-knowledge"],
      "tools": ["search-standards", "get-policy", "check-compliance"],
      "env": {
        "ENTERPRISE_KNOWLEDGE_BASE": "https://docs.home-office-improvements.ltd",
        "API_KEY": "${ENTERPRISE_DOCS_API_KEY}"
      }
    },
    "github-enterprise": {
      "type": "stdio",
      "command": "npx", 
      "args": ["@github/mcp-server-enterprise"],
      "tools": ["list-repos", "create-issue", "get-workflow-status", "manage-branches"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}",
        "GITHUB_ENTERPRISE_URL": "https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD"
      }
    },
    "security-compliance": {
      "type": "stdio",
      "command": "npx",
      "args": ["@security/mcp-server-compliance"],
      "tools": ["scan-vulnerabilities", "check-compliance", "audit-permissions"],
      "env": {
        "SECURITY_POLICY": "enterprise-strict",
        "COMPLIANCE_STANDARD": "HOILTD-2024"
      }
    },
    "web-search": {
      "type": "stdio",
      "command": "npx",
      "args": ["@mcp/server-web-search"],
      "tools": ["search-web", "get-trends", "fetch-updates"],
      "env": {
        "SEARCH_API_KEY": "${BING_SEARCH_API_KEY}",
        "ALLOWED_DOMAINS": "microsoft.com,azure.com,github.com,docs.microsoft.com"
      }
    },
    "file-system": {
      "type": "stdio",
      "command": "npx",
      "args": ["@mcp/server-filesystem"],
      "tools": ["read-file", "write-file", "list-directory", "create-template"],
      "env": {
        "ALLOWED_PATHS": "/workspace,/tmp,/home/runner/work"
      }
    }
  }
}
```

---

## 📂 **Repository Application Guide**

### **For Future Repositories:**
1. Copy the JSON configuration above
2. Adapt environment variables for specific project needs
3. Add repository-specific tools if needed
4. Test schema validation before deployment

### **Environment Variables Setup:**
- `AZURE_TENANT_ID` - Your Azure Active Directory tenant ID
- `AZURE_CLIENT_ID` - Service principal client ID  
- `AZURE_SUBSCRIPTION_ID` - Target Azure subscription
- `GITHUB_TOKEN` - GitHub Enterprise access token
- `ENTERPRISE_DOCS_API_KEY` - Internal documentation API key
- `BING_SEARCH_API_KEY` - Web search API key

### **Firewall Requirements:**
- `*.githubcopilot.com`
- `*.github.com` 
- `*.openai.com`

---

## 🎯 **Competitive Advantages**

### **Real-time Intelligence:**
- Live Azure Marketplace pricing data
- Current ARM template schemas and validation
- Latest Microsoft documentation references

### **Enterprise Integration:**
- Internal standards compliance checking
- Security policy validation
- GitHub Enterprise workflow automation

### **Cost Optimization:**
- Marketplace price comparisons
- Resource optimization recommendations
- Enterprise billing analytics

---

*Template validated and approved for HOME-OFFICE-IMPROVEMENTS-LTD enterprise deployment*