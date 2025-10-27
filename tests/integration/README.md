# Integration Tests

End-to-end integration tests for Azure Marketplace Generator and plugins.

## Plugin Integration Test

**File:** `plugin-integration.test.sh`

Tests the integration between the generator and VM plugin packages from npm registry.

### What it Tests

1. **Package Installation** - Verifies both packages install correctly from npm
2. **Configuration** - Tests plugin configuration system
3. **Plugin Direct Load** - Tests instantiating and using plugin directly
4. **Programmatic Integration** - Tests generator's plugin loader
5. **Command Registration** - Tests plugin extending CLI with custom commands

### Running the Test

```bash
# Run from generator root
./tests/integration/plugin-integration.test.sh
```

### Test Environment

The script creates a clean test workspace in `/tmp/integration-test-generator`:
- Installs generator and VM plugin from npm
- Creates config file
- Runs comprehensive tests
- Reports results

### Expected Output

```
╔═══════════════════════════════════════════════════════════╗
║   Integration Test: Generator + VM Plugin v1.8.1         ║
╚═══════════════════════════════════════════════════════════╝

Phase 1: Package Installation           ✓
Phase 2: Configuration                   ✓
Phase 3: Plugin Direct Load              ✓
Phase 4: Programmatic Integration        ✓
Phase 5: Command Registration Test       ✓

Passed: 6 / 6
Failed: 0 / 6

✅ ALL INTEGRATION TESTS PASSED
```

### Prerequisites

- Node.js v18+
- npm access to @hoiltd organization packages
- Bash shell

### CI Integration

This test runs in CI on:
- Pull requests to `develop` or `main`
- Weekly scheduled runs
- Manual workflow dispatch

See `.github/workflows/integration.yml` for configuration.

### Troubleshooting

**Package not found:**
- Ensure logged in to npm: `npm login`
- Check organization access

**Import errors:**
- Plugin uses named export: `const { VmPlugin } = require('@hoiltd/azmp-plugin-vm')`
- Or default: `const VmPlugin = require('@hoiltd/azmp-plugin-vm').default`

**Command not registered:**
- Check plugin enabled in config
- Verify generator loads config from correct directory
- Check CLI initialization order

### Test Results Archive

Integration test results are stored in:
- Local: `/tmp/integration-test-generator/`
- CI: Workflow artifacts (integration-test-results)
- Report: `INTEGRATION_VALIDATION_REPORT.md`

### Related Documentation

- [Production Readiness Analysis](/tmp/production_readiness_analysis.md)
- [VM Plugin README](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azmp-plugin-vm/blob/main/README.md)
- [Plugin Development Guide](../../docs/PLUGIN_DEVELOPMENT.md)
