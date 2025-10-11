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

---

## �️ **Advanced Features**

### **� Workflow Monitoring**

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

Our roadmap is maintained in the **[Project Wiki](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/wiki)**:

### **Current Status: Phase 4 Complete** ✅

- ✅ All core CLI commands implemented
- ✅ AI analytics and enterprise monitoring
- ✅ GitHub Actions workflow monitoring
- ✅ Azure DevOps and Lighthouse integration

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

<div align="center">

**🚀 Built with ❤️ for the Azure Community**

**Welcome aboard! Let's build something amazing together! 🌟**

---

*© 2025 HOME & OFFICE IMPROVEMENTS LTD. All rights reserved.*

</div>
