# Azure Marketplace Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)
[![Version](https://img.shields.io/npm/v/@hoiltd/azure-marketplace-generator)](https://www.npmjs.com/package/@hoiltd/azure-marketplace-generator)
[![npm](https://img.shields.io/npm/dt/@hoiltd/azure-marketplace-generator)](https://www.npmjs.com/package/@hoiltd/azure-marketplace-generator)
[![Tests](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/workflows/CI/badge.svg)](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/actions)

Enterprise-grade CLI tool for generating Azure Storage marketplace managed applications with comprehensive security and data protection features.

## Features

### 🚀 Core Capabilities

- **Storage-focused managed application generation** with production-ready templates
- **ARM template validation** with Microsoft ARM-TTK integration
- **Marketplace-ready package creation** for Azure Marketplace submission
- **TypeScript with full type safety** for reliability and maintainability
- **Extensible plugin architecture** for custom templates and commands (v3.1.0 - ✅ Fully Operational)
  - Install plugins from npm or use local plugins
  - Extend with custom Handlebars helpers
  - Add CLI commands dynamically
  - First official plugin: [@hoiltd/azmp-plugin-vm@2.1.0](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azmp-plugin-vm) - ✅ 98% ARM-TTK Compliance

### 🔒 Enhanced Security Features (v3.0.0)

- **Blob Public Access Control** - Prevent anonymous access to blobs
- **TLS Version Enforcement** - Require minimum TLS 1.2 for all connections
- **HTTPS-Only Traffic** - Enforce secure transport for all requests
- **Public Network Access Control** - Restrict access to selected networks
- **OAuth Default Authentication** - Prioritize Microsoft Entra ID (Azure AD) authentication
- **Shared Key Access Management** - Disable legacy shared key authentication
- **Infrastructure Encryption** - Double encryption for data at rest

### 🛡️ Data Protection Features (v3.0.0)

- **Blob Soft Delete** - Configurable retention (7-365 days) for deleted blobs
- **Container Soft Delete** - Configurable retention (7-365 days) for deleted containers
- **Blob Versioning** - Automatic version tracking for blob modifications
- **Change Feed** - Ordered transaction log for all changes
- **Last Access Time Tracking** - Monitor and optimize storage costs

> **Note:** All parameters are verified against [official Microsoft Azure documentation](https://learn.microsoft.com/en-us/azure/storage/) for production compliance.


## Installation

### From NPM (Recommended)

```bash
# Install globally
npm install -g @hoiltd/azure-marketplace-generator

# Verify installation
azmp --version
```

### From Source

```bash
# Clone and install
git clone https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator.git
cd azure-marketplace-generator
npm install

# Install ARM-TTK for validation
npm run install-arm-ttk

# Build the CLI
npm run build
```

## Quick Links

- 📦 **[NPM Package](https://www.npmjs.com/package/@hoiltd/azure-marketplace-generator)** - Install the latest version
- 📖 **[GitHub Wiki](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/wiki)** - Comprehensive guides and tutorials
- 🚀 **[Releases](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/releases)** - Version history and changelogs
- 💬 **[Discussions](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/discussions)** - Community support and ideas
- 🐛 **[Issues](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/issues)** - Bug reports and feature requests
- 🔌 **[Plugin: VM](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azmp-plugin-vm)** - Virtual Machine plugin (@hoiltd/azmp-plugin-vm@2.1.0) - ✅ Marketplace Certified

## Usage

### Create Storage Solution

```bash
azmp create storage --publisher "MyCompany" --name "MyStorageApp"
```

**Generated templates include:**

- ✅ All security parameters (7) configured with secure defaults
- ✅ All data protection features (5) with recommended settings
- ✅ Production-ready ARM templates validated against Azure specifications
- ✅ UI definitions with intuitive configuration steps

For detailed parameter configuration, see [SECURITY_FEATURES.md](docs/SECURITY_FEATURES.md) and [DATA_PROTECTION_GUIDE.md](docs/DATA_PROTECTION_GUIDE.md).

### Validate Templates

```bash
azmp validate ./output
```

### Package for Marketplace

```bash
azmp package ./output
```

## Commands

| Command | Description |
|---------|-------------|
| `azmp create storage` | Create new storage managed application |
| `azmp validate <path>` | Validate ARM templates with ARM-TTK |
| `azmp package <path>` | Package templates for marketplace submission |

## Output Structure

```text
output/
├── mainTemplate.json          # ARM template
├── createUiDefinition.json    # UI definition  
├── viewDefinition.json        # Management view
└── nestedtemplates/           # Nested templates
    └── storageAccount.json
```

## Requirements

- Node.js 18+
- PowerShell (for ARM-TTK validation)

## Development

```bash
# Run in development mode
npm run dev

# Run tests  
npm test

# Lint code
npm run lint
```

## Documentation

### 📚 User Guides
- **[Configuration Guide](docs/CONFIGURATION_GUIDE.md)** - Learn how to use config files for consistent settings
- **[Security Features](docs/SECURITY_FEATURES.md)** - Comprehensive guide to all 7 security parameters
- **[Data Protection Guide](docs/DATA_PROTECTION_GUIDE.md)** - Complete guide to data protection features and recovery

### 🔧 Developer Resources
- **[Production Features](docs/PRODUCTION_FEATURES.md)** - Summary of all production-ready enhancements
- **[Development Log](docs/DEVELOPMENT_LOG.md)** - Version history and development phases
- **[Changelog](CHANGELOG.md)** - Detailed changelog following Keep a Changelog format
- **[Azure Live Testing](docs/AZURE_LIVE_TESTING.md)** - Comprehensive Azure deployment testing guide
- **[Plugin Architecture](docs/PLUGIN_ARCHITECTURE.md)** - Extensibility framework for custom templates (v3.0.0+)

### 🔗 Official Resources
- [Azure Storage Documentation](https://learn.microsoft.com/en-us/azure/storage/)
- [Azure Verified Modules](https://github.com/Azure/bicep-registry-modules)
- [@azure/arm-storage SDK](https://learn.microsoft.com/en-us/javascript/api/@azure/arm-storage/)

## Roadmap

### ✅ v3.0.0 (Released - October 2024)

- ✅ Plugin interface foundation
- ✅ 12 security and data protection parameters
- ✅ Comprehensive documentation (9 guides)
- ✅ Full Azure live testing (35/35 tests)

### ✅ v3.1.0 (Released - December 2024)

**Plugin System Implementation:**

- ✅ Plugin loader with dynamic discovery
- ✅ Automatic plugin registration from config files
- ✅ CLI command extensions support
- ✅ Template type registration API
- ✅ Handlebars helper registration API
- ✅ Security validations (path traversal, workspace protection)
- ✅ Conflict detection for helpers, commands, templates
- ✅ Error isolation and timeout handling
- ✅ Comprehensive test suite (119 tests passing)
- ✅ Published to NPM registry
- ✅ GitHub Actions security hardening (CodeQL alerts fixed)

**Official Plugin Available:**

📦 **[@hoiltd/azmp-plugin-vm@2.1.0](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azmp-plugin-vm)** - Virtual Machine plugin with comprehensive Azure VM support

**Latest: v2.1.0 (October 31, 2025)**
- ✅ **98% ARM-TTK Compliance** (46/47 tests passing)
- ✅ **Marketplace Certified** - Production-ready templates
- ✅ **801 passing tests** (92% of 872 total test suite)
- ✅ **178 Handlebars helpers** for advanced template generation
- ✅ **44 CLI commands** for VM configuration
- 📦 **Features:** VM sizes, OS images, networking, security, identity, HA, backup, monitoring

**Installation:**
```bash
npm install @hoiltd/azmp-plugin-vm@^2.1.0
```

**Configuration Example:**
```json
{
  "plugins": [
    {
      "package": "@hoiltd/azmp-plugin-vm",
      "enabled": true,
      "options": {
        "defaultVmSize": "Standard_D2s_v3",
        "security": {
          "enableTrustedLaunch": true
        }
      }
    }
  ]
}
```

**Resources:**
- 📖 [Plugin Documentation](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azmp-plugin-vm#readme)
- 📋 [Release Notes v2.1.0](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azmp-plugin-vm/releases/tag/v2.1.0)
- 🔧 [Integration Guide](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azmp-plugin-vm/blob/main/INTEGRATION_GUIDE.md)

### 🚧 v3.2.0 (In Development)

**Core Improvements:**

- [ ] Semver validation for plugin versions
- [ ] Eager template validation on plugin load
- [ ] Plugin performance optimizations
- [ ] Enhanced error messages and debugging

**Plugin Ecosystem:**

- [ ] Plugin documentation improvements
- [ ] Plugin testing utilities
- [ ] Community plugin registry

**Storage Features:**

- [ ] Private endpoint configuration
- [ ] Customer-managed encryption keys (CMK)
- [ ] Immutability policies for compliance
- [ ] Advanced network security rules
- [ ] Azure AD RBAC role assignments
- [ ] Diagnostic settings and monitoring

### 🔮 Future Releases

**Q1 2026: Compliance & Policy Guardrails Plugin**

🛡️ **Enterprise Compliance Made Effortless**

Next generation plugin for automatic governance and compliance frameworks:

**Core Features:**
- ✨ **One-click compliance** frameworks (CIS, NIST 800-53, Azure Security Benchmark)
- 🔒 **Automatic security baselines** with Defender for Cloud integration
- 📋 **Policy as Code** with pre-built Azure Policy initiatives
- 🚨 **Continuous monitoring** with compliance dashboards and alerting
- 📊 **Compliance evidence** generation for Partner Center submissions

**Enterprise Value:**
- 🏢 **Enterprise trust** - Built-in governance reduces security concerns
- 💰 **Premium pricing** - Compliance commands higher deal values
- 🔗 **Customer retention** - Governance creates switching costs
- 🏆 **Competitive advantage** - Most marketplace tools ignore compliance

**Target Frameworks:**
- CIS Azure Foundations Benchmark (Level 1 & 2)
- NIST 800-53 (Moderate/High impact controls)
- Azure Security Benchmark (Microsoft official baseline)
- ISO 27001 Information Security Management
- Industry-specific: HIPAA, PCI DSS, FedRAMP, GDPR

```bash
# Example usage
azmp create vm-solution --compliance=cis-level1
azmp create vm-solution --compliance=nist-800-53
azmp create storage --compliance=azure-security-benchmark
```

📖 **[Full Proposal](docs/COMPLIANCE_PLUGIN_PROPOSAL.md)** - Detailed technical specifications and implementation roadmap

**Advanced Extensibility:**

- [ ] MCP (Model Context Protocol) server support
- [ ] Remote plugin loading from registries
- [ ] Plugin security scanning and verification
- [ ] Advanced plugin APIs and lifecycle management
- [ ] Plugin performance monitoring

**Storage Features:**

- [ ] Multi-region deployment support
- [ ] Geo-replication configuration
- [ ] Disaster recovery templates
- [ ] Advanced monitoring dashboards

> **Note:** See [PLUGIN_ARCHITECTURE.md](docs/PLUGIN_ARCHITECTURE.md) for detailed plugin development guide and [GitHub Wiki](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/wiki) for roadmap updates.

## Contributing

Contributions are welcome! Please ensure:

1. All tests pass (`npm test`)
2. Code follows TypeScript and ESLint standards
3. Documentation is updated
4. Commit messages follow conventional commits

## Support

For issues, questions, or contributions:

- **Issues:** [GitHub Issues](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/issues)
- **Discussions:** [GitHub Discussions](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/discussions)
- **Wiki:** [GitHub Wiki](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/wiki)

## License

MIT © Home & Office Improvements Ltd
