# Microsoft Graph MCP Server

A Model Context Protocol (MCP) server that provides organizational context through Microsoft Graph API integration. This server leverages your existing Azure authentication infrastructure to deliver intelligent organizational insights for the Azure Marketplace Generator.

## 🚀 Features

### Core Graph API Integration
- **User Management**: Search users, get profiles, and organizational structure
- **Group Operations**: Retrieve security groups, Microsoft 365 groups, and distribution lists
- **Organization Info**: Get tenant details and organizational context

### RAG-Ready Content Access
- **SharePoint Integration**: Search documents, pages, and lists across your SharePoint environment
- **Teams Content**: Access team conversations, files, and organizational knowledge
- **Intelligent Search**: Query organizational content for marketplace solution customization

### Authentication
- **Seamless Integration**: Uses your existing `azure-auth-helper.sh` authentication workflow
- **Azure CLI Compatible**: Leverages Azure CLI credentials for simplified setup
- **MFA Support**: Works with your resolved Azure MFA authentication

## 🛠️ Installation

```bash
cd packages/graph-mcp-server
npm install
npm run build
```

## 🔧 Configuration

1. **Copy environment template:**
```bash
cp .env.example .env
```

2. **Ensure Azure authentication is working:**
```bash
# From the root project directory
azmp auth --check
# Should show: ✅ Currently authenticated with Azure CLI, User: info@hoiltd.com
```

3. **Configure Graph API permissions** (if using service principal):
Required permissions in Azure AD:
- `User.Read` (delegated)
- `User.ReadBasic.All` (delegated)
- `Group.Read.All` (delegated)  
- `Sites.Read.All` (delegated)
- `Team.ReadBasic.All` (delegated)
- `ChannelMessage.Read.All` (delegated)
- `Files.Read.All` (delegated)

## 🎯 Usage

### Standalone Server
```bash
npm start
```

### With MCP Client
The server provides the following tools:

#### User Operations
- `get_user_profile` - Get current user profile
- `search_users` - Search for users by name or email
- `get_user_groups` - Get groups for a specific user

#### Organization Operations  
- `get_organization_groups` - Get organization groups by type
- `get_organization_info` - Get tenant and organization details

#### RAG Content Operations
- `search_sharepoint_content` - Search SharePoint for documents, pages, lists
- `get_teams_content` - Access Teams conversations and files

### Integration with Azure Marketplace Generator

Add to your MCP client configuration:
```json
{
  "mcpServers": {
    "graph": {
      "command": "node",
      "args": ["./packages/graph-mcp-server/dist/index.js"],
      "cwd": "/path/to/azure-marketplace-generator"
    }
  }
}
```

## 🏗️ Architecture

```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   MCP Client        │    │  Graph MCP Server    │    │  Microsoft Graph    │
│   (Claude/Copilot)  │◄──►│                      │◄──►│     API             │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
                                      │
                                      ▼
                           ┌──────────────────────┐
                           │  Azure CLI Auth      │
                           │  (azure-auth-helper) │
                           └──────────────────────┘
```

## 🎨 Use Cases for Azure Marketplace Generator

### Intelligent Template Customization
```javascript
// Get organizational context for ARM template personalization
const orgInfo = await graphClient.get_organization_info();
const userGroups = await graphClient.get_user_groups("current-user");

// Customize marketplace solutions based on:
// - Organization size and structure
// - User roles and permissions
// - Existing group policies
```

### Knowledge-Driven Documentation
```javascript
// Search organizational SharePoint for best practices
const bestPractices = await graphClient.search_sharepoint_content(
  "Azure deployment best practices",
  { contentType: "documents", limit: 10 }
);

// Incorporate existing organizational knowledge into generated solutions
```

### Team-Aware Resource Planning
```javascript
// Get Teams content for solution planning
const teamContent = await graphClient.get_teams_content(
  undefined, // all teams
  undefined, // all channels  
  "infrastructure requirements",
  { contentType: "files", limit: 20 }
);

// Use team discussions to inform resource allocation
```

## 🔍 Example Outputs

### User Profile
```json
{
  "id": "user-guid",
  "displayName": "John Doe",
  "mail": "john.doe@hoiltd.com",
  "userPrincipalName": "john.doe@hoiltd.com",
  "jobTitle": "Azure Solutions Architect",
  "department": "IT Infrastructure",
  "officeLocation": "London"
}
```

### SharePoint Search Results
```json
[
  {
    "id": "doc-guid",
    "name": "Azure Deployment Guidelines.docx",
    "webUrl": "https://hoiltd.sharepoint.com/...",
    "summary": "Guidelines for deploying Azure resources...",
    "contentType": "document",
    "lastModified": "2024-10-05T10:30:00Z",
    "createdBy": "Sarah Johnson"
  }
]
```

## 🚦 Status Indicators

- ✅ **Authentication**: Integrated with existing azure-auth-helper.sh
- ✅ **Core Graph API**: Users, Groups, Organization info
- ✅ **SharePoint Search**: Document and content discovery
- ✅ **Teams Integration**: Messages and file access
- ⏳ **Advanced RAG**: Vector embeddings and semantic search
- ⏳ **Caching**: Redis/memory caching for performance

## 🔗 Related

- [Azure Authentication Solutions](../../docs/AZURE_AUTHENTICATION_SOLUTIONS.md)
- [Main CLI Auth Commands](../../src/cli/commands/auth.ts)
- [Azure Auth Helper Script](../../scripts/azure-auth-helper.sh)

## 📝 Development

```bash
# Development mode with hot reload
npm run dev

# Run tests
npm test

# Type checking
npx tsc --noEmit
```

## 🛡️ Security

- Uses Azure CLI authentication (no stored credentials)
- Respects Microsoft Graph API rate limits
- Minimal permission scope (read-only operations)
- Audit logging for all Graph API calls