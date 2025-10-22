# Getting Started

Welcome! This guide will help you install and start using the Azure Marketplace Generator.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed ([Download](https://nodejs.org/))
- **PowerShell** (for ARM template validation)
- **Azure CLI** (optional, for deployment testing)
- **Git** (for cloning the repository)

## Installation

### Option 1: Install from NPM (Recommended)

The easiest way to get started:

```bash
# Install globally
npm install -g @hoiltd/azure-marketplace-generator

# Verify installation
azmp --version
# Should output: 3.1.0
```

### Option 2: Install from Source

For development or contributing:

```bash
# Clone the repository
git clone https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator.git

# Navigate to the project
cd azure-marketplace-generator

# Install dependencies
npm install

# Install ARM-TTK for validation
npm run install-arm-ttk

# Build the CLI
npm run build

# Link for global use
npm link
```

## Quick Start

### 1. Create Your First Storage Application

```bash
# Create a storage managed application
azmp create storage --publisher "MyCompany" --name "MyStorageApp"
```

This generates:
- ✅ `mainTemplate.json` - ARM template with all resources
- ✅ `createUiDefinition.json` - Azure Portal UI definition
- ✅ `viewDefinition.json` - Management view definition
- ✅ `nestedtemplates/` - Nested template files

### 2. Review Generated Templates

Navigate to the output directory:

```bash
cd output/
ls -la
```

You'll see:
```
output/
├── mainTemplate.json          # Main ARM template
├── createUiDefinition.json    # UI definition
├── viewDefinition.json        # Management view
└── nestedtemplates/           # Nested templates
    └── storageAccount.json
```

### 3. Validate Templates

Ensure your templates meet Azure standards:

```bash
azmp validate ./output
```

Expected output:
```
✓ Validating templates...
✓ All templates passed validation!
```

### 4. Package for Marketplace

Create a deployment package:

```bash
azmp package ./output
```

This creates:
- `app.zip` - Ready for Azure Marketplace submission

## Using Plugins

### Install a Plugin

```bash
# Install the VM plugin
npm install -g @hoiltd/azmp-plugin-vm
```

### Configure Plugin

Create `azmp.config.json` in your project:

```json
{
  "plugins": [
    "@hoiltd/azmp-plugin-vm"
  ]
}
```

### Use Plugin Features

```bash
# List available commands
azmp --help

# Use plugin command (example with VM plugin)
azmp vm create --name myvm --publisher "MyCompany"
```

## Configuration

### Create Configuration File

Create `azmp.config.json` in your project root:

```json
{
  "outputDir": "./output",
  "publisher": "MyCompany",
  "templateDefaults": {
    "location": "eastus",
    "sku": "Standard_LRS"
  },
  "plugins": []
}
```

See [Configuration Guide](Configuration-Guide) for all options.

## Common Commands

### Create Templates

```bash
# Create storage application
azmp create storage --publisher "Acme Inc" --name "SecureStorage"

# With custom output directory
azmp create storage --publisher "Acme" --name "Storage" --output ./my-output

# With configuration file
azmp create storage  # Uses azmp.config.json
```

### Validate Templates

```bash
# Validate directory
azmp validate ./output

# Validate specific file
azmp validate ./output/mainTemplate.json

# Verbose output
azmp validate ./output --verbose
```

### Package for Deployment

```bash
# Create deployment package
azmp package ./output

# Custom output name
azmp package ./output --output my-app.zip
```

### Configuration Management

```bash
# View current configuration
azmp config show

# Set a value
azmp config set publisher "My Company"

# List all plugins
azmp config plugins
```

## Next Steps

Now that you're set up, explore:

1. **[User Guide](User-Guide)** - Detailed usage documentation
2. **[Template Reference](Template-Reference)** - All available parameters
3. **[Plugin System](Plugin-System)** - Extend with custom functionality
4. **[Security Features](Security-Features)** - Understanding security options
5. **[FAQ](FAQ)** - Common questions answered

## Troubleshooting

### Command Not Found

If `azmp` command is not found after installation:

```bash
# Check npm global bin directory
npm config get prefix

# Add to PATH (Linux/Mac)
export PATH="$PATH:$(npm config get prefix)/bin"

# Or reinstall globally
npm install -g @hoiltd/azure-marketplace-generator
```

### ARM-TTK Validation Fails

```bash
# Reinstall ARM-TTK
npm run install-arm-ttk

# Check PowerShell is available
pwsh --version
```

### Plugin Not Loading

```bash
# Verify plugin is installed
npm list -g @hoiltd/azmp-plugin-vm

# Check configuration
azmp config show

# Run with verbose logging
azmp --verbose
```

## Getting Help

- **Documentation:** This wiki
- **Issues:** [GitHub Issues](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/issues)
- **Discussions:** [GitHub Discussions](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/discussions)
- **FAQ:** [FAQ](FAQ)

---

**Next:** [User Guide](User-Guide) →
