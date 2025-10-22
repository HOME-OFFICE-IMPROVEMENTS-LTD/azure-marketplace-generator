# Plugin Development Guide

Learn how to create custom plugins to extend the Azure Marketplace Generator with new resource types and functionality.

## Table of Contents

1. [Understanding Plugins](#understanding-plugins)
2. [Plugin Architecture](#plugin-architecture)
3. [Creating Your First Plugin](#creating-your-first-plugin)
4. [Plugin API Reference](#plugin-api-reference)
5. [Best Practices](#best-practices)
6. [Testing Plugins](#testing-plugins)
7. [Publishing Plugins](#publishing-plugins)

## Understanding Plugins

Plugins allow you to:
- ✅ Add new resource types (VM, SQL, Cosmos DB, etc.)
- ✅ Extend CLI commands
- ✅ Customize template generation
- ✅ Add validation rules
- ✅ Integrate external tools

### Plugin Types

1. **Resource Plugins** - Add new Azure resource templates
2. **Command Plugins** - Add CLI commands
3. **Validator Plugins** - Add custom validation logic
4. **Generator Plugins** - Custom template generation

## Plugin Architecture

### Plugin Structure

```
my-azmp-plugin/
├── package.json           # Plugin metadata
├── index.js              # Plugin entry point
├── templates/            # Handlebars templates
│   ├── mainTemplate.json.hbs
│   └── createUiDefinition.json.hbs
└── README.md             # Plugin documentation
```

### Plugin Interface

Every plugin must implement the `AzmpPlugin` interface:

```typescript
interface AzmpPlugin {
  name: string;                    // Plugin identifier
  version: string;                 // Semver version
  resourceTypes: string[];         // Supported resource types
  commands?: PluginCommand[];      // CLI commands
  templatePath?: string;           // Path to templates
  validate?(options: any): ValidationResult;
  generate?(options: any): GeneratedFiles;
}
```

## Creating Your First Plugin

### Step 1: Initialize Plugin Project

```bash
# Create plugin directory
mkdir azmp-plugin-myresource
cd azmp-plugin-myresource

# Initialize npm package
npm init -y

# Install dependencies
npm install --save-dev typescript @types/node
npm install handlebars
```

### Step 2: Create Plugin Entry Point

Create `index.js`:

```javascript
module.exports = {
  name: '@mycompany/azmp-plugin-myresource',
  version: '1.0.0',
  resourceTypes: ['myresource'],
  
  // Optional: CLI commands
  commands: [
    {
      name: 'myresource',
      description: 'Create MyResource managed application',
      options: [
        { name: 'name', required: true, description: 'Resource name' },
        { name: 'sku', default: 'Standard', description: 'SKU tier' }
      ],
      action: async (options) => {
        // Command implementation
        console.log('Creating MyResource...');
        return { success: true };
      }
    }
  ],
  
  // Template directory
  templatePath: './templates',
  
  // Optional: Custom validation
  validate: (options) => {
    const errors = [];
    if (!options.name) {
      errors.push('Name is required');
    }
    return {
      valid: errors.length === 0,
      errors
    };
  },
  
  // Optional: Custom generation
  generate: async (options) => {
    // Custom template generation logic
    return {
      files: [
        { path: 'mainTemplate.json', content: '...' }
      ]
    };
  }
};
```

### Step 3: Create Templates

Create `templates/mainTemplate.json.hbs`:

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "resourceName": {
      "type": "string",
      "metadata": {
        "description": "Name of the resource"
      }
    },
    "location": {
      "type": "string",
      "defaultValue": "[resourceGroup().location]"
    }
  },
  "resources": [
    {
      "type": "Microsoft.MyService/myResources",
      "apiVersion": "2023-01-01",
      "name": "[parameters('resourceName')]",
      "location": "[parameters('location')]",
      "sku": {
        "name": "{{sku}}"
      },
      "properties": {
        "customProperty": "{{customValue}}"
      }
    }
  ]
}
```

### Step 4: Update Package.json

```json
{
  "name": "@mycompany/azmp-plugin-myresource",
  "version": "1.0.0",
  "description": "Azure Marketplace Generator plugin for MyResource",
  "main": "index.js",
  "keywords": [
    "azmp",
    "azmp-plugin",
    "azure",
    "marketplace"
  ],
  "peerDependencies": {
    "@hoiltd/azure-marketplace-generator": "^3.1.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/mycompany/azmp-plugin-myresource"
  }
}
```

### Step 5: Test Locally

```bash
# Link plugin locally
npm link

# Install in generator
cd /path/to/your/project
npm link @mycompany/azmp-plugin-myresource

# Configure in azmp.config.json
{
  "plugins": ["@mycompany/azmp-plugin-myresource"]
}

# Test plugin
azmp myresource --name "test-resource"
```

## Plugin API Reference

### AzmpPlugin Interface

```typescript
interface AzmpPlugin {
  // Required properties
  name: string;              // Must match package name
  version: string;           // Semver version
  resourceTypes: string[];   // ['vm', 'sql', etc.]
  
  // Optional properties
  description?: string;      // Human-readable description
  commands?: PluginCommand[]; // CLI commands
  templatePath?: string;     // Path to Handlebars templates
  
  // Optional methods
  validate?(options: PluginOptions): ValidationResult;
  generate?(options: PluginOptions): Promise<GeneratedFiles>;
  onLoad?(): void | Promise<void>;
  onUnload?(): void | Promise<void>;
}
```

### PluginCommand Interface

```typescript
interface PluginCommand {
  name: string;              // Command name
  description: string;       // Help text
  options: CommandOption[];  // Command options
  action: (options: any) => Promise<CommandResult>;
}

interface CommandOption {
  name: string;              // Option name
  alias?: string;            // Short alias (-n)
  description: string;       // Help text
  required?: boolean;        // Is required?
  default?: any;             // Default value
  type?: 'string' | 'number' | 'boolean';
}
```

### ValidationResult Interface

```typescript
interface ValidationResult {
  valid: boolean;            // Overall validity
  errors: string[];          // Error messages
  warnings?: string[];       // Warning messages
}
```

### GeneratedFiles Interface

```typescript
interface GeneratedFiles {
  files: GeneratedFile[];    // Array of generated files
}

interface GeneratedFile {
  path: string;              // Relative file path
  content: string;           // File content
}
```

## Best Practices

### 1. Naming Conventions

```javascript
// ✅ Good: Scoped package name
"@mycompany/azmp-plugin-vm"

// ❌ Bad: Generic name
"azure-vm-plugin"

// Resource types: lowercase, no spaces
resourceTypes: ['virtualmachine', 'vm-cluster']

// Commands: kebab-case
commands: [{ name: 'create-vm' }]
```

### 2. Version Management

```javascript
// Use semantic versioning
{
  version: '1.2.3',  // MAJOR.MINOR.PATCH
  
  // Specify generator compatibility
  peerDependencies: {
    '@hoiltd/azure-marketplace-generator': '^3.1.0'
  }
}
```

### 3. Error Handling

```javascript
// Always validate input
validate: (options) => {
  const errors = [];
  
  if (!options.name) {
    errors.push('name is required');
  }
  
  if (options.name && !/^[a-z0-9-]+$/.test(options.name)) {
    errors.push('name must contain only lowercase letters, numbers, and hyphens');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Handle async errors gracefully
generate: async (options) => {
  try {
    // Generation logic
  } catch (error) {
    throw new Error(`Failed to generate templates: ${error.message}`);
  }
}
```

### 4. Template Organization

```
templates/
├── mainTemplate.json.hbs       # Main ARM template
├── createUiDefinition.json.hbs # UI definition
├── viewDefinition.json.hbs     # Management view
└── nestedtemplates/            # Nested templates
    ├── networking.json.hbs
    └── compute.json.hbs
```

### 5. Documentation

Every plugin should include:
- ✅ README.md with usage examples
- ✅ API documentation
- ✅ Template variable reference
- ✅ Example configurations
- ✅ Changelog

## Testing Plugins

### Unit Tests

Create `test/plugin.test.js`:

```javascript
const plugin = require('../index');
const assert = require('assert');

describe('MyResource Plugin', () => {
  it('should export required properties', () => {
    assert.ok(plugin.name);
    assert.ok(plugin.version);
    assert.ok(Array.isArray(plugin.resourceTypes));
  });
  
  it('should validate options', () => {
    const result = plugin.validate({ name: 'test' });
    assert.strictEqual(result.valid, true);
  });
  
  it('should reject invalid names', () => {
    const result = plugin.validate({ name: 'Invalid Name!' });
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.length > 0);
  });
  
  it('should generate templates', async () => {
    const result = await plugin.generate({
      name: 'test-resource',
      sku: 'Premium'
    });
    assert.ok(result.files);
    assert.ok(result.files.length > 0);
  });
});
```

### Integration Tests

```bash
# Create test project
mkdir test-integration
cd test-integration

# Install generator and plugin
npm install -g @hoiltd/azure-marketplace-generator
npm install ../azmp-plugin-myresource

# Test plugin commands
azmp myresource --name "test" --sku "Premium"

# Validate generated templates
azmp validate ./output
```

### Continuous Integration

Create `.github/workflows/test.yml`:

```yaml
name: Test Plugin

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run lint
```

## Publishing Plugins

### 1. Prepare for Publication

```bash
# Test locally
npm test

# Check package contents
npm pack --dry-run

# Review package.json
cat package.json
```

### 2. Publish to NPM

```bash
# Login to NPM
npm login

# Publish package
npm publish --access public

# Verify publication
npm view @mycompany/azmp-plugin-myresource
```

### 3. Create GitHub Release

```bash
# Tag version
git tag v1.0.0
git push origin v1.0.0

# Create release on GitHub
gh release create v1.0.0 --title "v1.0.0" --notes "Initial release"
```

### 4. Announce Plugin

Share your plugin:
- ✅ GitHub Discussions
- ✅ Plugin registry (if available)
- ✅ Documentation wiki
- ✅ Community forums

## Examples

### Complete Plugin Example

See the official VM plugin for a complete reference:
- **Repository:** [azmp-plugin-vm](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azmp-plugin-vm)
- **NPM:** [@hoiltd/azmp-plugin-vm](https://www.npmjs.com/package/@hoiltd/azmp-plugin-vm)

### Plugin Templates

Official templates for quick starts:
- Resource plugin template
- Command plugin template
- Validator plugin template

## Troubleshooting

### Plugin Not Loading

```bash
# Check plugin is installed
npm list @mycompany/azmp-plugin-myresource

# Verify configuration
azmp config show

# Check plugin exports
node -e "console.log(require('@mycompany/azmp-plugin-myresource'))"
```

### Template Errors

```bash
# Validate template syntax
npx handlebars --version
npx handlebars templates/mainTemplate.json.hbs

# Test with sample data
azmp generate --dry-run
```

### Version Conflicts

```bash
# Check generator version
azmp --version

# Update plugin peer dependencies
npm install @hoiltd/azure-marketplace-generator@latest --save-dev
```

## Next Steps

- **[API Reference](API-Reference)** - Complete API documentation
- **[CLI Reference](CLI-Reference)** - All CLI commands
- **[Examples Repository](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azmp-examples)** - Sample plugins

---

**Have questions?** Ask in [GitHub Discussions](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/discussions)
