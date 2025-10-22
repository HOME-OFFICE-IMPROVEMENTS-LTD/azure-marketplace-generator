# API Reference

Complete TypeScript API reference for the Azure Marketplace Generator core library and plugin development.

## Table of Contents

1. [Core API](#core-api)
2. [Plugin API](#plugin-api)
3. [Template Generator API](#template-generator-api)
4. [Validator API](#validator-api)
5. [Type Definitions](#type-definitions)

## Core API

### Generator Class

Main class for generating Azure Marketplace templates.

```typescript
import { Generator } from '@hoiltd/azure-marketplace-generator';

class Generator {
  constructor(options?: GeneratorOptions);
  
  async generate(config: TemplateConfig): Promise<GeneratedOutput>;
  async validate(templatePath: string): Promise<ValidationResult>;
  async package(inputPath: string, outputPath: string): Promise<void>;
  
  loadPlugin(plugin: AzmpPlugin): void;
  getPlugins(): AzmpPlugin[];
}
```

#### Constructor

```typescript
const generator = new Generator({
  outputDir: './output',
  verbose: true,
  plugins: ['@hoiltd/azmp-plugin-vm']
});
```

**Options:**

```typescript
interface GeneratorOptions {
  outputDir?: string;        // Output directory (default: './output')
  verbose?: boolean;         // Enable verbose logging (default: false)
  plugins?: string[];        // Plugin names to load
  templatePath?: string;     // Custom template directory
  configPath?: string;       // Config file path
}
```

#### generate()

Generate templates from configuration.

```typescript
const output = await generator.generate({
  resourceType: 'storage',
  name: 'MyStorage',
  publisher: 'Acme Inc',
  parameters: {
    location: 'eastus',
    sku: 'Standard_LRS'
  }
});

console.log(output.files); // Array of generated files
```

**Parameters:**

```typescript
interface TemplateConfig {
  resourceType: string;      // Resource type (storage, vm, etc.)
  name: string;              // Application name
  publisher: string;         // Publisher name
  description?: string;      // Application description
  parameters?: Record<string, any>; // Template parameters
  outputDir?: string;        // Override output directory
}
```

**Returns:**

```typescript
interface GeneratedOutput {
  files: GeneratedFile[];    // Generated template files
  metadata: OutputMetadata;  // Generation metadata
}

interface GeneratedFile {
  path: string;              // File path relative to output directory
  content: string;           // File content
  type: FileType;            // File type (template, ui, view, nested)
}

interface OutputMetadata {
  timestamp: Date;           // Generation timestamp
  version: string;           // Generator version
  resourceType: string;      // Resource type
  pluginUsed?: string;       // Plugin name if used
}
```

#### validate()

Validate ARM templates using ARM-TTK.

```typescript
const result = await generator.validate('./output');

if (result.valid) {
  console.log('✓ All templates valid');
} else {
  console.error('✗ Validation errors:', result.errors);
}
```

**Parameters:**
- `templatePath: string` - Path to template file or directory

**Returns:**

```typescript
interface ValidationResult {
  valid: boolean;            // Overall validation status
  errors: ValidationError[]; // Array of errors
  warnings: ValidationWarning[]; // Array of warnings
  passedTests: string[];     // Names of passed tests
  skippedTests: string[];    // Names of skipped tests
}

interface ValidationError {
  message: string;           // Error message
  file: string;              // File with error
  line?: number;             // Line number (if applicable)
  test: string;              // Test that failed
}

interface ValidationWarning {
  message: string;           // Warning message
  file: string;              // File with warning
  test: string;              // Test that produced warning
}
```

#### package()

Create deployment package (ZIP file).

```typescript
await generator.package('./output', './app.zip');
console.log('✓ Package created: app.zip');
```

**Parameters:**
- `inputPath: string` - Path to templates directory
- `outputPath: string` - Path for output ZIP file

**Returns:** `Promise<void>`

**Throws:** `Error` if validation fails (unless disabled)

#### loadPlugin()

Manually load a plugin.

```typescript
import vmPlugin from '@hoiltd/azmp-plugin-vm';

generator.loadPlugin(vmPlugin);
```

**Parameters:**
- `plugin: AzmpPlugin` - Plugin object

#### getPlugins()

Get list of loaded plugins.

```typescript
const plugins = generator.getPlugins();
plugins.forEach(plugin => {
  console.log(`${plugin.name} v${plugin.version}`);
  console.log(`Resource types: ${plugin.resourceTypes.join(', ')}`);
});
```

**Returns:** `AzmpPlugin[]` - Array of loaded plugins

## Plugin API

### AzmpPlugin Interface

```typescript
interface AzmpPlugin {
  // Required metadata
  name: string;              // Plugin package name
  version: string;           // Semantic version
  resourceTypes: string[];   // Supported resource types
  
  // Optional metadata
  description?: string;      // Human-readable description
  author?: string;           // Plugin author
  repository?: string;       // Repository URL
  
  // Template configuration
  templatePath?: string;     // Path to Handlebars templates
  
  // CLI integration
  commands?: PluginCommand[]; // CLI commands
  
  // Lifecycle hooks
  onLoad?(): void | Promise<void>;
  onUnload?(): void | Promise<void>;
  
  // Custom logic
  validate?(options: PluginOptions): ValidationResult;
  generate?(options: PluginOptions): Promise<GeneratedFiles>;
  transform?(template: any, options: PluginOptions): any;
}
```

### PluginOptions Interface

Options passed to plugin methods.

```typescript
interface PluginOptions {
  name: string;              // Application name
  publisher: string;         // Publisher name
  description?: string;      // Application description
  outputDir: string;         // Output directory
  parameters: Record<string, any>; // Template parameters
  config: any;               // User configuration
}
```

### PluginCommand Interface

Define CLI commands in plugins.

```typescript
interface PluginCommand {
  name: string;              // Command name (e.g., 'vm')
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
  type?: 'string' | 'number' | 'boolean' | 'array';
  choices?: string[];        // Valid choices
  validate?: (value: any) => boolean | string;
}

interface CommandResult {
  success: boolean;          // Command success status
  message?: string;          // Success/error message
  data?: any;                // Result data
}
```

### Example Plugin Implementation

```typescript
import { AzmpPlugin, PluginOptions, ValidationResult } from '@hoiltd/azure-marketplace-generator';

const myPlugin: AzmpPlugin = {
  name: '@mycompany/azmp-plugin-myresource',
  version: '1.0.0',
  description: 'MyResource managed applications',
  resourceTypes: ['myresource'],
  templatePath: './templates',
  
  commands: [
    {
      name: 'myresource',
      description: 'Create MyResource application',
      options: [
        {
          name: 'name',
          alias: 'n',
          description: 'Application name',
          required: true,
          type: 'string'
        },
        {
          name: 'sku',
          alias: 's',
          description: 'SKU tier',
          type: 'string',
          choices: ['Basic', 'Standard', 'Premium'],
          default: 'Standard'
        }
      ],
      action: async (options) => {
        // Command implementation
        return {
          success: true,
          message: `Created MyResource: ${options.name}`
        };
      }
    }
  ],
  
  validate: (options: PluginOptions): ValidationResult => {
    const errors: string[] = [];
    
    if (!options.name) {
      errors.push('name is required');
    }
    
    if (options.name && !/^[a-z0-9-]+$/i.test(options.name)) {
      errors.push('name must be alphanumeric with hyphens only');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings: []
    };
  },
  
  generate: async (options: PluginOptions) => {
    // Custom generation logic
    const mainTemplate = generateMainTemplate(options);
    const uiDefinition = generateUiDefinition(options);
    
    return {
      files: [
        { path: 'mainTemplate.json', content: mainTemplate },
        { path: 'createUiDefinition.json', content: uiDefinition }
      ]
    };
  },
  
  onLoad: async () => {
    console.log('MyResource plugin loaded');
  }
};

export default myPlugin;
```

## Template Generator API

### TemplateGenerator Class

Generate ARM templates from Handlebars templates.

```typescript
import { TemplateGenerator } from '@hoiltd/azure-marketplace-generator';

class TemplateGenerator {
  constructor(templateDir: string);
  
  async render(templateName: string, data: any): Promise<string>;
  registerHelper(name: string, fn: Function): void;
  registerPartial(name: string, template: string): void;
}
```

#### render()

Render a Handlebars template.

```typescript
const generator = new TemplateGenerator('./templates');

const output = await generator.render('mainTemplate.json.hbs', {
  name: 'MyApp',
  location: 'eastus',
  parameters: {
    storageAccountName: 'mystorageacct123'
  }
});

console.log(output); // Rendered JSON template
```

#### registerHelper()

Register custom Handlebars helper.

```typescript
generator.registerHelper('uppercase', (str: string) => {
  return str.toUpperCase();
});

// Usage in template: {{uppercase name}}
```

#### registerPartial()

Register reusable template partial.

```typescript
generator.registerPartial('commonParams', `
  "location": {
    "type": "string",
    "defaultValue": "[resourceGroup().location]"
  }
`);

// Usage in template: {{> commonParams}}
```

## Validator API

### Validator Class

Validate ARM templates using ARM-TTK.

```typescript
import { Validator } from '@hoiltd/azure-marketplace-generator';

class Validator {
  constructor(options?: ValidatorOptions);
  
  async validate(path: string): Promise<ValidationResult>;
  async isArmTtkInstalled(): Promise<boolean>;
  async installArmTtk(): Promise<void>;
}
```

#### validate()

Validate templates at path.

```typescript
const validator = new Validator({
  skipTests: ['outputs-must-not-contain-secrets'],
  verbose: true
});

const result = await validator.validate('./output');

if (!result.valid) {
  result.errors.forEach(error => {
    console.error(`${error.file}: ${error.message}`);
  });
}
```

**Options:**

```typescript
interface ValidatorOptions {
  skipTests?: string[];      // Tests to skip
  onlyTests?: string[];      // Only run these tests
  verbose?: boolean;         // Verbose output
}
```

#### isArmTtkInstalled()

Check if ARM-TTK is installed.

```typescript
const installed = await validator.isArmTtkInstalled();

if (!installed) {
  console.log('Installing ARM-TTK...');
  await validator.installArmTtk();
}
```

#### installArmTtk()

Install ARM-TTK from GitHub.

```typescript
await validator.installArmTtk();
console.log('✓ ARM-TTK installed');
```

## Type Definitions

### FileType Enum

```typescript
enum FileType {
  MainTemplate = 'mainTemplate',
  CreateUiDefinition = 'createUiDefinition',
  ViewDefinition = 'viewDefinition',
  NestedTemplate = 'nestedTemplate',
  Configuration = 'configuration'
}
```

### ResourceType Type

```typescript
type ResourceType = 
  | 'storage'
  | 'vm'
  | 'sql'
  | 'cosmosdb'
  | string; // Custom types from plugins
```

### ParameterType Type

```typescript
type ParameterType =
  | 'string'
  | 'int'
  | 'bool'
  | 'object'
  | 'array'
  | 'secureString'
  | 'secureObject';
```

### ArmParameter Interface

ARM template parameter definition.

```typescript
interface ArmParameter {
  type: ParameterType;
  defaultValue?: any;
  allowedValues?: any[];
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  metadata?: {
    description?: string;
    [key: string]: any;
  };
}
```

### ArmResource Interface

ARM template resource definition.

```typescript
interface ArmResource {
  type: string;              // Resource type (e.g., Microsoft.Storage/storageAccounts)
  apiVersion: string;        // API version
  name: string;              // Resource name (can be expression)
  location?: string;         // Resource location
  sku?: {
    name: string;
    tier?: string;
  };
  properties?: Record<string, any>;
  dependsOn?: string[];      // Resource dependencies
  tags?: Record<string, string>;
}
```

### ArmTemplate Interface

Complete ARM template structure.

```typescript
interface ArmTemplate {
  $schema: string;
  contentVersion: string;
  parameters?: Record<string, ArmParameter>;
  variables?: Record<string, any>;
  resources: ArmResource[];
  outputs?: Record<string, ArmOutput>;
}

interface ArmOutput {
  type: ParameterType;
  value: any;                // Can be expression
  condition?: boolean;       // Optional condition
}
```

## Utility Functions

### Helper Functions

```typescript
// Validate resource name
import { validateResourceName } from '@hoiltd/azure-marketplace-generator/utils';

const isValid = validateResourceName('my-storage-123');
// Returns: true

// Generate unique resource name
import { generateResourceName } from '@hoiltd/azure-marketplace-generator/utils';

const name = generateResourceName('storage', { prefix: 'acme' });
// Returns: 'acmestorage1234567890'

// Parse semver version
import { parseSemver } from '@hoiltd/azure-marketplace-generator/utils';

const version = parseSemver('1.2.3-beta.1');
// Returns: { major: 1, minor: 2, patch: 3, prerelease: 'beta.1' }
```

## Error Handling

### Error Classes

```typescript
// Base error class
class AzmpError extends Error {
  constructor(message: string, code?: string);
  code?: string;
}

// Validation error
class ValidationError extends AzmpError {
  constructor(message: string, file?: string, line?: number);
  file?: string;
  line?: number;
}

// Plugin error
class PluginError extends AzmpError {
  constructor(message: string, pluginName: string);
  pluginName: string;
}

// Template error
class TemplateError extends AzmpError {
  constructor(message: string, templatePath: string);
  templatePath: string;
}
```

### Example Error Handling

```typescript
import { Generator, ValidationError, PluginError } from '@hoiltd/azure-marketplace-generator';

try {
  const generator = new Generator();
  await generator.generate({
    resourceType: 'storage',
    name: 'MyStorage',
    publisher: 'Acme'
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(`Validation failed in ${error.file}: ${error.message}`);
  } else if (error instanceof PluginError) {
    console.error(`Plugin error in ${error.pluginName}: ${error.message}`);
  } else {
    console.error(`Unexpected error: ${error.message}`);
  }
}
```

## Advanced Usage

### Custom Template Engine

```typescript
import { TemplateEngine } from '@hoiltd/azure-marketplace-generator';

class CustomEngine extends TemplateEngine {
  async render(template: string, data: any): Promise<string> {
    // Custom rendering logic
    return processTemplate(template, data);
  }
}

const generator = new Generator({
  templateEngine: new CustomEngine()
});
```

### Plugin Composition

```typescript
// Create a meta-plugin that combines multiple plugins
const metaPlugin: AzmpPlugin = {
  name: '@mycompany/azmp-plugin-suite',
  version: '1.0.0',
  resourceTypes: ['web', 'api', 'database'],
  
  onLoad: async () => {
    // Load sub-plugins
    const webPlugin = await import('@mycompany/azmp-plugin-web');
    const apiPlugin = await import('@mycompany/azmp-plugin-api');
    const dbPlugin = await import('@mycompany/azmp-plugin-database');
    
    // Register sub-plugins
    generator.loadPlugin(webPlugin);
    generator.loadPlugin(apiPlugin);
    generator.loadPlugin(dbPlugin);
  }
};
```

## TypeScript Declarations

For TypeScript projects, import type definitions:

```typescript
import type {
  AzmpPlugin,
  GeneratorOptions,
  TemplateConfig,
  ValidationResult,
  PluginCommand
} from '@hoiltd/azure-marketplace-generator';
```

Full type definitions are included in the npm package at:
```
node_modules/@hoiltd/azure-marketplace-generator/dist/types/
```

## Next Steps

- **[Plugin Development](Plugin-Development)** - Create custom plugins
- **[CLI Reference](CLI-Reference)** - Command-line usage
- **[Examples](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azmp-examples)** - Code examples

---

**Have questions?** Ask in [GitHub Discussions](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/discussions)
