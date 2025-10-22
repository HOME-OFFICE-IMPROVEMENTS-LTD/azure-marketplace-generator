# Configuration Guide

Complete guide to configuring Azure Marketplace Generator for your projects.

## Overview

Azure Marketplace Generator can be configured through:

1. **Configuration file** (`azmp.config.json`)
2. **Command-line options**
3. **Environment variables**

Configuration precedence (highest to lowest):
1. Command-line options (highest priority)
2. Environment variables
3. Configuration file
4. Built-in defaults (lowest priority)

## Configuration File

### Location

Place `azmp.config.json` in:

- **Project root** - Project-specific configuration
- **User home** (`~/.azmp/config.json`) - Global user defaults
- **Custom location** - Use `--config <path>` option

### Basic Structure

```json
{
  "version": "1.0.0",
  "publisher": "My Company",
  "outputDir": "./output",
  "plugins": [],
  "templateDefaults": {},
  "validation": {},
  "packaging": {}
}
```

## Complete Schema Reference

### Root Properties

#### version

Configuration schema version.

```json
{
  "version": "1.0.0"
}
```

- **Type:** `string`
- **Default:** `"1.0.0"`
- **Required:** No

#### publisher

Default publisher name for generated applications.

```json
{
  "publisher": "Acme Corporation"
}
```

- **Type:** `string`
- **Default:** None
- **Required:** No (can be provided via CLI)

#### outputDir

Directory where generated templates are written.

```json
{
  "outputDir": "./templates"
}
```

- **Type:** `string`
- **Default:** `"./output"`
- **Required:** No

#### plugins

Array of plugin package names to load.

```json
{
  "plugins": [
    "@hoiltd/azmp-plugin-vm",
    "@mycompany/azmp-plugin-sql"
  ]
}
```

- **Type:** `string[]`
- **Default:** `[]`
- **Required:** No

#### templateDefaults

Default values for template parameters.

```json
{
  "templateDefaults": {
    "location": "eastus",
    "sku": "Standard_LRS",
    "apiVersion": "2023-01-01"
  }
}
```

- **Type:** `object`
- **Default:** `{}`
- **Required:** No

#### validation

ARM-TTK validation settings.

```json
{
  "validation": {
    "enabled": true,
    "skipTests": [
      "outputs-must-not-contain-secrets"
    ],
    "onlyTests": [],
    "strictMode": false,
    "continueOnError": false
  }
}
```

- **Type:** `object`
- **Default:** `{ "enabled": true }`
- **Required:** No

**Validation Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable validation |
| `skipTests` | string[] | `[]` | Tests to skip |
| `onlyTests` | string[] | `[]` | Only run these tests |
| `strictMode` | boolean | `false` | Fail on warnings |
| `continueOnError` | boolean | `false` | Continue if validation fails |

#### packaging

Package creation settings.

```json
{
  "packaging": {
    "validateBeforePackage": true,
    "compression": "maximum",
    "includeReadme": true,
    "outputName": "app.zip",
    "excludePatterns": [
      "**/*.test.json",
      "**/node_modules/**"
    ]
  }
}
```

- **Type:** `object`
- **Default:** `{ "validateBeforePackage": true }`
- **Required:** No

**Packaging Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `validateBeforePackage` | boolean | `true` | Validate before packaging |
| `compression` | string | `"normal"` | Compression level: `"none"`, `"normal"`, `"maximum"` |
| `includeReadme` | boolean | `false` | Include README.md in package |
| `outputName` | string | `"app.zip"` | Output filename |
| `excludePatterns` | string[] | `[]` | Glob patterns to exclude |

## Configuration Examples

### Minimal Configuration

```json
{
  "publisher": "My Company"
}
```

### Development Configuration

```json
{
  "version": "1.0.0",
  "publisher": "Dev Team",
  "outputDir": "./dev-output",
  "templateDefaults": {
    "location": "westus",
    "sku": "Standard_LRS"
  },
  "validation": {
    "enabled": true,
    "skipTests": [
      "outputs-must-not-contain-secrets"
    ],
    "continueOnError": true
  },
  "packaging": {
    "validateBeforePackage": false,
    "compression": "none",
    "includeReadme": true
  }
}
```

### Production Configuration

```json
{
  "version": "1.0.0",
  "publisher": "Acme Corporation",
  "outputDir": "./production-templates",
  "plugins": [
    "@hoiltd/azmp-plugin-vm"
  ],
  "templateDefaults": {
    "location": "eastus",
    "sku": "Premium_LRS",
    "apiVersion": "2023-01-01"
  },
  "validation": {
    "enabled": true,
    "skipTests": [],
    "strictMode": true,
    "continueOnError": false
  },
  "packaging": {
    "validateBeforePackage": true,
    "compression": "maximum",
    "includeReadme": true,
    "outputName": "marketplace-app-v1.0.0.zip",
    "excludePatterns": [
      "**/*.test.json",
      "**/*.dev.*"
    ]
  }
}
```

### Multi-Plugin Configuration

```json
{
  "version": "1.0.0",
  "publisher": "Enterprise Solutions Inc",
  "outputDir": "./templates",
  "plugins": [
    "@hoiltd/azmp-plugin-vm",
    "@mycompany/azmp-plugin-sql",
    "@mycompany/azmp-plugin-cosmosdb"
  ],
  "templateDefaults": {
    "location": "eastus2",
    "tags": {
      "Environment": "Production",
      "ManagedBy": "Azure Marketplace Generator"
    }
  }
}
```

### Team Shared Configuration

```json
{
  "version": "1.0.0",
  "publisher": "Team Project",
  "outputDir": "./shared-templates",
  "templateDefaults": {
    "location": "westeurope",
    "resourceGroup": "rg-marketplace-apps",
    "tags": {
      "Team": "Platform Engineering",
      "Project": "Marketplace Apps"
    }
  },
  "validation": {
    "enabled": true,
    "skipTests": [
      "outputs-must-not-contain-secrets",
      "secure-params-in-nested-deployments"
    ]
  }
}
```

## Environment Variables

Override configuration with environment variables:

### General Variables

```bash
# Publisher name
export AZMP_PUBLISHER="My Company"

# Output directory
export AZMP_OUTPUT_DIR="./templates"

# Config file location
export AZMP_CONFIG="./custom-config.json"

# Verbose logging
export AZMP_VERBOSE=1

# Disable colors in output
export AZMP_NO_COLOR=1
```

### Template Variables

```bash
# Default location
export AZMP_LOCATION="eastus"

# Default SKU
export AZMP_SKU="Standard_LRS"

# Default API version
export AZMP_API_VERSION="2023-01-01"
```

### Validation Variables

```bash
# Skip validation
export AZMP_SKIP_VALIDATION=1

# Skip specific tests (comma-separated)
export AZMP_SKIP_TESTS="outputs-must-not-contain-secrets,secure-params"

# Strict mode
export AZMP_STRICT_MODE=1
```

### Packaging Variables

```bash
# Compression level
export AZMP_COMPRESSION="maximum"

# Output filename
export AZMP_PACKAGE_NAME="my-app.zip"

# Skip pre-package validation
export AZMP_SKIP_PACKAGE_VALIDATION=1
```

### Example: Complete Environment Setup

```bash
#!/bin/bash
# .env.development

# General
export AZMP_PUBLISHER="DevTeam"
export AZMP_OUTPUT_DIR="./dev-output"
export AZMP_VERBOSE=1

# Templates
export AZMP_LOCATION="westus"
export AZMP_SKU="Standard_LRS"

# Validation
export AZMP_SKIP_TESTS="outputs-must-not-contain-secrets"

# Packaging
export AZMP_COMPRESSION="none"
export AZMP_SKIP_PACKAGE_VALIDATION=1
```

Usage:

```bash
source .env.development
azmp create storage --name "MyApp"
```

## Command-Line Options

Command-line options override both config file and environment variables.

### Global Options

```bash
# Verbose logging
azmp create storage --name "Test" --verbose

# Custom config file
azmp create storage --name "Test" --config ./custom.json

# Custom output directory
azmp create storage --name "Test" --output ./my-templates

# Disable colors
azmp create storage --name "Test" --no-color
```

### Create Options

```bash
azmp create storage \
  --name "MyApp" \
  --publisher "My Company" \
  --description "My storage application" \
  --output ./templates \
  --location "eastus" \
  --sku "Premium_LRS"
```

### Validate Options

```bash
# Skip specific tests
azmp validate ./output --skip-tests "outputs-must-not-contain-secrets,secure-params"

# Run only specific tests
azmp validate ./output --only-tests "deployments-have-unique-names"

# Verbose output
azmp validate ./output --verbose

# Strict mode (fail on warnings)
azmp validate ./output --strict
```

### Package Options

```bash
# Custom output name
azmp package ./output --output my-app-v1.0.0.zip

# Skip validation
azmp package ./output --no-validate

# Maximum compression
azmp package ./output --compression maximum

# Include README
azmp package ./output --include-readme
```

## Per-Project Configuration

### Project Setup

Create `azmp.config.json` in your project root:

```json
{
  "version": "1.0.0",
  "publisher": "Project Team",
  "outputDir": "./arm-templates",
  "templateDefaults": {
    "location": "eastus"
  }
}
```

Then run commands without specifying repeated options:

```bash
# Publisher and output dir come from config
azmp create storage --name "ProjectStorage"
```

### Multiple Configurations

Use different configs for different environments:

```bash
# Development
azmp create storage --name "Test" --config azmp.dev.json

# Staging
azmp create storage --name "Test" --config azmp.staging.json

# Production
azmp create storage --name "Test" --config azmp.prod.json
```

**azmp.dev.json:**

```json
{
  "publisher": "Dev Team",
  "outputDir": "./dev-templates",
  "validation": {
    "continueOnError": true
  }
}
```

**azmp.prod.json:**

```json
{
  "publisher": "Acme Corporation",
  "outputDir": "./production-templates",
  "validation": {
    "strictMode": true,
    "continueOnError": false
  }
}
```

## User-Level Configuration

### Global Defaults

Create `~/.azmp/config.json` for user-wide defaults:

```json
{
  "publisher": "My Name",
  "outputDir": "./azmp-output",
  "templateDefaults": {
    "location": "eastus"
  }
}
```

This applies to all projects unless overridden by project-level config.

### Setup Script

```bash
#!/bin/bash
# setup-azmp-config.sh

mkdir -p ~/.azmp

cat > ~/.azmp/config.json << EOF
{
  "version": "1.0.0",
  "publisher": "$USER",
  "outputDir": "./output",
  "templateDefaults": {
    "location": "eastus"
  }
}
EOF

echo "✓ Created ~/.azmp/config.json"
```

## Configuration Management Commands

### Show Current Configuration

```bash
azmp config show
```

Output:

```json
{
  "publisher": "My Company",
  "outputDir": "./output",
  "plugins": [],
  "templateDefaults": {
    "location": "eastus"
  }
}
```

### Get Specific Value

```bash
azmp config get publisher
# Output: My Company

azmp config get outputDir
# Output: ./output

azmp config get templateDefaults.location
# Output: eastus
```

### Set Configuration Value

```bash
azmp config set publisher "New Company Name"
azmp config set outputDir "./templates"
azmp config set templateDefaults.location "westus"
```

### List Plugins

```bash
azmp config plugins
```

Output:

```
Configured Plugins:
  ✓ @hoiltd/azmp-plugin-vm (v1.0.0)
    - Resource types: vm, virtualmachine
    - Commands: vm
```

## Validation Configuration

### Skip Tests

Skip problematic or irrelevant tests:

```json
{
  "validation": {
    "skipTests": [
      "outputs-must-not-contain-secrets",
      "secure-params-in-nested-deployments",
      "location-uses-parameter"
    ]
  }
}
```

### Run Only Specific Tests

Useful for quick checks:

```json
{
  "validation": {
    "onlyTests": [
      "deployments-have-unique-names",
      "parameters-must-be-referenced"
    ]
  }
}
```

### Strict Mode

Fail on warnings (production use):

```json
{
  "validation": {
    "strictMode": true,
    "continueOnError": false
  }
}
```

### Lenient Mode

Continue on errors (development):

```json
{
  "validation": {
    "strictMode": false,
    "continueOnError": true
  }
}
```

## Plugin Configuration

### Load Plugins

```json
{
  "plugins": [
    "@hoiltd/azmp-plugin-vm",
    "@mycompany/azmp-plugin-sql"
  ]
}
```

### Plugin-Specific Settings

Some plugins support custom configuration:

```json
{
  "plugins": [
    "@hoiltd/azmp-plugin-vm"
  ],
  "pluginConfig": {
    "@hoiltd/azmp-plugin-vm": {
      "defaultVmSize": "Standard_D2s_v3",
      "defaultOsType": "Linux"
    }
  }
}
```

Check plugin documentation for available settings.

## Troubleshooting

### Configuration Not Loading

1. **Check file location:**
   ```bash
   ls -la azmp.config.json
   ```

2. **Validate JSON syntax:**
   ```bash
   cat azmp.config.json | jq .
   ```

3. **Use explicit path:**
   ```bash
   azmp create storage --name "Test" --config ./azmp.config.json
   ```

### Environment Variables Not Working

1. **Check variable is set:**
   ```bash
   echo $AZMP_PUBLISHER
   ```

2. **Export variables:**
   ```bash
   export AZMP_PUBLISHER="My Company"
   ```

3. **Use .env file:**
   ```bash
   source .env
   azmp create storage --name "Test"
   ```

### Plugin Not Loading

1. **Verify installation:**
   ```bash
   npm list @hoiltd/azmp-plugin-vm
   ```

2. **Check configuration:**
   ```bash
   azmp config show
   ```

3. **Install plugin:**
   ```bash
   npm install -g @hoiltd/azmp-plugin-vm
   ```

## Best Practices

### ✅ DO

- **Use project-level config** for team projects
- **Use environment variables** for sensitive values
- **Version control** `azmp.config.json`
- **Document** custom configurations
- **Use strict mode** in production pipelines
- **Skip only necessary tests** in development

### ❌ DON'T

- **Hardcode secrets** in config files
- **Commit sensitive data** to version control
- **Disable validation** in production
- **Use too many skip tests** (masks real issues)
- **Mix configuration methods** unnecessarily

## Next Steps

- **[CLI Reference](CLI-Reference)** - All available commands
- **[Plugin Development](Plugin-Development)** - Create custom plugins
- **[Security Features](Security-Features)** - Configure security settings

---

**Questions?** Ask in [GitHub Discussions](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/discussions)
