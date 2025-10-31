# Plugin Compatibility Matrix

**Last Updated:** October 31, 2025

This document tracks compatibility between the Azure Marketplace Generator core and its plugins.

## Version Compatibility Table

| Generator Version | VM Plugin Versions | Status | Notes |
|-------------------|-------------------|---------|-------|
| **3.1.0** | 2.1.0, 2.0.0 | ✅ Supported | Current production release |
| 3.0.0 | 2.0.0, 1.9.x | ⚠️ Legacy | Security fixes only |
| 2.x.x | 1.x.x | ❌ EOL | Not supported |

## Compatibility Rules

### Major Version Changes
- **Generator major bump (4.0.0):** May require plugin updates
- **Plugin major bump (3.0.0):** Must specify required generator version

### Minor Version Changes
- **Generator minor bump (3.2.0):** Should maintain plugin compatibility
- **Plugin minor bump (2.2.0):** Should work with current generator minor

### Patch Version Changes
- **Always backward compatible** within the same major.minor

## Breaking Changes History

### Generator 3.1.0 → 4.0.0 (Planned Q1 2026)
**Breaking Changes:**
- Plugin API changes (semver validation required)
- Template registry refactoring
- New helper signature requirements

**Required Plugin Updates:**
- Update to plugin API v4
- Implement semver validation
- Test with new template registry

**Minimum Plugin Version:** VM Plugin 3.0.0

### Plugin 2.1.0 → 3.0.0 (Planned Q2 2026)
**Breaking Changes:**
- VHD validation API changes
- New template structure for HA clusters
- Helper namespace changes

**Required Generator Version:** Generator 3.1.0+

**Migration Guide:** See [MIGRATION_2.x_to_3.x.md](./MIGRATION_2.x_to_3.x.md)

## Testing Requirements

Before releasing any version, run the three-layer test strategy:

### Layer 1: Generator Alone (No Plugins)
```bash
cd azure-marketplace-generator
npm test                          # All 119 tests
npm run build
azmp create storage test-app      # Verify core functionality
azmp validate test-app
azmp package test-app
```

### Layer 2: Plugin Alone (With Stable Generator)
```bash
cd azmp-plugin-vm
npm test                          # All 872 tests
npm run build
npm link
cd ../test-workspace
npm link @hoiltd/azmp-plugin-vm
azmp vm template generate -c minimal.json
```

### Layer 3: Combined End-to-End
```bash
# Install local builds
cd azure-marketplace-generator
npm link
cd ../azmp-plugin-vm
npm link
npm link @hoiltd/azure-marketplace-generator

# Test integration
cd ../test-workspace
npm link @hoiltd/azure-marketplace-generator
azmp plugin install @hoiltd/azmp-plugin-vm@local
azmp vm template generate -c minimal.json
azmp vm template generate -c enterprise.json
azmp validate output/
azmp package output/

# Verify outputs
jq . output/mainTemplate.json
jq . output/createUiDefinition.json
jq . output/viewDefinition.json
```

**All three layers must pass before tagging any release.**

## Plugin Installation Workflow

### Standard Installation
```bash
# Install generator first
npm install -g @hoiltd/azure-marketplace-generator@3.1.0

# Install compatible plugin
azmp plugin install @hoiltd/azmp-plugin-vm@2.1.0

# Verify installation
azmp plugin list
azmp vm --version
```

### Installation with Version Pinning
```bash
# Pin specific versions for production
azmp plugin install @hoiltd/azmp-plugin-vm@2.1.0

# Verify compatibility
azmp --version    # Should show 3.1.0
azmp plugin list  # Should show vm@2.1.0
```

### Upgrading Plugins
```bash
# Check current versions
azmp --version
azmp plugin list

# Update plugin (maintains generator version)
azmp plugin update @hoiltd/azmp-plugin-vm

# Verify compatibility after update
azmp vm template generate -c test.json
```

### Breaking Change Migration
When upgrading across major versions:

1. **Read release notes** for breaking changes
2. **Update configuration** if schema changed
3. **Test in staging** before production
4. **Update CI/CD** to use new versions

Example breaking change workflow:
```bash
# Before: Generator 3.1.0 + Plugin 2.1.0
azmp --version  # 3.1.0
azmp plugin list  # vm@2.1.0

# Upgrade generator (breaking: 4.0.0)
npm install -g @hoiltd/azure-marketplace-generator@4.0.0

# Plugin 2.1.0 incompatible - must upgrade
azmp plugin install @hoiltd/azmp-plugin-vm@3.0.0

# Test thoroughly
azmp vm template generate -c existing-config.json
# May require config updates for new schema
```

## CI/CD Compatibility Checks

### Generator CI (Automated)
```yaml
# .github/workflows/ci.yml
compatibility-check:
  runs-on: ubuntu-latest
  strategy:
    matrix:
      plugin-version: ['2.1.0', '2.0.0']
  steps:
    - name: Test with VM Plugin ${{ matrix.plugin-version }}
      run: |
        npm link
        npm install -g @hoiltd/azmp-plugin-vm@${{ matrix.plugin-version }}
        azmp plugin install @hoiltd/azmp-plugin-vm
        npm run test:integration
```

### Plugin CI (Automated)
```yaml
# .github/workflows/ci.yml
compatibility-check:
  runs-on: ubuntu-latest
  strategy:
    matrix:
      generator-version: ['3.1.0', '3.0.0']
  steps:
    - name: Test with Generator ${{ matrix.generator-version }}
      run: |
        npm install -g @hoiltd/azure-marketplace-generator@${{ matrix.generator-version }}
        npm link
        npm run test:integration
```

## Release Coordination

### Generator Release Triggers Plugin Check
When generator releases, automatically verify latest plugin:

1. **Generator tagged** (e.g., v3.2.0)
2. **CI automatically runs** compatibility test against latest plugin (v2.1.0)
3. **If pass:** ✅ Publish to npm, update compatibility matrix
4. **If fail:** ❌ Hold publication, create compatibility issue, notify plugin maintainers

### Plugin Release Requires Manual Verification
When plugin is ready to release:

1. **Run three-layer tests** (generator-only, plugin-only, combined)
2. **Update compatibility matrix** in both repos
3. **Write release notes** with generator version requirements
4. **Tag and publish** manually after approval
5. **Update documentation** with migration guide if breaking

## Peer Dependency Management

### Generator package.json
```json
{
  "peerDependencies": {
    "@hoiltd/azmp-plugin-vm": "^2.0.0"
  },
  "peerDependenciesMeta": {
    "@hoiltd/azmp-plugin-vm": {
      "optional": true
    }
  }
}
```

### Plugin package.json
```json
{
  "peerDependencies": {
    "@hoiltd/azure-marketplace-generator": "^3.1.0"
  },
  "engines": {
    "azmp": ">=3.1.0 <4.0.0"
  }
}
```

## Version Support Policy

### Active Support
- **Current major version:** Full support (bug fixes, features, security)
- **Previous major version:** Security fixes only for 6 months after new major
- **Older versions:** Community support only

### End of Life
Versions reach EOL 6 months after next major release:
- Generator 3.x.x: EOL 6 months after 4.0.0 release
- Plugin 2.x.x: EOL 6 months after 3.0.0 release

## Troubleshooting Compatibility Issues

### "Plugin not compatible with generator"
```bash
# Check versions
azmp --version              # e.g., 4.0.0
azmp plugin list            # e.g., vm@2.1.0

# Solution: Upgrade plugin to compatible version
azmp plugin install @hoiltd/azmp-plugin-vm@3.0.0
```

### "Generator too old for plugin"
```bash
# Check versions
azmp --version              # e.g., 3.0.0
azmp plugin list            # e.g., vm@2.1.0

# Solution: Upgrade generator
npm install -g @hoiltd/azure-marketplace-generator@latest
```

### "Breaking changes in new version"
1. Read [CHANGELOG.md](../CHANGELOG.md) for migration steps
2. Review [Breaking Changes](#breaking-changes-history) above
3. Test in isolated environment first
4. Update configuration files as needed
5. Report issues on GitHub if problems persist

## Contact & Support

- **Compatibility Issues:** [Open an issue](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/issues)
- **Breaking Change Questions:** See [FAQ.md](../wiki-content/FAQ.md)
- **Version Support:** Check [Release Status](./RELEASE_STATUS.md)

---

**Maintainers:** Update this document whenever:
- New major/minor version released
- Breaking changes introduced
- Support policy changes
- Compatibility issues discovered
