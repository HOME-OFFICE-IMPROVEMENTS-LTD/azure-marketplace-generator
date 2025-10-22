# Plugin Architecture

**Version:** 3.1.0  
**Status:** ✅ Fully Implemented  
**Implementation:** Complete - Dynamic plugin loading available

## Overview

The Azure Marketplace Generator supports extensibility through a plugin architecture that allows developers to:

- **Add new template types** (e.g., compute, database, networking)
- **Register custom Handlebars helpers** for template generation
- **Extend CLI commands** with additional functionality
- **Customize validation** and packaging behavior

The plugin system is fully operational as of v3.1.0, supporting both npm packages and local file plugins with comprehensive security validations.

## Architecture Status

### ✅ v3.0.0 - Foundation (Released)

The following interfaces and types are defined and stable:

- `IPlugin` - Main plugin interface
- `PluginContext` - Context provided during initialization
- `TemplateMetadata` - Template type descriptor
- `PluginConfig` - Plugin configuration structure
- `BasePlugin` - Abstract base class for plugins
- `TemplateRegistry` - Registry for managing templates and plugins

### ✅ v3.1.0 - Full Implementation (Current)

**Complete plugin system with:**

- ✅ **Dynamic plugin loading** from npm packages and local paths
- ✅ **Security validations** - Path traversal protection, workspace root checking
- ✅ **Automatic helper registration** with Handlebars engine
- ✅ **CLI command registration** with Commander integration
- ✅ **Conflict detection** for helpers, commands, and template types
- ✅ **Plugin lifecycle management** - Initialize with 5s timeout, cleanup on exit
- ✅ **Configuration support** in `azmp-config.json` with validation
- ✅ **Error isolation** - Bad plugins don't crash the CLI
- ✅ **Metadata validation** - Ensures required fields present

**New classes implemented:**

- `PluginLoader` - Dynamic module loading with security
- `HelperRegistrar` - Handlebars helper management
- `CommandRegistrar` - CLI command tracking and registration

## Getting Started with Plugins

### Quick Start: Using an Existing Plugin

1. **Install the plugin** (if from npm):
   ```bash
   npm install azmp-compute-templates
   ```

2. **Create or edit `azmp-config.json`**:
   ```json
   {
     "plugins": [
       {
         "package": "azmp-compute-templates",
         "enabled": true
       }
     ]
   }
   ```

3. **Use the plugin**:
   ```bash
   azmp create vm --name "MyVM" --publisher "Acme Inc"
   ```

### Quick Start: Creating a Local Plugin

1. **Create plugin directory**:
   ```bash
   mkdir -p plugins/my-plugin
   cd plugins/my-plugin
   ```

2. **Create `index.js`** (see full example in "Creating a Plugin" section below):
   ```javascript
   exports.default = class MyPlugin {
     metadata = {
       id: 'my-plugin',
       name: 'My Custom Plugin',
       version: '1.0.0'
     };
     
     getTemplates() {
       return [/* your templates */];
     }
   };
   ```

3. **Add to `azmp-config.json`**:
   ```json
   {
     "plugins": [
       {
         "package": "./plugins/my-plugin"
       }
     ]
   }
   ```

4. **Test the plugin**:
   ```bash
   azmp --verbose
   # Should show "Loaded 1 plugin(s): my-plugin"
   ```

## Security Features (v3.1.0)

### ✅ Path Traversal Protection

- **Status**: **IMPLEMENTED in v3.1.0** ✅
- **Implementation**: `PluginLoader.loadLocalModule()` validates paths
- **Security**: 
  - Resolves relative paths against workspace root
  - Normalizes paths to collapse `../` sequences
  - Rejects paths that escape workspace root
  - Example: `../../etc/passwd` is blocked with clear error
- **File**: `src/core/plugin-loader.ts`

### ✅ Helper Name Validation

- **Status**: **IMPLEMENTED in v3.1.0** ✅
- **Implementation**: `HelperRegistrar.validateHelperName()`
- **Pattern**: `^[a-zA-Z0-9_-]+$` (alphanumeric, underscore, hyphen only)
- **Prevents**: Code injection via helper names
- **File**: `src/core/helper-registrar.ts`

### ✅ Conflict Detection

- **Status**: **IMPLEMENTED in v3.1.0** ✅
- **Scope**: Helpers, commands, command aliases, template types
- **Behavior**: Throws descriptive errors before registration
- **Files**: `src/core/helper-registrar.ts`, `src/core/command-registrar.ts`, `src/core/template-registry.ts`

### ✅ Plugin Metadata Validation

- **Status**: **IMPLEMENTED in v3.1.0** ✅
- **Required Fields**: `metadata.id`, `metadata.name`, `metadata.version`
- **ID Pattern**: `^[a-zA-Z0-9_-]+$`
- **Prevents**: Malformed plugins from loading
- **File**: `src/core/plugin-loader.ts`

### ✅ Error Isolation

- **Status**: **IMPLEMENTED in v3.1.0** ✅
- **Behavior**: Failed plugin load doesn't crash CLI
- **Continues**: Loads other plugins, shows summary of failures
- **User Experience**: CLI remains usable even with broken plugins
- **File**: `src/cli/index.ts`, `src/core/plugin-loader.ts`

## Known Limitations (v3.1.0)

### ⏳ Version Compatibility Enforcement

- **Status**: Deferred to v3.2.0
- **Issue**: `metadata.requiredGeneratorVersion` field exists but is not validated
- **Impact**: Plugins can claim compatibility with any generator version
- **Mitigation**: Plugin developers should manually test compatibility
- **Planned Fix**: v3.2.0 will add semver validation during plugin loading
- **Tracking**: TODO comment in `src/core/plugin-loader.ts:343-344`

### ⏳ Plugin Load Order Determinism

- **Status**: Deferred to v3.2.0
- **Issue**: Plugins load in array order from config, no dependency resolution
- **Impact**: If plugin A depends on plugin B, config order matters
- **Mitigation**: Plugins should be independent; document any dependencies in README
- **Planned Fix**: v3.2.0 may add explicit `dependencies` field or ordering
- **Tracking**: Not yet specified

### ⏳ Eager Template Validation

- **Status**: Deferred to v3.2.0
- **Issue**: `TemplateRegistry.validateTemplatePath()` exists but isn't called during registration
- **Impact**: Invalid plugin templates detected when used, not when registered
- **Mitigation**: Manual testing of plugin templates before publishing
- **Planned Fix**: v3.2.0 will call validation automatically during `registerPlugin()`
- **Tracking**: TODO comment in `src/core/template-registry.ts:10`

### ⏳ Template Override Mechanism

- **Status**: Intentional limitation for v3.1.0
- **Issue**: `registerPlugin()` throws error if template type conflicts (by design)
- **Impact**: Cannot override or extend built-in templates
- **Rationale**: Ensures deterministic behavior and prevents accidental shadowing
- **Planned Fix**: v3.2.0+ may add CLI flag/config option for explicit overrides
- **Tracking**: Feature request, not a bug

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

Plugins are configured in `azmp-config.json` in the `plugins` array. The CLI automatically loads and initializes enabled plugins before parsing commands.

### Complete Configuration Example

```json
{
  "publisher": "My Company Inc.",
  "defaultOutputDir": "./output",
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
      "enabled": false,
      "options": {}
    }
  ]
}
```

### Configuration Fields

#### `package` (required)
- **Type**: `string`
- **Purpose**: Specifies the plugin location
- **npm packages**: `"azmp-compute-templates"` or `"@myorg/azmp-plugin"`
- **Local paths**: `"./plugins/my-plugin"` or `"/absolute/path/to/plugin"`
- **Security**: Local relative paths are validated against workspace root to prevent `../` traversal
- **Validation**: Must be non-empty string

#### `enabled` (optional)
- **Type**: `boolean`
- **Default**: `true`
- **Purpose**: Controls whether plugin is loaded
- **Use case**: Temporarily disable plugins without removing from config
- **Example**: Set to `false` during debugging

#### `options` (optional)
- **Type**: `object`
- **Default**: `{}`
- **Purpose**: Plugin-specific configuration passed to plugin during initialization
- **Access**: Available in `PluginContext.config.pluginOptions`
- **Validation**: Must be an object (not array or null)

### Plugin Loading Behavior

**Load Order:**
1. Config file is loaded and validated
2. Built-in commands registered (create, validate, package, config)
3. CommandRegistrar initialized with existing commands
4. Each enabled plugin processed in array order:
   - Module resolved (npm or local path)
   - Plugin instantiated and metadata validated
   - Plugin initialized with 5-second timeout
   - Templates registered in TemplateRegistry
   - Helpers registered in HelperRegistrar
   - Commands registered via CommandRegistrar
5. CLI proceeds to `program.parse()`

**Error Handling:**
- Failed plugin loads don't crash the CLI
- Errors collected and reported as warnings
- Other plugins continue to load
- CLI remains functional without failed plugins

**Validation Errors:**
The following config errors are detected during validation:
- `plugins` is not an array
- `package` is missing, empty, or not a string
- `enabled` is not a boolean
- `options` is not an object (e.g., array or null)

### Export Requirements

Plugins must export their class or instance using one of these patterns:

**Default export (recommended):**
```typescript
export default class MyPlugin implements IPlugin {
  // ...
}
```

**Named export:**
```typescript
export const plugin = new MyPlugin();
```

**Pre-instantiated export:**
```typescript
class MyPlugin implements IPlugin { /* ... */ }
export default new MyPlugin();
```

The plugin loader accepts:
- ✅ Default export of a class constructor
- ✅ Default export of a plugin instance
- ✅ Named export called `plugin`
- ❌ Multiple exports without `default` or `plugin` name

### Security Notes

**Local Path Plugins:**
- Relative paths (starting with `./` or `../`) are resolved against workspace root
- Paths are normalized to collapse `../` sequences
- Paths that escape workspace root are rejected with clear error
- Example blocked: `"../../etc/passwd"`
- Absolute paths are allowed but not validated (use with caution)

**npm Package Plugins:**
- Resolved using Node.js module resolution from `node_modules`
- Uses `createRequire()` to respect package boundaries
- Clear error if package not found: "npm package 'X' not found. Install it with: npm install X"

**Helper Name Restrictions:**
- Must match pattern: `^[a-zA-Z0-9_-]+$`
- Prevents code injection via helper names
- Invalid characters rejected before registration

**Conflict Detection:**
- Helper names must be unique across all plugins
- Command names and aliases must be unique
- Template types must be unique
- Conflicts cause descriptive errors during load

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

### Official Plugins

**azmp-plugin-vm** - Virtual Machine Plugin  
Repository: https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azmp-plugin-vm  
npm: `@hoiltd/azmp-plugin-vm`

A complete example plugin demonstrating:
- VM template generation with networking (VNet, NSG, Public IP)
- Custom Handlebars helpers (`vm-size`, `vm-image`, `vm-resource-name`)
- CLI commands (`vm list-sizes`, `vm list-images`)
- Comprehensive documentation and testing
- TypeScript implementation with full type safety

**Installation:**
```bash
npm install @hoiltd/azmp-plugin-vm
```

**Configuration:**
```json
{
  "plugins": [
    {
      "package": "@hoiltd/azmp-plugin-vm",
      "enabled": true,
      "options": {
        "defaultVmSize": "Standard_D2s_v3",
        "enableDiagnostics": true
      }
    }
  ]
}
```

**Local Development:**
```json
{
  "plugins": [
    {
      "package": "../azmp-plugin-vm",
      "enabled": true
    }
  ]
}
```

See the `examples/plugins/` directory for additional plugin examples:

- `basic-plugin` - Minimal plugin with one template
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
