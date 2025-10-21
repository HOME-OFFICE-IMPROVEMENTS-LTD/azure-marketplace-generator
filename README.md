# Azure Marketplace Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)
[![Version](https://img.shields.io/badge/version-3.0.0-brightgreen.svg)](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/releases)

Enterprise-grade CLI tool for generating Azure Storage marketplace managed applications with comprehensive security and data protection features.

## Features

### 🚀 Core Capabilities

- **Storage-focused managed application generation** with production-ready templates
- **ARM template validation** with Microsoft ARM-TTK integration
- **Marketplace-ready package creation** for Azure Marketplace submission
- **TypeScript with full type safety** for reliability and maintainability
- **Extensible plugin architecture** for custom templates and commands (v3.0.0+)

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

## License

MIT © Home & Office Improvements Ltd
