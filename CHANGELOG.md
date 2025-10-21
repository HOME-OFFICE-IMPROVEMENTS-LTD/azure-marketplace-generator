# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Coming Soon

#### v3.1.0 (Planned)

**Plugin System Implementation:**
- Plugin loader with dynamic discovery
- Automatic plugin registration from config files
- CLI command extensions support
- Template type registration API
- Handlebars helper registration API

**Storage Features:**
- Private endpoint configuration
- Customer-managed encryption keys (CMK)
- Immutability policies for compliance

#### v3.2.0 (Future)

**Plugin Ecosystem:**
- Plugin marketplace/catalog
- Plugin dependency management
- Hot reload support
- Plugin sandboxing and isolation

**Storage Features:**
- Advanced network security rules
- Azure AD RBAC role assignments
- Diagnostic settings and monitoring

#### v4.0.0 (Future)

**Advanced Extensibility:**
- MCP (Model Context Protocol) server support
- Remote plugin loading
- Plugin security scanning
- Advanced plugin APIs and lifecycle management

**Storage Features:**
- Multi-region deployment support
- Geo-replication configuration
- Disaster recovery templates

> See [PLUGIN_ARCHITECTURE.md](docs/PLUGIN_ARCHITECTURE.md) for detailed plugin development roadmap.

## [3.0.0] - 2025-10-21

### Added

#### Security Features
- **Blob Public Access Control** - `allowBlobPublicAccess` parameter to prevent anonymous access
- **TLS Version Enforcement** - `minimumTlsVersion` parameter requiring TLS 1.2 minimum
- **HTTPS-Only Traffic** - `supportsHttpsTrafficOnly` parameter enforcing secure transport
- **Public Network Access Control** - `publicNetworkAccess` parameter for network restrictions
- **OAuth Default Authentication** - `defaultToOAuthAuthentication` parameter for Microsoft Entra ID
- **Shared Key Access Management** - `allowSharedKeyAccess` parameter to disable legacy auth
- **Infrastructure Encryption** - `requireInfrastructureEncryption` parameter for double encryption

#### Data Protection Features
- **Blob Soft Delete** - `blobSoftDeleteDays` parameter with 7-365 day retention
- **Container Soft Delete** - `containerSoftDeleteDays` parameter with 7-365 day retention
- **Blob Versioning** - `enableVersioning` parameter for automatic version tracking
- **Change Feed** - `changeFeedEnabled` parameter for ordered transaction logs
- **Last Access Time Tracking** - `lastAccessTimeTrackingEnabled` parameter for cost optimization

#### Documentation
- Comprehensive `SECURITY_FEATURES.md` guide with official Microsoft documentation links
- Complete `DATA_PROTECTION_GUIDE.md` with recovery scenarios and cost optimization
- `CONFIGURATION_GUIDE.md` for config file usage
- `PRODUCTION_FEATURES.md` summarizing all production-ready enhancements
- `DEVELOPMENT_LOG.md` tracking all development phases
- `TEMPLATE_VALIDATION_STANDARDS.md` documenting ARM template validation best practices
- `AZURE_LIVE_TESTING.md` comprehensive 7-phase testing methodology
- `PLUGIN_ARCHITECTURE.md` extensibility framework for custom templates and plugins

#### Extensibility
- **Plugin Interface Foundation** - Stable API contract for future extensions
- `IPlugin` interface and `BasePlugin` abstract class for custom plugins
- `TemplateRegistry` for managing template types and plugin registration
- `PluginConfig` support in `azmp-config.json` configuration
- Full implementation planned for v3.1.0 (interfaces are stable now)

#### Testing
- 14 new parameter validation tests
- All 92 tests passing (78 existing + 14 new)
- 100% parameter verification against official Microsoft documentation
- Complete Azure live testing (35/35 tests passed)

#### UI/UX Enhancements
- "Security Configuration" step in createUiDefinition.json
- "Data Protection" step in createUiDefinition.json
- Enhanced viewDefinition.json with security and data protection monitoring panels

### Changed

- Updated README.md with v3.0.0 features and capabilities
- Enhanced mainTemplate.json with 12 new parameters
- Improved nestedtemplates/storageAccount.json with security and data protection
- Updated generator.ts with security and data protection helper functions

### Fixed

- **CRITICAL**: Added missing `minLength` validation to `storageAccountNamePrefix` parameter (was only `maxLength: 11`, now `minLength: 3, maxLength: 11`)
- **CRITICAL**: Added missing `minLength` and `maxLength` validation to `applicationName` parameter (now `minLength: 3, maxLength: 24`)
- Ensured UI validation (createUiDefinition.json) matches ARM template validation for all string parameters
- Prevents users from bypassing UI constraints when deploying via CLI, API, or PowerShell

### Verified
- All parameters verified against `@azure/arm-storage` SDK (JavaScript/TypeScript)
- Validated against Azure Verified Modules (Bicep registry)
- Cross-referenced with Microsoft Learn documentation
- Confirmed with Azure.ResourceManager.Storage (.NET SDK)

### Security
- All security parameters default to secure values (e.g., TLS 1.2, HTTPS-only)
- Blob public access disabled by default
- Compliance mappings for GDPR, HIPAA, PCI-DSS, SOC 2

## [2.1.0] - 2025-10-20

### Added
- Production-ready features and enhancements
- ESLint and TypeScript fixes
- Security validation utilities
- ARM-TTK validation integration
- Enhanced error handling
- Comprehensive test coverage

### Changed
- Improved code quality and maintainability
- Enhanced CLI user experience
- Better error messages and validation

## [2.0.0] - 2025-10-19

### Added
- Initial CLI implementation
- Storage marketplace application generation
- ARM template validation
- Package creation for marketplace submission

### Changed
- Migrated from manual templates to automated generation
- TypeScript implementation with full type safety

## [1.0.0] - 2025-10-18

### Added
- Basic project structure
- Manual ARM template creation
- Initial documentation

---

## Release Guidelines

### Version Numbers
- **MAJOR** version (X.0.0): Breaking changes
- **MINOR** version (0.X.0): New features, backward compatible
- **PATCH** version (0.0.X): Bug fixes, backward compatible

### Release Process
1. Update CHANGELOG.md with changes
2. Run full test suite: `npm test`
3. Build project: `npm run build`
4. Update package.json version
5. Commit changes: `git commit -m "chore: release vX.X.X"`
6. Create git tag: `git tag -a vX.X.X -m "Release vX.X.X"`
7. Push changes: `git push origin develop && git push origin vX.X.X`
8. Create GitHub release with release notes

### Links
[Unreleased]: https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/compare/v3.0.0...HEAD
[3.0.0]: https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/compare/v2.1.0...v3.0.0
[2.1.0]: https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/releases/tag/v1.0.0
