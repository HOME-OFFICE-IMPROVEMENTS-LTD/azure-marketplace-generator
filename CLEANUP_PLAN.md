# Repository Cleanup Plan

## Security Audit ✅ COMPLETED

- **Status**: No security issues found

- **Environment files**: All properly use environment variables, no hardcoded secrets

- **Key findings**:

  - `.env.example` contains only example values

  - All API keys properly referenced via `process.env`

  - Configuration files use secure patterns

## Files to Organize

### Root Directory Cleanup

```

Current root files (need organization):
├── ai-analytics-config.json          → docs/config/
├── ai-analytics-report-2025-10-11.json → docs/reports/
├── azure-keyvault-setup.sh          → scripts/
├── CLI_TEST_REPORT.md               → docs/reports/
├── deploy-secure-storage.sh         → scripts/
├── mcp-ecosystem-cli.ts             → src/tools/
├── monitoring-config.json           → config/
├── monitoring-dashboard.html        → docs/dashboards/
├── portfolio-status.json            → docs/reports/
├── streaming-demo.ts                → examples/
├── STREAMING_IMPLEMENTATION.md      → docs/
├── TEST_HARNESS.md                  → docs/testing/
├── test-mcp-ecosystem.sh           → scripts/
├── TEST_STATUS.md                   → docs/testing/

```

### Temporary Directories to Clean

```

├── temp-cli-test/         → Archive generated templates, then remove
├── temp-test/            → Review contents, likely remove
├── logs/                 → Archive recent logs, remove old ones

```

### Empty Directories to Remove

```

├── test-fixtures/monitoring/
├── test-fixtures/ai-analytics/
├── packages/generated/
├── templates/storage/nestedtemplates/

```

## Commit Strategy

1. **Security cleanup commit** - Remove any security issues (if found)

2. **File organization commit** - Move files to proper directories

3. **Cleanup commit** - Remove temporary files and empty directories

4. **Documentation commit** - Update documentation for new structure

5. **Final validation commit** - Run tests and ensure everything works

## Target Structure

```

🚀 Azure Marketplace Generator/
├── 📁 config/              # Environment configurations

├── 📁 docs/                # All documentation

│   ├── 📁 config/         # Configuration examples

│   ├── 📁 dashboards/     # Monitoring dashboards

│   ├── 📁 reports/        # Analysis and test reports

│   └── 📁 testing/        # Testing documentation

├── 📁 examples/           # Demo and example files

├── 📁 scripts/            # Shell scripts and utilities

├── 📁 src/                # Source code

│   └── 📁 tools/         # CLI tools and utilities

├── 📁 packages/           # MCP packages

├── 📁 templates/          # ARM templates

└── 📁 tests/             # Test files

```
