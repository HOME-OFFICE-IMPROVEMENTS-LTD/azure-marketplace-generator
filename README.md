# 🚀 Azure Marketplace Generator

> **Enterprise-grade Azure Marketplace Template Generator with AI-powered Analytics and Intelligent Monitoring**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)
[![Azure](https://img.shields.io/badge/Azure-Marketplace-blue.svg)](https://azuremarketplace.microsoft.com/)

## 🌟 Welcome to the Future of Azure Development

Azure Marketplace Generator is a comprehensive, user-friendly platform that transforms how developers create, deploy, and manage Azure marketplace applications. Whether you're a solo developer, startup, or enterprise team, our tools are designed to welcome everyone and help you achieve more in the Azure ecosystem.

---

## 🎯 **Available Commands**

### **Core Commands**

```bash
azmp create <type>                         # Create new managed application templates
azmp validate <path> [--ai] [--security]  # Validate applications with AI analysis
azmp package <path> [--marketplace]       # Package for marketplace submission
azmp deploy <package> [--environment]     # Deploy to Azure environments
```

### **Enterprise Monitoring & Analytics**

```bash
azmp monitor --init                        # Initialize monitoring
azmp monitor --discover                    # Auto-discover applications
azmp monitor --dashboard                   # Generate monitoring dashboard
azmp monitor --workflows                   # Monitor GitHub Actions workflows
azmp monitor --watch                       # Continuous monitoring mode

azmp insights --init                       # Initialize AI analytics
azmp insights --predictions                # Get AI predictions
azmp insights --optimizations              # Get optimization recommendations
azmp insights --market                     # Market intelligence analysis
```

### **Advanced Features**

```bash
azmp promote <package> <version>           # Promote to marketplace-ready version
azmp status                               # Show portfolio status and session summary
azmp auth [--setup] [--validate]         # Manage Azure authentication
azmp graph                                # Microsoft Graph integration
azmp help                                 # Comprehensive help system
```

### **GitHub Integration & Workflow Management**

```bash
azmp pr --list                            # List all open pull requests
azmp pr --status [number]                 # Show PR status (current or specific PR)
azmp pr --create "title"                  # Create new PR from current branch
azmp pr --approve <number>                # Approve specific PR
azmp pr --merge <number>                  # Merge approved PR
azmp pr --checks [number]                 # Show CI/CD check status
azmp pr --review <number>                 # Interactive PR review

azmp workflow <branch> "title"            # Complete GitFlow workflow automation
azmp workflow feature/auth "Add OAuth"    # Create feature branch and setup PR workflow
```

### **Integration & Testing**

```bash
azmp test-mcp [email]                     # Test Azure DevOps and Lighthouse MCP servers
azmp list-packages                        # List all available packages
```

---

## 🏗️ **Platform Architecture**

### **🔍 Phase 1: Intelligent Validation** ✅

Transform your development workflow with smart validation that catches issues early.

**Features:**

- **Smart Quality Assurance**: Automated ARM template validation with intelligent recommendations
- **Security Analysis**: Identifies missing security configurations before deployment
- **AI-Powered Analysis**: Machine learning-based optimization suggestions
- **Early Problem Detection**: Saves time and prevents deployment failures

**Commands:**

```bash
azmp validate ./myapp                      # Basic validation
azmp validate ./myapp --ai                 # AI-powered analysis
azmp validate ./myapp --security           # Security-focused validation
azmp validate ./myapp --intelligent        # Full intelligent analysis
azmp validate ./myapp --market-context     # Market-aware validation
```

### **📦 Phase 2: Smart Packaging** ✅

Create professional, marketplace-ready packages with intelligent optimization.

**Features:**

- **Automated Package Creation**: Professional ZIP packages in minutes
- **Marketplace Optimization**: Optimized metadata and descriptions
- **Size Optimization**: Compressed packages for faster marketplace submission
- **Compliance Bundling**: Ensures all required files are properly included

**Commands:**

```bash
azmp package ./myapp                       # Create optimized package
azmp package ./myapp --marketplace         # Marketplace-ready package
azmp package ./myapp --compress            # Maximum compression
azmp promote myapp.zip v1.0.0             # Promote to marketplace version
```

### **🚀 Phase 3: Auto-Deployment** ✅

Deploy your applications to Azure with confidence and ease.

**Features:**

- **One-Click Deployment**: Deploy entire application stacks with a single command
- **Environment Management**: Easy deployment to dev, test, and production environments
- **Rollback Capability**: Automatic rollback if deployment fails
- **Resource Tracking**: Know exactly what was deployed and where

**Commands:**

```bash
azmp deploy myapp.zip                      # Deploy to Azure
azmp deploy myapp.zip --environment prod   # Deploy to production
azmp deploy myapp.zip --interactive        # Interactive deployment
azmp deploy myapp.zip --dry-run           # Preview deployment
```

### **🤖 Phase 4: Enterprise Monitoring & AI Analytics** ✅

Optimize your applications with artificial intelligence and enterprise-grade monitoring.

**Features:**

- **🤖 AI-Powered Insights**: Get intelligent recommendations for optimization
- **📊 Real-Time Monitoring**: Keep track of application health and performance
- **💰 Cost Optimization**: AI suggests ways to reduce Azure spending efficiently
- **🔮 Predictive Analytics**: Forecast when you'll need to scale resources
- **🚨 Intelligent Alerting**: Get notified only when action is needed
- **� Workflow Monitoring**: Monitor GitHub Actions and CI/CD pipelines
- **🀽� Market Intelligence**: Stay competitive with marketplace insights

**Monitoring Commands:**

```bash
azmp monitor --init                        # Initialize monitoring configuration
azmp monitor --discover                    # Auto-discover Azure applications
azmp monitor --dashboard                   # Generate interactive dashboard
azmp monitor --alerts                      # Show active alerts only
azmp monitor --performance                 # Performance report
azmp monitor --compliance                  # Compliance status report
azmp monitor --recommendations             # Optimization recommendations
azmp monitor --workflows                   # GitHub Actions workflow status
azmp monitor --watch                       # Continuous monitoring mode
azmp monitor --export json                 # Export reports
```

**AI Analytics Commands:**

```bash
azmp insights --init                       # Initialize AI analytics
azmp insights --load-models                # Load AI models
azmp insights --predictions                # Get performance predictions
azmp insights --optimizations              # Get cost optimization suggestions
azmp insights --anomalies                  # Detect performance anomalies
azmp insights --market                     # Market intelligence analysis
azmp insights --export json                # Export AI insights
```

---

## 🚀 **Quick Start Guide**

### **Installation**

```bash
npm install -g @hoiltd/azure-marketplace-generator
```

### **Environment Configuration**

For security and flexibility, the platform uses environment variables for sensitive configuration:

```bash
# Copy the example environment file
cp .env.example .env

# Edit the file with your Azure credentials
# AZURE_TENANT_ID=your-tenant-id-here
# AZURE_SUBSCRIPTION_ID=your-subscription-id-here
```

**Required Environment Variables:**
- `AZURE_TENANT_ID` - Your Azure Active Directory tenant ID
- `AZURE_SUBSCRIPTION_ID` - Your Azure subscription ID

**Security Note:** Never commit hardcoded credentials to version control. Always use environment variables or Azure CLI authentication for production deployments.

### **Your First Project**

```bash
# 1. Create a new web application template
azmp create webapp myapp

# 2. Validate with AI-powered analysis
azmp validate ./myapp --ai

# 3. Package for marketplace
azmp package ./myapp --marketplace

# 4. Deploy to Azure
azmp deploy myapp.zip --interactive

# 5. Set up monitoring and AI analytics
azmp monitor --init
azmp insights --init

# 6. Start continuous monitoring
azmp monitor --workflows --watch
```

### **Complete Enterprise Workflow**

```bash
# 🎯 Complete enterprise development workflow:
azmp create webapp enterprise-app          # Generate optimized template
azmp validate ./enterprise-app --ai         # AI-powered validation
azmp package ./enterprise-app              # Create marketplace package
azmp deploy enterprise-app.zip --prod      # Deploy to production
azmp monitor --discover                     # Auto-discover resources
azmp monitor --watch                       # Start continuous monitoring
azmp insights --predictions                # Get AI predictions
```

### **GitHub Enterprise Workflow**

```bash
# 🌊 Systematic GitHub workflow (no UI required):
azmp workflow feature/new-template "Add storage template"  # Start feature
# ... make changes ...
git add . && git commit -m "feat: add new storage template"
git push origin feature/new-template
azmp pr --create "Add new storage template" --validate     # Create PR with validation
azmp pr --status                           # Monitor CI/CD checks
azmp pr --merge <number>                   # Merge when ready
```

---

## 🧠 **AI Assistant Collaboration & MCP Framework**

### **🌐 Model Context Protocol (MCP) Integration**

Our platform provides access to **10+ remote MCP servers** and **4 local RAG capabilities** for enhanced AI assistant collaboration. This enables any AI assistant to leverage our comprehensive toolset effectively.

**📚 [Complete MCP & RAG Documentation](./docs/MCP_AND_RAG_CAPABILITIES.md)**

#### **Key MCP Capabilities**

**Azure Management:**

- **Resource Management**: Subscription and resource group operations
- **Service Integration**: SignalR, Storage, Databases, Container services
- **Security & Compliance**: Key Vault, RBAC, security analysis
- **Monitoring & Analytics**: Application Insights, Azure Monitor, AI services

**GitHub Integration:**

- **Repository Management**: Commits, releases, tags, file operations
- **Project Management**: Issues, labels, pull requests, project boards
- **Workflow Automation**: GitHub Actions, CI/CD pipeline monitoring
- **AI-Powered Search**: Contextual web search with citations

**Documentation & Best Practices:**

- **Microsoft Documentation**: Official Azure/Microsoft docs search and retrieval
- **Azure Bicep**: Resource schemas, best practices, Azure Verified Modules
- **Code Samples**: Official Microsoft Learn code examples

#### **Local RAG Capabilities**

- **🔍 Semantic Search**: Natural language code understanding across workspace
- **🎯 Pattern Search**: Fast regex/text search with alternation support  
- **📁 File Discovery**: Glob pattern-based file location
- **🌐 Web Retrieval**: External documentation and resource fetching

### **🤖 AI Assistant Collaboration Framework**

**For AI Assistants Working with This Platform:**

```bash
# 1. Azure Resource Discovery Workflow
mcp_azure_mcp_subscription_list              # List available subscriptions
mcp_azure_mcp_group_list                     # List resource groups
activate_azure_storage_and_databases         # Activate specialized MCPs
mcp_azure_azure-m_documentation              # Search official guidance

# 2. Code Understanding Workflow  
semantic_search("AI provider implementation") # High-level understanding
file_search("**/*ai-provider*.ts")          # Find relevant files
grep_search("class.*Provider", isRegexp=true) # Pattern-based discovery

# 3. GitHub Project Management Workflow
mcp_github_github_list_commits               # Get recent changes context
mcp_github_github_list_label                 # Check current labels
mcp_github_github_web_search                 # AI-powered research
```

**Tool Selection Guidelines:**

- **Azure Operations**: Start with core MCPs, activate specialized categories as needed
- **Code Analysis**: Combine semantic search with pattern search for comprehensive coverage
- **GitHub Management**: Chain list operations with detail operations for full context
- **Documentation**: Use Microsoft Docs MCPs for official guidance and best practices

---

## �️ **Advanced Features**

### **🧠 Workflow Monitoring**

Monitor your GitHub Actions workflows automatically:

```bash
azmp monitor --workflows                   # Check current workflow status
azmp monitor --workflows --watch           # Continuous monitoring
azmp monitor --workflows --interval 5      # Check every 5 minutes
```

### **🤖 AI Analytics Engine**

Our AI capabilities provide:

- **Performance Prediction**: Forecast application performance trends
- **Anomaly Detection**: Identify unusual patterns before they cause issues
- **Cost Optimization**: AI-powered recommendations for efficient spending
- **Market Intelligence**: Competitive analysis and positioning insights

### **📊 Enterprise Monitoring Platform**

Professional monitoring includes:

- **Application Discovery**: Automatically find and catalog Azure resources
- **Health Monitoring**: Comprehensive service availability tracking
- **Performance Metrics**: CPU, memory, network, and storage monitoring
- **Automated Alerting**: Multi-channel notifications
- **Dashboard Generation**: Interactive monitoring dashboards

### **🔗 GitHub Integration**

Seamless GitHub workflow management without leaving the CLI:

```bash
azmp pr --list                             # List all open PRs with status
azmp pr --create "Add new feature"         # Create PR from current branch
azmp pr --approve 42 --body "LGTM!"       # Approve with comment
azmp pr --merge 42 --method squash         # Squash and merge
azmp workflow feature/oauth "Add OAuth2"   # Complete GitFlow automation
```

**GitFlow Integration:**

- Automatic feature branch creation
- Integrated PR lifecycle management
- CI/CD monitoring and status checks
- Branch protection and review requirements
- Zero GitHub UI dependency

### **🔗 Integration Ecosystem**

Works seamlessly with:

- **Azure DevOps**: Full CI/CD pipeline integration via MCP servers
- **GitHub Actions**: Automated workflows and validation
- **Microsoft Graph**: Organizational intelligence and collaboration
- **Azure Monitor**: Native Azure monitoring integration
- **Lighthouse**: Performance and accessibility testing

---

## � **Platform Statistics**

### **Current Capabilities**

- **8,000+** lines of production-ready TypeScript code
- **11 Core Commands** with extensive options and flags
- **50+** intelligent validation rules
- **25+** marketplace optimization features
- **15+** AI analytics models
- **Comprehensive** Azure resource monitoring
- **Real-time** GitHub Actions workflow monitoring

### **Technology Stack**

- **TypeScript 5.9+** for type safety and modern development
- **Node.js 18+** for cross-platform compatibility
- **ESLint 9** with modern flat configuration
- **Commander.js** for robust CLI interface
- **Chalk** for beautiful terminal output
- **Inquirer.js** for interactive prompts

---

## 📚 **Documentation & Support**

### **Core Documentation**

- 📖 **[Architecture Guide](./docs/ARCHITECTURE.md)** - Understanding the platform design
- 🏗️ **[Managed Applications Guide](./docs/MANAGED_APPLICATIONS_GUIDE.md)** - Complete solution patterns
- 📂 **[Examples Repository](./examples/)** - Sample applications and templates
- 📝 **[Development Log](./docs/DEVELOPMENT_LOG.md)** - Platform evolution history

### **Getting Help**

- 💬 **[Community Discussions](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/discussions)**
- 🐛 **[Issue Tracker](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/issues)**
- 📋 **[Wiki](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/wiki)** - Roadmap and detailed guides

---

## 🤝 **Community & Contributing**

### **Contributing Guidelines**

Please read our **[Contributing Guide](./CONTRIBUTING.md)** and **[Code of Conduct](./CODE_OF_CONDUCT.md)**.

### **Ways to Contribute**

- 🐛 **Report Bugs**: Help us improve by reporting issues
- 💡 **Suggest Features**: Share ideas for new capabilities
- 📝 **Improve Documentation**: Help make our guides clearer
- 🔧 **Contribute Code**: Submit pull requests for features or fixes

---

## � **Roadmap**

📋 **Our comprehensive roadmap and detailed project planning is available in our [Project Wiki](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/wiki)** - featuring milestone tracking, feature specifications, and community-driven development priorities.

### **Current Status: Phase 4 Complete** ✅

- ✅ All core CLI commands implemented
- ✅ AI analytics and enterprise monitoring
- ✅ GitHub Actions workflow monitoring
- ✅ Azure DevOps and Lighthouse integration
- ✅ **NEW**: GitHub PR management and GitFlow automation

### **Next: Azure Managed Applications Focus**

- 🔄 Enhanced managed applications templates
- 🔄 Advanced marketplace optimization
- 🔄 Multi-environment deployment strategies

---

## 📄 **License**

This project is licensed under the **MIT License** - see the **[LICENSE](./LICENSE)** file for details.

---

## 🙏 **Acknowledgments**

Special thanks to:

- **Microsoft Azure Team** for excellent cloud platform and documentation
- **Open Source Community** for inspiration and collaboration
- **Our Contributors** who help make this platform better

---

---

## 🚀 Built with ❤️ for the Azure Community

Welcome aboard! Let's build something amazing together! 🌟

---

*© 2025 HOME & OFFICE IMPROVEMENTS LTD. All rights reserved.*
