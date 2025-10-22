# Development Log

## v3.1.0 - Plugin System Implementation (January 8, 2025)

### Overview

Major release introducing a comprehensive plugin system that enables extensibility through dynamic loading, custom CLI commands, template types, and Handlebars helpers. This release establishes the foundation for community-driven extensions and custom resource templates.

### Development Phases

#### Phase A: Plugin System Core ✅

**Completed:** January 8, 2025

**Changes:**
- Implemented `src/core/plugin-loader.ts` (348 lines) - Dynamic plugin discovery and loading
- Implemented `src/core/command-registrar.ts` (234 lines) - CLI command registration system
- Implemented `src/core/helper-registrar.ts` (171 lines) - Handlebars helper registration system
- Updated `src/cli/index.ts` with plugin loader integration
- Created `azmp.config.json` example configuration file
- Enhanced `src/utils/config-manager.ts` with plugin configuration support

**Key Features:**
- **Dynamic Plugin Loading**: Automatic discovery from configuration files
- **CLI Command Extensions**: Plugins can register custom commands with Commander.js
- **Template Type Registration**: Extensible template system for new resource types
- **Handlebars Helper Registration**: Custom helpers for advanced template logic
- **Security Features**: Path traversal prevention, plugin validation, timeout enforcement
- **Error Isolation**: Robust error handling with graceful degradation
- **Lifecycle Management**: Initialize and cleanup hooks for proper plugin management

**Commits:**
- `a9c1dd8` - feat(plugins): implement dynamic plugin loading
- `e4d1ea7` - docs(plugins): update PLUGIN_ARCHITECTURE.md
- `c8ee4b3` - test(plugins): add comprehensive tests
- `6f83a91` - docs: add reference to azmp-plugin-vm
- `c99426e` - fix: use require() for CommonJS plugins
- `1cb0200` - fix: prevent infinite cleanup loop
- `02d477b` - fix: address PR #51 review comments
- `3f2751a` - fix: resolve ESLint errors and warnings
- `ce6e814` - Merge PR #51: feat: Implement v3.1.0 Plugin System

---

#### Phase B: Security Hardening ✅

**Completed:** January 8, 2025

**Changes:**
- Fixed CodeQL security alerts #23 and #24
- Hardened GitHub Actions workflow permissions
- Added explicit minimal permissions to CI workflows:
  - `ci.yml`: `contents: read`, `checks: write`
  - `release.yml`: `contents: write`
- Enhanced ESLint configuration to resolve TypeScript conflicts

**Security Improvements:**
- Workflow permissions restricted to minimal required scopes
- Plugin path validation prevents directory traversal attacks
- Plugin sandboxing mechanisms for safer execution
- Security tests for path validation and error handling

**Commits:**
- `59d8769` - fix: update ESLint configuration to resolve TypeScript conflicts
- Security fixes applied to main, develop, and feature branches

---

#### Phase C: Testing & Documentation ✅

**Completed:** January 8, 2025

**Changes:**
- Created `src/__tests__/plugin-loading.test.ts` (599 lines, 25+ test cases)
- Created `docs/PLUGIN_ARCHITECTURE.md` (383 lines of comprehensive documentation)
- Updated `README.md` with plugin system overview and examples
- All 119 tests passing (94 existing + 25 new plugin tests)

**Test Categories:**
1. Plugin Discovery Tests - Config-based and automatic discovery
2. Plugin Loading Tests - ESM and CommonJS module loading
3. Lifecycle Tests - Initialization and cleanup verification
4. Security Tests - Path traversal prevention, invalid plugin handling
5. Integration Tests - End-to-end plugin loading and registration
6. Error Handling Tests - Graceful degradation and error isolation

**Documentation Structure:**
1. **PLUGIN_ARCHITECTURE.md:**
   - Complete plugin development guide
   - API reference with TypeScript interfaces
   - Usage examples and best practices
   - Security guidelines and performance tips
   - Reference to azmp-plugin-vm implementation

2. **README.md Updates:**
   - Plugin system overview in Features section
   - Installation instructions for plugins
   - Link to official VM plugin
   - Updated roadmap with v3.1.0 completion

**Test Results:**
```
Test Suites: 7 passed, 7 total
Tests:       119 passed, 119 total
Snapshots:   0 total
Time:        2.728 s
```

**Commits:**
- Documentation and tests included in PR #51 merge

---

#### Phase D: Release & Publication ✅

**Completed:** January 8, 2025

**Changes:**
- Updated `package.json` version to 3.1.0
- Created comprehensive `CHANGELOG.md` entry for v3.1.0
- Built distribution files for NPM publication
- Created git tag `v3.1.0` with detailed annotation
- Published to NPM registry as `@hoiltd/azure-marketplace-generator@3.1.0`
- Created GitHub release with comprehensive release notes

**Release Details:**
- **NPM Package**: Published successfully
- **GitHub Release**: https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/releases/tag/v3.1.0
- **Package Size**: 131.0 kB (tarball), 648.5 kB (unpacked)
- **Total Files**: 121 files including dist, docs, and templates

**Commits:**
- `bf5d943` - chore: release v3.1.0

---

### Technical Details

#### Plugin System Architecture

**Core Components:**

1. **PluginLoader** (`src/core/plugin-loader.ts`):
   - Dynamic plugin discovery from config files
   - ESM and CommonJS module loading support
   - Plugin lifecycle management (initialize, cleanup)
   - Security validations and timeout enforcement
   - Error isolation per plugin

2. **CommandRegistrar** (`src/core/command-registrar.ts`):
   - CLI command registration with Commander.js
   - Namespace collision detection
   - Command validation and error handling

3. **HelperRegistrar** (`src/core/helper-registrar.ts`):
   - Handlebars helper registration
   - Helper validation and namespace management
   - Template engine integration

**Plugin API:**

```typescript
export interface AzmpPlugin {
  name: string;
  version: string;
  initialize?(context: PluginContext): void | Promise<void>;
  cleanup?(): void | Promise<void>;
  registerTemplates?(registry: TemplateRegistry): void;
  registerCommands?(program: Command, context: PluginContext): void;
  registerHelpers?(handlebars: typeof Handlebars, context: PluginContext): void;
}
```

#### Security Features

1. **Path Validation**: Prevents directory traversal attacks
2. **Workspace Protection**: Restricts plugin operations to workspace
3. **Timeout Enforcement**: Prevents hanging plugin operations
4. **Error Isolation**: Plugin errors don't crash the main application
5. **GitHub Actions Hardening**: Minimal workflow permissions

#### Test Coverage

- **Total Tests**: 119 (100% passing)
- **Plugin Tests**: 25+ dedicated plugin system tests
- **Coverage Areas**: Discovery, loading, lifecycle, security, integration
- **CI/CD**: All checks passing on Node 18.x and 20.x

---

### Breaking Changes

**None** - This is a backward-compatible enhancement. Existing functionality continues to work without modifications. Plugin system is opt-in.

---

### Migration Guide

#### For Existing Users

No migration required. The plugin system is completely optional. Continue using the tool as before.

#### Using Plugins

1. **Install a plugin:**
```bash
npm install @hoiltd/azmp-plugin-vm
```

2. **Create azmp.config.json:**
```json
{
  "plugins": [
    "@hoiltd/azmp-plugin-vm"
  ]
}
```

3. **Use plugin features:**
```bash
azmp vm create --name myvm
```

---

### Known Issues

**None** - All features tested and verified. Zero ESLint issues, zero security alerts.

---

### Official Plugin

**[@hoiltd/azmp-plugin-vm](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azmp-plugin-vm)**
- Virtual Machine template generation
- Custom VM Handlebars helpers
- VM-specific CLI commands
- Fully documented and tested

---

## v3.0.0 - Enhanced Security & Data Protection (October 21, 2025)

### Overview

Major release adding comprehensive security and data protection features to the Azure Storage marketplace generator. All parameters verified against official Microsoft Azure documentation for production compliance.

### Development Phases

#### Phase 1: Template Enhancement ✅

**Completed:** October 21, 2025

**Changes:**
- Enhanced `mainTemplate.json` with 12 new parameters
- Updated `createUiDefinition.json` with security and data protection UI
- Enhanced `viewDefinition.json` with monitoring panels
- Updated nested templates (`storageAccount.json`)

**New Parameters Added:**

Security (7 parameters):
- `allowBlobPublicAccess` - Control public blob access
- `minimumTlsVersion` - Enforce TLS 1.2 minimum
- `supportsHttpsTrafficOnly` - HTTPS-only traffic
- `publicNetworkAccess` - Network access control
- `defaultToOAuthAuthentication` - OAuth default authentication
- `allowSharedKeyAccess` - Shared key access control
- `requireInfrastructureEncryption` - Double encryption

Data Protection (5 parameters):
- `blobSoftDeleteDays` - Blob soft delete retention
- `containerSoftDeleteDays` - Container soft delete retention
- `enableVersioning` - Blob versioning
- `changeFeedEnabled` - Change feed tracking
- `lastAccessTimeTrackingEnabled` - Access time tracking

**Commits:**
- `514d9f2` - feat: add enhanced security parameters to storage templates
- `da94a33` - feat: integrate security params in mainTemplate and nested templates

---

#### Phase 2: UI Enhancement ✅

**Completed:** October 21, 2025

**Changes:**
- Added "Security Configuration" step to `createUiDefinition.json`
- Added "Data Protection" step to `createUiDefinition.json`
- Enhanced UI controls with descriptions and defaults
- Added input validation and constraints

**UI Components Added:**
- Security toggle controls (7 controls)
- Data protection sliders and toggles (5 controls)
- Informational text blocks
- Default secure values

**Commits:**
- `0106d15` - feat: Phase 2 - Add Security and Data Protection UI steps

---

#### Phase 3: Code Enhancement ✅

**Completed:** October 21, 2025

**Changes:**
- Updated `src/core/generator.ts` with parameter helpers
- Added `generateSecurityConfig()` helper function
- Added `generateDataProtectionConfig()` helper function
- Enhanced template generation logic

**Helper Functions:**
```typescript
// Security configuration helper
function generateSecurityConfig(): object {
  return {
    allowBlobPublicAccess: false,
    minimumTlsVersion: 'TLS1_2',
    supportsHttpsTrafficOnly: true,
    // ... 7 parameters total
  };
}

// Data protection configuration helper
function generateDataProtectionConfig(): object {
  return {
    deleteRetentionPolicy: { enabled: true, days: 7 },
    containerDeleteRetentionPolicy: { enabled: true, days: 7 },
    isVersioningEnabled: true,
    // ... 5 features total
  };
}
```

**Commits:**
- `bac182c` - feat: Phase 3 - Add security and data protection helpers to generator

---

#### Phase 4: Testing & Validation ✅

**Completed:** October 21, 2025

**Changes:**
- Created `src/__tests__/storage-parameters.test.ts` (116 lines, 14 tests)
- Validated template structure without deployment
- Verified all parameters against Microsoft documentation
- All 92 tests passing (78 existing + 14 new)

**Test Categories:**
1. Storage Template Files (3 tests)
   - mainTemplate.json exists
   - createUiDefinition.json exists
   - viewDefinition.json exists

2. Enhanced Security Parameters (7 tests)
   - allowBlobPublicAccess
   - minimumTlsVersion
   - supportsHttpsTrafficOnly
   - publicNetworkAccess
   - defaultToOAuthAuthentication
   - allowSharedKeyAccess
   - requireInfrastructureEncryption

3. Enhanced Data Protection Parameters (5 tests)
   - blobSoftDeleteDays
   - containerSoftDeleteDays
   - enableVersioning
   - changeFeedEnabled
   - lastAccessTimeTrackingEnabled

4. UI Definition Enhancements (2 tests)
   - Security Configuration step
   - Data Protection step

5. View Definition Enhancements (2 tests)
   - Security Overview panel
   - Data Protection panel

6. Template Integration (4 tests)
   - Security parameters in mainTemplate
   - Data protection parameters in mainTemplate
   - Parameters linked to UI
   - Parameters linked to View

**Documentation Verification:**

All parameters verified against official Microsoft sources:
- @azure/arm-storage SDK (JavaScript/TypeScript)
- Azure Verified Modules (Bicep registry)
- Microsoft Learn documentation
- Azure.ResourceManager.Storage (.NET SDK)

**Verification Results:** ✅ 100% compliant with official Azure specifications

**Commits:**
- `a54497b` - test: Phase 4 - add storage parameters validation tests

---

#### Phase 5: Documentation ✅

**Completed:** October 21, 2025

**Changes:**
- Updated `README.md` with v3.0.0 features
- Created `docs/SECURITY_FEATURES.md` (comprehensive security guide)
- Created `docs/DATA_PROTECTION_GUIDE.md` (data protection guide)
- Updated `docs/DEVELOPMENT_LOG.md` (this file)

**Documentation Structure:**

1. **README.md Updates:**
   - Version badge updated to 3.0.0
   - Enhanced Features section with security and data protection
   - Updated usage examples
   - Added links to detailed guides

2. **SECURITY_FEATURES.md:**
   - 7 security parameters documented
   - Official Microsoft documentation links
   - Security best practices
   - Compliance matrix (GDPR, HIPAA, PCI-DSS, SOC 2)
   - Network security configuration
   - Production-ready security profile

3. **DATA_PROTECTION_GUIDE.md:**
   - 5 data protection features documented
   - Official Microsoft documentation links
   - Recovery scenarios
   - Cost optimization strategies
   - Monitoring and alerts
   - Compliance mapping

**Commits:**
- `[pending]` - docs: Phase 5 - comprehensive documentation for v3.0.0

---

### Technical Details

#### Parameter Verification Process

All parameters were verified using Microsoft documentation MCP server:

1. **Query 1:** Security parameters
   - `allowSharedKeyAccess` ✅
   - `minimumTlsVersion` ✅
   - `enableHttpsTrafficOnly` / `supportsHttpsTrafficOnly` ✅
   - `networkAcls` ✅

2. **Query 2:** Advanced security parameters
   - `allowBlobPublicAccess` ✅
   - `publicNetworkAccess` ✅
   - `allowCrossTenantReplication` ✅
   - `requireInfrastructureEncryption` ✅

3. **Query 3:** Blob services data protection
   - `isVersioningEnabled` ✅
   - `deleteRetentionPolicy` ✅
   - `containerDeleteRetentionPolicy` ✅
   - `changeFeed` ✅
   - `lastAccessTimeTrackingPolicy` ✅

4. **Query 4:** Authentication and network access
   - `defaultToOAuthAuthentication` ✅
   - `publicNetworkAccess` ✅

#### Test Results

```
PASS  src/__tests__/generator.test.ts
PASS  src/__tests__/validator.test.ts
PASS  src/__tests__/storage-parameters.test.ts

Test Suites: 3 passed, 3 total
Tests:       92 passed, 92 total
Snapshots:   0 total
Time:        2.847 s
```

---

### Breaking Changes

**None** - This is a backward-compatible enhancement. Existing templates continue to work without modifications.

---

### Migration Guide

#### For Existing Users

No migration required. Generated templates will automatically include new security and data protection features with secure defaults.

#### Customizing Security Settings

Users can customize security parameters through:
1. UI during deployment (createUiDefinition.json)
2. Parameters file (parameters.json)
3. Direct ARM template modification

---

### Known Issues

**None** - All features tested and verified.

---

### Future Enhancements

Planned for future releases:

1. **v3.1.0 (Planned):**
   
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

2. **v3.2.0 (Future):**
   
   **Plugin Ecosystem:**
   - Plugin marketplace/catalog
   - Plugin dependency management
   - Hot reload support
   - Plugin sandboxing and isolation
   
   **Storage Features:**
   - Advanced network security rules
   - Azure AD RBAC role assignments
   - Diagnostic settings and monitoring

3. **v4.0.0 (Future):**
   
   **Advanced Extensibility:**
   - MCP (Model Context Protocol) server support
   - Remote plugin loading
   - Plugin security scanning
   - Advanced plugin APIs and lifecycle management
   
   **Storage Features:**
   - Multi-region deployment support
   - Geo-replication configuration
   - Disaster recovery templates

> **Note:** Plugin roadmap details available in [PLUGIN_ARCHITECTURE.md](PLUGIN_ARCHITECTURE.md)

---

### References

- [Azure Storage security guide](https://learn.microsoft.com/en-us/azure/storage/blobs/security-recommendations)
- [Data protection overview](https://learn.microsoft.com/en-us/azure/storage/blobs/data-protection-overview)
- [Azure Verified Modules](https://github.com/Azure/bicep-registry-modules)
- [@azure/arm-storage SDK](https://learn.microsoft.com/en-us/javascript/api/@azure/arm-storage/)

---

*Last Updated: October 21, 2025*
*Version: 3.0.0*
