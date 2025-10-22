# CLI Reference

Complete reference for all Azure Marketplace Generator command-line interface (CLI) commands.

## Global Options

Available for all commands:

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--version` | `-v` | Show version number | - |
| `--help` | `-h` | Show help information | - |
| `--verbose` | | Enable verbose logging | `false` |
| `--config` | `-c` | Path to config file | `azmp.config.json` |
| `--no-color` | | Disable colored output | `false` |

## Core Commands

### `azmp create`

Create Azure Marketplace managed application templates.

#### Syntax

```bash
azmp create <resource-type> [options]
```

#### Resource Types

- `storage` - Azure Storage Account managed application

#### Common Options

| Option | Alias | Type | Required | Description |
|--------|-------|------|----------|-------------|
| `--name` | `-n` | string | Yes | Application name |
| `--publisher` | `-p` | string | Yes | Publisher name |
| `--output` | `-o` | string | No | Output directory (default: `./output`) |
| `--description` | `-d` | string | No | Application description |

#### Examples

**Basic storage application:**

```bash
azmp create storage --name "SecureStorage" --publisher "Acme Inc"
```

**Custom output directory:**

```bash
azmp create storage \
  --name "MyStorage" \
  --publisher "MyCompany" \
  --output ./my-templates
```

**With description:**

```bash
azmp create storage \
  --name "DataLake" \
  --publisher "DataCorp" \
  --description "Enterprise data lake solution"
```

**Using config file:**

Create `azmp.config.json`:

```json
{
  "publisher": "MyCompany",
  "outputDir": "./output",
  "templateDefaults": {
    "location": "eastus"
  }
}
```

Then run:

```bash
azmp create storage --name "MyApp"
```

### `azmp validate`

Validate ARM templates using Azure ARM-TTK (Template Test Toolkit).

#### Syntax

```bash
azmp validate <path> [options]
```

#### Options

| Option | Alias | Type | Description |
|--------|-------|------|-------------|
| `--verbose` | `-v` | boolean | Show detailed validation output |
| `--skip-tests` | | string[] | Tests to skip (comma-separated) |
| `--only-tests` | | string[] | Only run these tests |

#### Examples

**Validate directory:**

```bash
azmp validate ./output
```

**Validate single file:**

```bash
azmp validate ./output/mainTemplate.json
```

**Verbose output:**

```bash
azmp validate ./output --verbose
```

**Skip specific tests:**

```bash
azmp validate ./output --skip-tests "outputs-must-not-contain-secrets,secure-params-in-nested-deployments"
```

**Run only specific tests:**

```bash
azmp validate ./output --only-tests "artifacts-parameter,deployments-have-unique-names"
```

#### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | All templates passed validation |
| `1` | Validation errors found |
| `2` | ARM-TTK not installed or PowerShell not found |

### `azmp package`

Create a deployment package (ZIP file) for Azure Marketplace submission.

#### Syntax

```bash
azmp package <input-path> [options]
```

#### Options

| Option | Alias | Type | Description |
|--------|-------|------|-------------|
| `--output` | `-o` | string | Output file name (default: `app.zip`) |
| `--validate` | | boolean | Validate before packaging (default: `true`) |
| `--no-validate` | | boolean | Skip validation |

#### Examples

**Basic packaging:**

```bash
azmp package ./output
```

**Custom output name:**

```bash
azmp package ./output --output my-application-v1.0.0.zip
```

**Skip validation:**

```bash
azmp package ./output --no-validate
```

#### Package Contents

The generated ZIP includes:
- `mainTemplate.json`
- `createUiDefinition.json`
- `viewDefinition.json`
- `nestedtemplates/` directory (if applicable)

### `azmp config`

Manage configuration settings.

#### Subcommands

##### `azmp config show`

Display current configuration.

```bash
azmp config show
```

##### `azmp config set`

Set a configuration value.

```bash
azmp config set <key> <value>
```

**Examples:**

```bash
azmp config set publisher "My Company"
azmp config set outputDir "./templates"
azmp config set templateDefaults.location "westus2"
```

##### `azmp config get`

Get a configuration value.

```bash
azmp config get <key>
```

**Examples:**

```bash
azmp config get publisher
azmp config get outputDir
```

##### `azmp config plugins`

List configured plugins.

```bash
azmp config plugins
```

**Example output:**

```
Configured Plugins:
  ✓ @hoiltd/azmp-plugin-vm (v1.0.0)
    - Provides: virtualmachine
    - Commands: vm
```

### `azmp plugin`

Manage plugins.

#### Subcommands

##### `azmp plugin list`

List all available plugins.

```bash
azmp plugin list
```

**Example output:**

```
Installed Plugins:
  @hoiltd/azmp-plugin-vm@1.0.0
    Description: Virtual Machine managed applications
    Resource Types: vm, virtualmachine
    Commands: vm

  @mycompany/azmp-plugin-sql@2.1.0
    Description: SQL Server managed applications
    Resource Types: sql, sqlserver
    Commands: sql
```

##### `azmp plugin info`

Show detailed plugin information.

```bash
azmp plugin info <plugin-name>
```

**Example:**

```bash
azmp plugin info @hoiltd/azmp-plugin-vm
```

**Output:**

```
Plugin: @hoiltd/azmp-plugin-vm
Version: 1.0.0
Description: Virtual Machine managed applications
Author: HOME OFFICE IMPROVEMENTS LTD
Repository: https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azmp-plugin-vm

Resource Types:
  - vm
  - virtualmachine

Commands:
  - vm create: Create VM managed application
  - vm validate: Validate VM configuration

Template Path: /node_modules/@hoiltd/azmp-plugin-vm/templates
```

##### `azmp plugin add`

Add a plugin to configuration.

```bash
azmp plugin add <plugin-name>
```

**Example:**

```bash
azmp plugin add @hoiltd/azmp-plugin-vm
```

##### `azmp plugin remove`

Remove a plugin from configuration.

```bash
azmp plugin remove <plugin-name>
```

**Example:**

```bash
azmp plugin remove @hoiltd/azmp-plugin-vm
```

## Plugin-Specific Commands

### VM Plugin Commands

If you have `@hoiltd/azmp-plugin-vm` installed:

#### `azmp vm create`

Create a Virtual Machine managed application.

```bash
azmp vm create --name "MyVM" --publisher "MyCompany" [options]
```

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `--name` | string | VM application name |
| `--publisher` | string | Publisher name |
| `--vm-size` | string | VM size (e.g., Standard_D2s_v3) |
| `--os-type` | string | OS type: Windows or Linux |
| `--admin-username` | string | Admin username |
| `--output` | string | Output directory |

**Example:**

```bash
azmp vm create \
  --name "WebServer" \
  --publisher "Acme Inc" \
  --vm-size "Standard_D2s_v3" \
  --os-type "Linux" \
  --admin-username "azureuser"
```

## Advanced Usage

### Environment Variables

Override configuration with environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `AZMP_OUTPUT_DIR` | Default output directory | `export AZMP_OUTPUT_DIR=./templates` |
| `AZMP_PUBLISHER` | Default publisher name | `export AZMP_PUBLISHER="MyCompany"` |
| `AZMP_CONFIG` | Config file path | `export AZMP_CONFIG=./custom.config.json` |
| `AZMP_VERBOSE` | Enable verbose logging | `export AZMP_VERBOSE=1` |

### Piping and Scripting

**Check validation status:**

```bash
if azmp validate ./output; then
  echo "Validation passed"
  azmp package ./output
else
  echo "Validation failed"
  exit 1
fi
```

**Batch processing:**

```bash
#!/bin/bash
for app in storage vm sql; do
  azmp create $app --name "$app-demo" --publisher "Demo Corp"
  azmp validate "./output/$app-demo"
done
```

**JSON output:**

```bash
azmp config show --json > current-config.json
```

### Configuration File Schema

Complete `azmp.config.json` example:

```json
{
  "version": "1.0.0",
  "publisher": "My Company",
  "outputDir": "./output",
  "templateDefaults": {
    "location": "eastus",
    "apiVersion": "2023-01-01"
  },
  "plugins": [
    "@hoiltd/azmp-plugin-vm",
    "@mycompany/azmp-plugin-sql"
  ],
  "validation": {
    "skipTests": [
      "outputs-must-not-contain-secrets"
    ],
    "strictMode": false
  },
  "packaging": {
    "compression": "maximum",
    "includeReadme": true
  }
}
```

## Exit Codes

All commands return standard exit codes:

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | General error (validation failure, template error, etc.) |
| `2` | Missing dependency (ARM-TTK, PowerShell) |
| `3` | Configuration error |
| `4` | Plugin error |
| `5` | Network error |

## Debugging

### Enable Debug Logging

```bash
# Verbose output
azmp create storage --name "Test" --publisher "Test" --verbose

# Debug environment variable
export DEBUG=azmp:*
azmp create storage --name "Test" --publisher "Test"
```

### Common Error Messages

**"ARM-TTK not found"**

```bash
# Install ARM-TTK
npm run install-arm-ttk

# Or manually
git clone https://github.com/Azure/arm-ttk.git
```

**"Plugin not found"**

```bash
# Check plugin installation
npm list -g @hoiltd/azmp-plugin-vm

# Reinstall plugin
npm install -g @hoiltd/azmp-plugin-vm
```

**"Invalid configuration"**

```bash
# Check config syntax
cat azmp.config.json | jq .

# Reset to defaults
rm azmp.config.json
azmp config show
```

## Shell Completion

### Bash

```bash
# Add to ~/.bashrc
eval "$(azmp completion bash)"
```

### Zsh

```bash
# Add to ~/.zshrc
eval "$(azmp completion zsh)"
```

### PowerShell

```powershell
# Add to $PROFILE
azmp completion powershell | Out-String | Invoke-Expression
```

## Getting Help

### Command-Specific Help

```bash
# General help
azmp --help

# Command help
azmp create --help
azmp validate --help
azmp package --help

# Plugin help
azmp vm --help
```

### Online Resources

- **Documentation:** [GitHub Wiki](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/wiki)
- **API Reference:** [API Documentation](API-Reference)
- **Plugin Development:** [Plugin Guide](Plugin-Development)
- **Examples:** [Examples Repository](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azmp-examples)

---

**Next:** [Configuration Guide](Configuration-Guide) →
