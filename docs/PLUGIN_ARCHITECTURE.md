# Plugin Architecture

**Version:** 3.0.0  
**Status:** Foundation Established (Interfaces Defined)  
**Implementation:** Planned for v3.1.0+

## Overview

The Azure Marketplace Generator supports extensibility through a plugin architecture that allows developers to:

- **Add new template types** (e.g., compute, database, networking)
- **Register custom Handlebars helpers** for template generation
- **Extend CLI commands** with additional functionality
- **Customize validation** and packaging behavior

Starting with v3.0.0, the plugin interface foundation has been established to ensure a stable API contract for future extensions.

## Architecture Status

### ✅ v3.0.0 - Foundation (Current Release)

The following interfaces and types are now defined and stable:

- `IPlugin` - Main plugin interface
- `PluginContext` - Context provided during initialization
- `TemplateMetadata` - Template type descriptor
- `PluginConfig` - Plugin configuration structure
- `BasePlugin` - Abstract base class for plugins
- `TemplateRegistry` - Registry for managing templates and plugins

**What's Available:**
- Plugin interface contracts (stable API)
- Template registry infrastructure
- Type definitions for extensibility

**What's NOT Yet Implemented:**
- Dynamic plugin loading
- Plugin discovery and initialization
- Automatic helper registration
- CLI command registration from plugins

### 🚧 v3.1.0 - Implementation (Planned)

Full plugin system implementation including:

- `PluginLoader` class for dynamic loading
- Plugin discovery from `node_modules` and local paths
- Automatic registration of templates and helpers
- CLI command registration
- Plugin lifecycle management (initialize/cleanup)
- Configuration support in `azmp-config.json`

## Plugin Interface

### IPlugin Interface

```typescript
export interface IPlugin {
  /** Plugin metadata */
  readonly metadata: {
    id: string;                      // Unique plugin identifier
    name: string;                    // Human-readable name
    description: string;             // What the plugin does
    version: string;                 // Semver version
    author?: string;                 // Plugin author
    requiredGeneratorVersion?: string; // Min generator version
  };

  /** Initialize the plugin */
  initialize?(context: PluginContext): void | Promise<void>;

  /** Get templates provided by this plugin */
  getTemplates?(): TemplateMetadata[];

  /** Get custom Handlebars helpers */
  getHandlebarsHelpers?(): Record<string, HandlebarsHelper>;

  /** Register custom CLI commands */
  registerCommands?(program: Command): void;

  /** Cleanup when plugin is unloaded */
  cleanup?(): void | Promise<void>;
}
```

### Plugin Context

Plugins receive a context object during initialization:

```typescript
export interface PluginContext {
  generatorVersion: string;   // Current generator version
  templatesDir: string;       // Path to templates directory
  outputDir: string;          // Path to output directory
  config: any;                // Configuration object
  logger: {                   // Logging functions
    info: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
    debug: (message: string) => void;
  };
}
```

## Template Registry

The `TemplateRegistry` class manages all template types:

```typescript
import { templateRegistry } from './core/template-registry';

// Register a built-in template
templateRegistry.registerTemplate({
  type: 'storage',
  name: 'Azure Storage Account',
  description: 'Managed Application for Storage',
  version: '3.0.0',
  templatePath: 'storage'
});

// Get template metadata
const template = templateRegistry.getTemplate('storage');

// List all templates
const allTemplates = templateRegistry.getAllTemplates();

// Search templates
const results = templateRegistry.searchTemplates('storage');
```

## Creating a Plugin (v3.1.0+)

### Basic Plugin Example

```typescript
// my-plugin.ts
import { IPlugin, PluginContext, TemplateMetadata } from 'azmp/core/plugin';

export class MyPlugin implements IPlugin {
  readonly metadata = {
    id: 'azmp-compute-templates',
    name: 'Compute Templates Plugin',
    description: 'Adds Azure Compute resource templates',
    version: '1.0.0',
    author: 'Your Name'
  };

  initialize(context: PluginContext): void {
    context.logger.info('Compute Templates Plugin initialized');
  }

  getTemplates(): TemplateMetadata[] {
    return [
      {
        type: 'vm',
        name: 'Virtual Machine',
        description: 'Azure VM Managed Application',
        version: '1.0.0',
        templatePath: 'vm',
        tags: ['compute', 'iaas']
      },
      {
        type: 'vmss',
        name: 'Virtual Machine Scale Set',
        description: 'Azure VMSS Managed Application',
        version: '1.0.0',
        templatePath: 'vmss',
        tags: ['compute', 'scale', 'iaas']
      }
    ];
  }

  getHandlebarsHelpers() {
    return {
      vmSize: (tier: string) => {
        const sizes = {
          small: 'Standard_B2s',
          medium: 'Standard_D2s_v3',
          large: 'Standard_D4s_v3'
        };
        return sizes[tier] || 'Standard_B2s';
      }
    };
  }
}
```

### Using BasePlugin

```typescript
import { BasePlugin, PluginContext } from 'azmp/core/plugin';

export class MySimplePlugin extends BasePlugin {
  readonly metadata = {
    id: 'my-simple-plugin',
    name: 'My Simple Plugin',
    description: 'A minimal plugin example',
    version: '1.0.0'
  };

  // Override only what you need
  getTemplates() {
    return [{
      type: 'mytype',
      name: 'My Template Type',
      description: 'Custom template',
      version: '1.0.0',
      templatePath: 'mytype'
    }];
  }
}
```

## Plugin Configuration (v3.1.0+)

Plugins can be configured in `azmp-config.json`:

```json
{
  "outputDir": "./output",
  "templatesDir": "./src/templates",
  "plugins": [
    {
      "package": "azmp-compute-templates",
      "enabled": true,
      "options": {
        "defaultVmSize": "Standard_B2s",
        "includeNestedTemplates": true
      }
    },
    {
      "package": "./local-plugins/my-plugin",
      "enabled": true
    },
    {
      "package": "@myorg/azmp-database-templates",
      "enabled": false
    }
  ]
}
```

### Configuration Fields

- **package**: npm package name or local file path
- **enabled**: Whether to load this plugin (default: `true`)
- **options**: Plugin-specific configuration object

## Template Structure

Plugin templates must follow the standard structure:

```
my-plugin/
├── templates/
│   └── mytype/                    # Template type directory
│       ├── mainTemplate.json.hbs   # Required: ARM template
│       ├── createUiDefinition.json.hbs  # Required: UI definition
│       ├── viewDefinition.json.hbs      # Optional: View definition
│       └── nestedtemplates/             # Optional: Nested templates
│           └── resource.json.hbs
├── package.json
└── index.ts                        # Plugin entry point
```

### Template Discovery

The generator discovers templates in this order:

1. Built-in templates (shipped with generator)
2. Plugin templates (from enabled plugins)
3. Local templates (from configured `templatesDir`)

## CLI Command Extensions (v3.1.0+)

Plugins can add custom commands:

```typescript
export class MyPlugin implements IPlugin {
  // ... metadata and other methods ...

  registerCommands(program: Command): void {
    program
      .command('my-custom-command')
      .description('Does something custom')
      .option('-f, --force', 'Force operation')
      .action(async (options) => {
        console.log('Custom command executed!');
      });
  }
}
```

## Handlebars Helpers

Plugins can register custom helpers for templates:

```typescript
export class MyPlugin implements IPlugin {
  getHandlebarsHelpers() {
    return {
      // Simple helper
      uppercase: (str: string) => str.toUpperCase(),

      // Helper with options
      resourceName: (prefix: string, type: string) => {
        return `${prefix}-${type}-${Date.now()}`;
      },

      // Block helper
      ifEquals: function(arg1: any, arg2: any, options: any) {
        return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
      }
    };
  }
}
```

## Plugin Lifecycle

### Initialization

1. Generator discovers plugins from configuration
2. Validates plugin compatibility (version checks)
3. Calls `initialize()` on each plugin
4. Registers templates via `TemplateRegistry`
5. Registers Handlebars helpers
6. Registers CLI commands

### Usage

- Templates are available for `azmp create` command
- Helpers are available in all Handlebars templates
- CLI commands are available as `azmp <command>`

### Cleanup

- Called on generator shutdown
- Allows plugins to clean up resources
- Optional implementation

## Best Practices

### 1. Versioning

- Use semantic versioning (semver)
- Specify `requiredGeneratorVersion` for compatibility
- Document breaking changes in plugin CHANGELOG

### 2. Naming Conventions

- Plugin ID: `azmp-<category>-<feature>` (e.g., `azmp-compute-templates`)
- Template types: lowercase, hyphenated (e.g., `virtual-machine`)
- Helper names: camelCase (e.g., `resourceName`)

### 3. Error Handling

- Throw descriptive errors from `initialize()`
- Validate options in plugin configuration
- Log warnings for non-critical issues

### 4. Template Validation

- Include all required template files
- Validate ARM template syntax
- Test with multiple parameter combinations

### 5. Documentation

- Include README.md with usage examples
- Document all configuration options
- Provide sample templates

## Testing Plugins

### Unit Tests

```typescript
import { MyPlugin } from './my-plugin';
import { templateRegistry } from 'azmp/core/template-registry';

describe('MyPlugin', () => {
  let plugin: MyPlugin;

  beforeEach(() => {
    plugin = new MyPlugin();
    templateRegistry.clear();
  });

  it('should register templates', () => {
    const templates = plugin.getTemplates();
    expect(templates).toHaveLength(2);
    expect(templates[0].type).toBe('vm');
  });

  it('should provide helpers', () => {
    const helpers = plugin.getHandlebarsHelpers();
    expect(helpers.vmSize('small')).toBe('Standard_B2s');
  });
});
```

### Integration Tests

```typescript
describe('Plugin Integration', () => {
  it('should generate templates with plugin', async () => {
    const plugin = new MyPlugin();
    templateRegistry.registerPlugin(plugin);

    // Test template generation
    const generator = new TemplateGenerator();
    const result = await generator.generate('vm', {
      applicationName: 'test-vm',
      location: 'eastus'
    });

    expect(result.success).toBe(true);
  });
});
```

## Roadmap

### v3.0.0 (Current) ✅
- Plugin interface definitions
- Template registry
- Type definitions
- Base plugin class

### v3.1.0 (Planned)
- Plugin loader implementation
- Dynamic plugin discovery
- Automatic registration
- CLI command extensions
- Configuration file support

### v3.2.0 (Future)
- Plugin marketplace/catalog
- Plugin dependency management
- Hot reload support
- Plugin sandboxing

### v4.0.0 (Future)
- MCP (Model Context Protocol) server
- Remote plugin loading
- Plugin security scanning
- Advanced plugin APIs

## Migration Guide

### For Plugin Developers

When v3.1.0 is released, existing code using the v3.0.0 interfaces will continue to work without changes. The interfaces are stable and will not have breaking changes.

**Current (v3.0.0):**
```typescript
// Define your plugin using the stable interfaces
export class MyPlugin implements IPlugin {
  // ... implementation ...
}
```

**Future (v3.1.0+):**
```typescript
// Same interface, but now you can package and distribute
// No code changes needed!
export class MyPlugin implements IPlugin {
  // ... same implementation ...
}
```

### For Generator Users

No action required. Plugin support is opt-in:

- **Without plugins**: Generator works exactly as before
- **With plugins**: Add configuration to `azmp-config.json`

## Examples

See the `examples/plugins/` directory (coming in v3.1.0) for complete plugin examples:

- `basic-plugin` - Minimal plugin with one template
- `compute-templates` - Full-featured plugin with multiple templates
- `custom-helpers` - Plugin focused on Handlebars helpers
- `cli-commands` - Plugin adding custom CLI commands

## Support

For plugin development questions:

- Create an issue on GitHub with the `plugin` label
- Check existing plugin examples
- Review this documentation

## Contributing

Want to contribute a plugin?

1. Develop using the `IPlugin` interface
2. Test thoroughly with multiple scenarios
3. Document configuration options
4. Submit to the plugin marketplace (v3.2.0+)

---

**Note:** This is the plugin architecture foundation for v3.0.0. Full implementation will be available in v3.1.0. The interfaces defined in v3.0.0 are stable and will not have breaking changes.
