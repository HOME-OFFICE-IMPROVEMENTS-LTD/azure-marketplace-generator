---
name: 🤖 MCP Integration Test - Azure Storage Template
about: Test GitHub Copilot coding agent with MCP servers for Azure template generation
title: "🧪 Test: Generate Azure Storage Account template with Marketplace integration"
labels: ["test", "mcp-validation", "azure", "template-generation"]
assignees: ["@copilot"]
---

## 🎯 **Test Objective**
Validate that GitHub Copilot coding agent can successfully use our MCP servers to:
1. Access Azure Marketplace pricing information
2. Generate compliant ARM templates using real-time schema validation
3. Reference latest Microsoft documentation

## 📋 **Task Details**

### **Primary Request:**
Generate a **secure Azure Storage Account ARM template** with the following requirements:

#### **Storage Account Specifications:**
- **Performance:** Standard
- **Replication:** GRS (Geo-Redundant Storage)
- **Access Tier:** Hot
- **Kind:** StorageV2
- **TLS Version:** 1.2 minimum
- **Blob Public Access:** Disabled
- **Shared Key Access:** Disabled
- **Network Access:** Restricted to VNet only

#### **Security Requirements:**
- Enable encryption at rest
- Enable infrastructure encryption
- Configure private endpoints
- Add network ACLs
- Enable audit logging
- Implement Key Vault integration for keys

#### **Marketplace Integration Test:**
- Query current Azure Storage pricing for the UK South region
- Include cost estimation comments in the template
- Add marketplace category tags for billing

#### **Template Validation:**
- Ensure ARM template passes latest schema validation
- Include parameter validation and descriptions
- Add appropriate metadata and tags
- Follow Azure naming conventions

## 🔍 **Expected MCP Server Usage**

### **azure-marketplace server should:**
- Provide current storage pricing data
- Suggest appropriate SKU based on requirements
- Include marketplace positioning information

### **azure-arm-templates server should:**
- Validate template schema in real-time
- Suggest ARM template best practices
- Ensure parameter types and constraints are correct

### **microsoft-docs server should:**
- Reference latest Azure Storage documentation
- Include links to relevant Microsoft Learn articles
- Ensure compliance with current Azure standards

## ✅ **Success Criteria**
- [ ] Template generates without errors
- [ ] Schema validation passes
- [ ] Security requirements are implemented
- [ ] Marketplace pricing information is included
- [ ] Microsoft documentation references are current
- [ ] Template follows enterprise naming conventions
- [ ] All MCP servers respond successfully

## 📊 **Deliverables**
1. Complete ARM template file (`storage-account-secure.json`)
2. Parameters file (`storage-account-secure.parameters.json`)
3. Deployment script with Azure CLI commands
4. Cost estimation based on marketplace data
5. Documentation with Microsoft Learn references

## 🏢 **Enterprise Context**
This template will be used for HOME-OFFICE-IMPROVEMENTS-LTD production deployments, so it must meet enterprise security and compliance standards.

---

**@copilot** Please proceed with this task using the configured MCP servers. Demonstrate the integration capabilities by showing pricing data, schema validation, and documentation references in your response.