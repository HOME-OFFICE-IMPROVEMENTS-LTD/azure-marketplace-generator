# Configuration File Guide

The Azure Marketplace Generator supports configuration files to help you save time and maintain consistent settings across your project.

## Table of Contents

- [Overview](#overview)
- [Creating a Config File](#creating-a-config-file)
- [Configuration Schema](#configuration-schema)
- [Using Configuration](#using-configuration)
- [Validation](#validation)
- [Best Practices](#best-practices)

## Overview

A configuration file (`azmp.config.json`) allows you to:

- Set default values for publisher name, application name, and output directory
- Save template-specific settings like Azure region
- Configure validation and packaging preferences
- Share settings across team members
- Override config values with CLI options when needed

## Creating a Config File

### Quick Start

Create a sample configuration file:

```bash
azmp config init
```

This creates `azmp.config.json` in the current directory with example values.

### Custom Location

Create the config in a specific location:

```bash
azmp config init --output ./.azmp/config.json
```

## Configuration Schema

### Complete Example

```json
{
  "publisher": "My Company Inc.",
  "defaultOutputDir": "./output",
  "templates": {
    "storage": {
      "name": "My Storage Solution",
      "location": "eastus"
    }
  },
  "validation": {
    "saveReport": false,
    "reportPath": "./validation-report.txt"
  },
  "packaging": {
    "defaultFileName": "my-app-package.zip"
  }
}
```

### Schema Reference

| Property | Type | Description | Constraints |
|----------|------|-------------|-------------|
| `publisher` | string | Default publisher name | 1-100 characters, alphanumeric with spaces, dots, hyphens, underscores |
| `defaultOutputDir` | string | Default output directory | Must be a relative path |
| `templates.storage.name` | string | Default storage app name | 1-64 characters, alphanumeric with spaces, dots, hyphens, underscores |
| `templates.storage.location` | string | Default Azure region | Valid Azure region name |
| `validation.saveReport` | boolean | Auto-save validation reports | true/false |
| `validation.reportPath` | string | Validation report file path | Relative path ending in .txt |
| `packaging.defaultFileName` | string | Default package filename | Must end with .zip |

## Using Configuration

### Automatic Discovery

The CLI automatically searches for config files in these locations:

1. `./azmp.config.json` (current directory)
2. `./.azmp/config.json` (hidden directory)
3. `../azmp.config.json` (parent directory)

### Explicit Config Path

Specify a custom config file location:

```bash
azmp create storage --config ./custom-config.json
azmp validate ./output --config ./custom-config.json
azmp package ./output --config ./custom-config.json
```

### Priority Order

Settings are applied in this order (later overrides earlier):

1. Config file defaults
2. CLI options

**Example:**
```bash
# Config has publisher = "Company A"
# CLI specifies --publisher "Company B"
# Result: Uses "Company B" (CLI wins)
```

## Command Integration

### Create Command

Config file settings used by `azmp create`:

```json
{
  "publisher": "Default Publisher",
  "defaultOutputDir": "./dist",
  "templates": {
    "storage": {
      "name": "Default Storage App"
    }
  }
}
```

Usage:
```bash
# Uses publisher and name from config
azmp create storage

# Config name, but CLI publisher overrides
azmp create storage --publisher "Custom Publisher"

# All from CLI (ignores config)
azmp create storage -p "CLI Pub" -n "CLI Name" -o ./custom
```

### Validate Command

Config file settings used by `azmp validate`:

```json
{
  "validation": {
    "saveReport": true,
    "reportPath": "./reports/validation.txt"
  }
}
```

Usage:

```bash
# Auto-saves report to configured path
azmp validate ./output

# CLI option overrides config path
azmp validate ./output --save-report ./custom-report.txt
```

### Package Command

Config file settings used by `azmp package`:

```json
{
  "packaging": {
    "defaultFileName": "storage-solution-v1.0.zip"
  }
}
```

Usage:
```bash
# Uses filename from config
azmp package ./output

# CLI option overrides config
azmp package ./output --output custom-package.zip
```

## Validation

### Validate Config File

Check if your config file is valid:

```bash
azmp config validate
```

Or validate a specific file:

```bash
azmp config validate ./custom-config.json
```

### Validation Errors

The CLI validates:

- Publisher name length and characters

- Output directory is relative (not absolute)

- Package filename ends with .zip
- JSON syntax is correct

If validation fails, you'll see:
```
❌ Configuration has errors:
   1. Publisher name exceeds 100 characters
   2. Packaging defaultFileName must end with .zip
```

## Best Practices

### 1. Version Control

**Recommended:** Commit config file for shared team settings:
```bash
git add azmp.config.json
```

**If contains secrets:** Add to `.gitignore`:
```bash
echo "azmp.config.json" >> .gitignore
```

### 2. Project-Specific Configs

Create separate configs for different projects:

```
projects/
  storage-app/
    azmp.config.json          # Storage-specific settings
  vm-app/
    azmp.config.json          # VM-specific settings
```

### 3. Environment-Specific Configs

Use different configs for dev/staging/prod:

```bash
azmp.config.dev.json
azmp.config.staging.json
azmp.config.prod.json
```

Usage:
```bash
azmp create storage --config azmp.config.prod.json
```

### 4. Minimal Configs

Only include settings you want to override:

```json
{
  "publisher": "My Company",
  "defaultOutputDir": "./dist"
}
```

No need to include everything!

### 5. Hidden Directory

Store config in a hidden directory for cleaner root:

```bash
.azmp/
  config.json
```

The CLI will find it automatically.

## Examples

### Basic Project Config

```json
{
  "publisher": "Contoso Ltd.",
  "defaultOutputDir": "./marketplace-packages"
}
```

### Full Storage Solution Config

```json
{
  "publisher": "Contoso Storage Solutions",
  "defaultOutputDir": "./output",
  "templates": {
    "storage": {
      "name": "Enterprise Storage Manager",
      "location": "eastus2"
    }
  },
  "validation": {
    "saveReport": true,
    "reportPath": "./reports/validation-report.txt"
  },
  "packaging": {
    "defaultFileName": "contoso-storage-v1.2.zip"
  }
}
```

### CI/CD Pipeline Config

```json
{
  "publisher": "Automated Publisher",
  "defaultOutputDir": "./artifacts",
  "validation": {
    "saveReport": true,
    "reportPath": "./artifacts/validation-report.txt"
  },
  "packaging": {
    "defaultFileName": "marketplace-package.zip"
  }
}
```

## Troubleshooting

### Config Not Loading

1. Check file location:
```bash
ls -la azmp.config.json
```

2. Validate JSON syntax:
```bash
azmp config validate
```

3. Use explicit path:
```bash
azmp create storage --config ./azmp.config.json --verbose
```

### Settings Not Applied

Remember: **CLI options override config file**

Check what's being used:
```bash
azmp create storage --verbose
```

Look for log line:
```
📄 Loaded configuration from: ./azmp.config.json
```

### Validation Warnings

Some validation errors are warnings (CLI continues):
```
⚠️  Config file validation warnings:
   • defaultOutputDir should be a relative path
   Continuing with valid settings...
```

Fix the warnings for best results, but the CLI will still work.

## Summary

Configuration files make the Azure Marketplace Generator more convenient for regular use:

✅ Save time with default values  
✅ Share settings across team  
✅ Override when needed with CLI options  
✅ Validate before use  
✅ Version control friendly  

Create yours today:
```bash
azmp config init
```
