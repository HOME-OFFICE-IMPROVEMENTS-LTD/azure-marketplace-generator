# v3.0.0 - Enhanced Security & Data Protection

🚀 **Major Feature Release** - Production-Ready Azure Storage Marketplace Applications

This release introduces comprehensive security and data protection features for Azure Storage managed applications, along with an extensible plugin architecture foundation for future customization.

---

## 🎯 What's New

### 🔒 Security Features (7 Parameters)

- **Blob Public Access Control** (`allowBlobPublicAccess`) - Prevent anonymous access to blobs
- **TLS Version Enforcement** (`minimumTlsVersion`) - Require minimum TLS 1.2 for all connections
- **HTTPS-Only Traffic** (`supportsHttpsTrafficOnly`) - Enforce secure transport for all requests
- **Public Network Access Control** (`publicNetworkAccess`) - Restrict access to selected networks
- **OAuth Default Authentication** (`defaultToOAuthAuthentication`) - Prioritize Microsoft Entra ID authentication
- **Shared Key Access Management** (`allowSharedKeyAccess`) - Disable legacy shared key authentication
- **Infrastructure Encryption** (`requireInfrastructureEncryption`) - Double encryption for data at rest

### 🛡️ Data Protection Features (5 Parameters)

- **Blob Soft Delete** (`blobSoftDeleteDays`) - Configurable retention (7-365 days) for deleted blobs
- **Container Soft Delete** (`containerSoftDeleteDays`) - Configurable retention (7-365 days) for deleted containers
- **Blob Versioning** (`enableVersioning`) - Automatic version tracking for blob modifications
- **Change Feed** (`changeFeedEnabled`) - Ordered transaction log for all storage changes
- **Last Access Time Tracking** (`lastAccessTimeTrackingEnabled`) - Monitor and optimize storage costs

### 🔌 Plugin Architecture Foundation

- **Stable `IPlugin` Interface** - Future-proof API contract for extensibility
- **`TemplateRegistry`** - Centralized management with collision detection
- **`PluginLoader`** - Lifecycle management with timeout enforcement and cleanup guarantees
- **`BasePlugin` Class** - Abstract base class for rapid plugin development
- **Backward Compatible** - All existing functionality preserved
- **Full Implementation Planned** - v3.1.0 will add plugin loading and discovery

### 📚 Comprehensive Documentation (9 Guides)

1. **SECURITY_FEATURES.md** - Complete guide to all 7 security parameters with best practices
2. **DATA_PROTECTION_GUIDE.md** - Data protection features, recovery scenarios, and cost optimization
3. **PLUGIN_ARCHITECTURE.md** - Plugin development guide and extensibility roadmap
4. **AZURE_LIVE_TESTING.md** - 7-phase Azure deployment testing methodology (35 tests)
5. **CONFIGURATION_GUIDE.md** - Config file usage for consistent deployments
6. **PRODUCTION_FEATURES.md** - Summary of all production-ready enhancements
7. **TEMPLATE_VALIDATION_STANDARDS.md** - ARM template validation best practices
8. **MANAGED_APPLICATIONS_GUIDE.md** - Azure Managed Applications architecture
9. **DEVELOPMENT_LOG.md** - Complete version history and development phases

---

## ✅ Quality Assurance

### Testing
- ✅ **92/92 Unit Tests Passing** (100% success rate)
- ✅ **35/35 Azure Live Tests Passing** - Real Azure deployments tested
- ✅ **End-to-End Template Generation** - Verified working
- ✅ **All Parameters Verified** - Cross-referenced with official Microsoft documentation

### Security
- ✅ **0 Vulnerabilities** - Clean npm audit
- ✅ **Secure Defaults** - All security parameters default to secure values
- ✅ **Compliance Ready** - Mappings for GDPR, HIPAA, PCI-DSS, SOC 2

### Code Quality
- ✅ **Clean TypeScript Compilation** - No errors
- ✅ **Plugin Code Lint-Clean** - ESLint passing for new code
- ✅ **Critical Bug Fixes** - minLength validation added to prevent invalid deployments

---

## 📦 Package Enhancements

### NPM Package Improvements
- **Optimized Package Size** - ~40% reduction (excludes dev files with .npmignore)
- **Enhanced Metadata** - Repository, homepage, and issues URLs added
- **Better Discoverability** - 10 searchable keywords (was 5)
- **Professional Presentation** - Complete npm package page with all links
- **Explicit File Whitelist** - Only ships production-ready files

### Package.json Updates
```json
{
  "repository": "https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator",
  "homepage": "https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator#readme",
  "bugs": "https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/issues",
  "keywords": ["azure", "marketplace", "managed-applications", "arm-templates", 
               "partner-center", "azure-storage", "cli", "typescript", 
               "security", "data-protection"]
}
```

---

## 🔄 Backward Compatibility

✅ **100% Backward Compatible** - This is a major feature release with **NO BREAKING CHANGES**

- All new features are **additive**
- Plugin system is **opt-in**
- Existing users can upgrade **seamlessly**
- No API changes to existing functionality
- No parameter removals or renames

---

## 🚀 Getting Started

### Installation
```bash
npm install -g @hoiltd/azure-marketplace-generator
```

### Usage
```bash
# Create storage managed application with all security features
azmp create storage --publisher "MyCompany" --name "SecureStorage"

# Validate templates
azmp validate ./output

# Package for marketplace
azmp package ./output
```

### Configuration
Create `azmp-config.json` for consistent deployments:
```json
{
  "publisher": "MyCompany",
  "defaults": {
    "location": "eastus",
    "minimumTlsVersion": "TLS1_2",
    "supportsHttpsTrafficOnly": true,
    "allowBlobPublicAccess": false
  }
}
```

---

## 📖 Documentation

**User Guides:**
- [Security Features Guide](docs/SECURITY_FEATURES.md)
- [Data Protection Guide](docs/DATA_PROTECTION_GUIDE.md)
- [Configuration Guide](docs/CONFIGURATION_GUIDE.md)

**Developer Resources:**
- [Plugin Architecture](docs/PLUGIN_ARCHITECTURE.md)
- [Azure Live Testing](docs/AZURE_LIVE_TESTING.md)
- [Template Validation Standards](docs/TEMPLATE_VALIDATION_STANDARDS.md)

**Official Resources:**
- [Azure Storage Documentation](https://learn.microsoft.com/en-us/azure/storage/)
- [Azure Verified Modules](https://github.com/Azure/bicep-registry-modules)

---

## 🗺️ Roadmap

### v3.1.0 (Planned)
- Plugin loader implementation with dynamic discovery
- Automatic plugin registration from config files
- CLI command extensions support
- Private endpoint configuration
- Customer-managed encryption keys (CMK)

### v3.2.0 (Future)
- Plugin marketplace/catalog
- Plugin dependency management
- Advanced network security rules
- Azure AD RBAC role assignments

### v4.0.0 (Future)
- MCP (Model Context Protocol) server support
- Remote plugin loading
- Multi-region deployment support
- Disaster recovery templates

---

## 🐛 Bug Fixes

- **CRITICAL**: Added missing `minLength` validation to `storageAccountNamePrefix` parameter
- **CRITICAL**: Added missing `minLength` and `maxLength` validation to `applicationName` parameter
- Fixed UI validation to match ARM template validation for all string parameters

---

## 📝 Full Changelog

See [CHANGELOG.md](CHANGELOG.md) for complete details of all changes.

---

## 🙏 Acknowledgments

Special thanks to:
- Microsoft Azure documentation team for comprehensive parameter specifications
- Azure Verified Modules contributors for best practices
- All users who provided feedback during development

---

## 📄 License

MIT © Home & Office Improvements Ltd

---

## 🔗 Links

- **Repository**: https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator
- **Issues**: https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/issues
- **NPM Package**: https://www.npmjs.com/package/@hoiltd/azure-marketplace-generator
- **Documentation**: https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator#readme

---

**Released**: October 21, 2025  
**Commit**: a4f1e70  
**Tag**: v3.0.0
