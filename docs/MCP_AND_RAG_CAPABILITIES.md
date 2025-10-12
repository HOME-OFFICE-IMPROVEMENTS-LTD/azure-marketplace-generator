# MCP and RAG Capabilities Inventory
*Comprehensive documentation for AI assistant collaboration*

## Overview

This document catalogs all available Model Context Protocol (MCP) tools and Retrieval-Augmented Generation (RAG) capabilities in the Azure Marketplace Generator workspace. This documentation enables effective collaboration between AI assistants and maximizes the utilization of available tools.

## Remote MCP Tools (10+ Categories)

### 1. Azure Core Management MCPs

#### Azure Resource Management
- **mcp_azure_mcp_group_list**: List all resource groups in subscription
- **mcp_azure_mcp_subscription_list**: List all subscriptions for account
- **Purpose**: Scope selection, governance, policy, access, cost management

#### Azure SignalR Services  
- **mcp_azure_mcp_signalr**: Manage Azure SignalR Service resources
- **mcp_azure_azure-m_signalr**: SignalR operations and management
- **Purpose**: Real-time communication service management

### 2. Azure Developer Tools MCPs

#### Azure Developer CLI (azd)
- **mcp_azure_azure-m_azd**: Complete development workflow automation
- **Features**: Project initialization, resource provisioning, deployment, monitoring
- **Purpose**: Streamline Azure development from code to cloud

#### Azure Documentation Search
- **mcp_azure_azure-m_documentation**: Search official Microsoft/Azure documentation
- **Returns**: High-quality content chunks (max 500 tokens each)
- **Sources**: Microsoft Learn, official Azure documentation
- **Purpose**: Ground answers in accurate, first-party Microsoft knowledge

### 3. GitHub Integration MCPs

#### GitHub Repository Management
- **mcp_github_github_get_commit**: Get commit details with diffs and stats
- **mcp_github_github_list_commits**: List commits for branches with pagination
- **mcp_github_github_push_files**: Push multiple files in single commit

#### GitHub Issues & Labels  
- **mcp_github_github_get_issue_comments**: Get comments for specific issues
- **mcp_github_github_get_label**: Get specific repository labels
- **mcp_github_github_label_write**: Create, update, delete labels
- **mcp_github_github_list_label**: List labels from repository or issue

#### GitHub Releases & Tags
- **mcp_github_github_get_latest_release**: Get latest repository release
- **mcp_github_github_get_release_by_tag**: Get release by tag name  
- **mcp_github_github_get_tag**: Get git tag details
- **mcp_github_github_list_releases**: List repository releases with pagination

#### GitHub Pull Requests
- **mcp_github_github_pull_request_read**: Get PR details, diffs, files, reviews
- **mcp_github_github_update_pull_request_branch**: Update PR with latest base changes

#### GitHub Projects
- **mcp_github_github_update_project_item**: Update project items and fields

#### GitHub Workflows & Jobs
- **mcp_github_github_get_job_logs**: Download workflow job logs or failed job logs

#### GitHub Search & Intelligence
- **mcp_github_github_web_search**: AI-powered web search with citations
- **mcp_github_github_list_copilot_spaces**: List accessible Copilot Spaces
- **mcp_github_github_get_copilot_space**: Get specific Copilot Space context

### 4. Microsoft Documentation MCPs

#### Microsoft Docs Search & Retrieval
- **Purpose**: Access official Microsoft documentation effectively
- **Workflow**: Search → Fetch → Code Samples
- **Coverage**: Microsoft Learn, Azure documentation, code examples

### 5. Azure DevOps MCPs

Available via activation functions:
- **Pipeline Management**: Build monitoring, logs, status management
- **Repository Management**: Branch/PR creation, comment threads
- **Work Item Management**: Create, update, link work items
- **Testing Management**: Test plans, suites, cases, results
- **Wiki Management**: Page creation, content retrieval
- **Project Management**: Teams, iterations, identity management

### 6. Azure Bicep MCPs

#### Bicep Development Tools
- **mcp_bicep_experim_get_az_resource_type_schema**: Get Azure resource schemas
- **mcp_bicep_experim_get_bicep_best_practices**: Bicep authoring best practices
- **mcp_bicep_experim_list_avm_metadata**: Azure Verified Modules metadata
- **mcp_bicep_experim_list_az_resource_types_for_provider**: List resource types by provider

## Specialized Azure MCPs (Activated on Demand)

### Storage & Databases
- **MySQL/PostgreSQL**: Database management and querying
- **Cosmos DB**: NoSQL database operations
- **Storage Accounts**: Blob service management
- **Redis Cache**: Cache management operations

### Container & App Services
- **Azure Container Registry (ACR)**: Container image management
- **Azure Kubernetes Service (AKS)**: Kubernetes cluster management  
- **App Service**: Web app and database management
- **Function Apps**: Serverless function management

### AI & Analytics
- **Speech Services**: Speech-to-text, audio processing
- **Azure AI Search**: Search service management and querying
- **Kusto (Data Explorer)**: Data analytics and KQL queries
- **Grafana**: Monitoring dashboard management

### Security & Compliance
- **Key Vault**: Secrets, keys, certificates management
- **Role Management**: RBAC permissions and assignments
- **Compliance Reports**: Azure Quick Review (azqr) security analysis

### Monitoring & Diagnostics  
- **Application Insights**: Performance monitoring
- **Azure Monitor**: Logs and metrics analysis
- **Resource Health**: Availability and health status
- **Load Testing**: Performance testing management

## Local RAG Capabilities (4 Core Types)

### 1. Semantic Search
- **Function**: `semantic_search`
- **Purpose**: Natural language search across workspace codebase
- **Returns**: Relevant code snippets and documentation
- **Use Cases**: Finding implementation examples, understanding architecture

### 2. Text Pattern Search
- **Function**: `grep_search`
- **Purpose**: Fast regex/text search within workspace files
- **Features**: Include patterns, recursive search, alternation support
- **Use Cases**: Finding specific strings, configurations, error messages

### 3. File Discovery
- **Function**: `file_search`
- **Purpose**: Find files by glob patterns from workspace root
- **Examples**: `**/*.{js,ts}`, `src/**`, `**/foo/**/*.js`
- **Use Cases**: Locating specific file types, exploring project structure

### 4. Web Content Retrieval
- **Function**: `fetch_webpage`
- **Purpose**: Fetch and summarize content from web pages
- **Use Cases**: Getting external documentation, analyzing web resources

## AI Assistant Collaboration Framework

### Tool Selection Guidelines

#### For Azure Operations
1. **Start with Core MCPs**: Use `mcp_azure_mcp_subscription_list` and `mcp_azure_mcp_group_list`
2. **Activate Specialized MCPs**: Call activation functions for specific service categories
3. **Use Documentation MCP**: Reference `mcp_azure_azure-m_documentation` for official guidance

#### For Code Analysis
1. **Semantic Search First**: Use `semantic_search` for conceptual understanding
2. **Pattern Search Next**: Use `grep_search` for specific implementations
3. **File Discovery**: Use `file_search` to locate relevant files
4. **Web Research**: Use `fetch_webpage` for external documentation

#### For GitHub Operations
1. **Repository Context**: Start with `mcp_github_github_list_commits` for recent changes
2. **Issue Management**: Use label and issue comment tools for tracking
3. **Release Management**: Use release and tag tools for version control
4. **AI Enhancement**: Use `mcp_github_github_web_search` for current information

### Best Practices for AI Assistants

#### MCP Tool Usage
- **Chain Operations**: Combine list operations with detail operations
- **Error Handling**: Always check return status and handle API limits
- **Context Building**: Use documentation MCPs to understand before acting
- **State Management**: Track changes across multiple MCP calls

#### RAG Integration  
- **Multi-Modal Search**: Combine semantic and pattern search for comprehensive coverage
- **Context Relevance**: Filter search results by file types and project areas
- **Knowledge Synthesis**: Combine local code context with external documentation
- **Incremental Discovery**: Start broad with semantic search, narrow with pattern search

## Usage Examples

### Example 1: Azure Resource Discovery
```bash
# 1. List subscriptions
mcp_azure_mcp_subscription_list

# 2. List resource groups in target subscription  
mcp_azure_mcp_group_list

# 3. Activate storage MCPs if needed
activate_azure_storage_and_databases

# 4. Search documentation for best practices
mcp_azure_azure-m_documentation
```

### Example 2: Code Understanding Workflow
```bash
# 1. Semantic search for high-level understanding
semantic_search("AI provider implementation")

# 2. Find specific files
file_search("**/*ai-provider*.ts")

# 3. Pattern search for specific implementations  
grep_search("class.*Provider", isRegexp=true)

# 4. Get external context if needed
fetch_webpage("https://docs.microsoft.com/azure/openai/")
```

### Example 3: GitHub Project Management
```bash
# 1. List recent commits for context
mcp_github_github_list_commits

# 2. Check current labels
mcp_github_github_list_label  

# 3. Update project items
mcp_github_github_update_project_item

# 4. Search for current best practices
mcp_github_github_web_search
```

## Tool Activation Map

### Azure Service Categories
- **Storage & Databases**: `activate_azure_storage_and_databases`
- **Container Management**: `activate_azure_container_management`  
- **Monitoring & Diagnostics**: `activate_azure_monitoring_and_diagnostics`
- **Security & Access**: `activate_azure_security_and_access_management`
- **AI & Analytics**: `activate_azure_ai_and_analytics`
- **Deployment & Config**: `activate_azure_deployment_and_configuration`

### GitHub Categories
- **Issue Management**: `activate_github_tools_issue_management`
- **Pull Request Management**: `activate_github_tools_pull_request_management`
- **Repository Management**: `activate_github_tools_repository_management`
- **Project Management**: `activate_github_tools_project_management`
- **Workflow Management**: `activate_github_tools_workflow_management`

### Documentation Categories
- **Microsoft Docs**: `activate_microsoft_documentation_tools`
- **Azure Bicep**: `activate_azure_bicep_tools`

## Integration with AI Provider Architecture

### RAG Enhancement
- **Local Knowledge Base**: Use workspace RAG for internal code understanding
- **External Knowledge**: Use documentation MCPs for official guidance
- **Hybrid Search**: Combine local semantic search with remote documentation search

### Validation Pipeline
- **Azure Resource Validation**: Use Azure MCPs for what-if deployments
- **Code Quality**: Use GitHub MCPs for PR reviews and CI/CD
- **Documentation**: Use Microsoft Docs MCPs for compliance checking

### Template Generation
- **Resource Discovery**: Use Azure MCPs to understand existing resources
- **Best Practices**: Use Bicep MCPs for schema and best practices
- **Version Control**: Use GitHub MCPs for template versioning

---

*This comprehensive inventory enables AI assistants to effectively leverage all available tools for Azure Marketplace Generator development, ensuring maximum productivity and collaboration efficiency.*