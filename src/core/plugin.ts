/**
 * Plugin Interface for Azure Marketplace Generator
 * 
 * This interface defines the contract for extending the generator with new template types,
 * custom Handlebars helpers, and additional CLI commands.
 * 
 * @version 3.0.0
 * @since 3.0.0
 */

import { Command } from 'commander';

/**
 * Template metadata describing a template type
 */
export interface TemplateMetadata {
  /** Unique identifier for the template (e.g., 'storage', 'compute', 'database') */
  type: string;
  
  /** Human-readable name for the template */
  name: string;
  
  /** Brief description of what the template does */
  description: string;
  
  /** Version of the template (semver format) */
  version: string;
  
  /** Path to the template directory (relative to templates root) */
  templatePath: string;
  
  /** Optional tags for categorization */
  tags?: string[];
  
  /** Optional link to documentation */
  documentationUrl?: string;
}

/**
 * Handlebars helper function type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any, no-unused-vars
export type HandlebarsHelper = (...args: any[]) => any;

/**
 * Main plugin interface that extensions must implement
 */
export interface IPlugin {
  /** Plugin metadata */
  readonly metadata: {
    /** Unique plugin identifier (e.g., 'azmp-compute-templates') */
    id: string;
    
    /** Plugin name */
    name: string;
    
    /** Plugin description */
    description: string;
    
    /** Plugin version (semver) */
    version: string;
    
    /** Plugin author */
    author?: string;
    
    /** Minimum required generator version */
    requiredGeneratorVersion?: string;
  };

  /**
   * Initialize the plugin
   * Called when the plugin is loaded
   * 
   * @param context Plugin initialization context
   */
  // eslint-disable-next-line no-unused-vars
  initialize?(context: PluginContext): void | Promise<void>;

  /**
   * Get templates provided by this plugin
   * 
   * @returns Array of template metadata
   */
  getTemplates?(): TemplateMetadata[];

  /**
   * Get custom Handlebars helpers provided by this plugin
   * 
   * @returns Object mapping helper names to helper functions
   */
  getHandlebarsHelpers?(): Record<string, HandlebarsHelper>;

  /**
   * Register custom CLI commands
   * 
   * @param program Commander.js program instance
   */
  // eslint-disable-next-line no-unused-vars
  registerCommands?(program: Command): void;

  /**
   * Cleanup when plugin is unloaded
   * Called when the generator shuts down
   */
  cleanup?(): void | Promise<void>;
}

/**
 * Context provided to plugins during initialization
 */
export interface PluginContext {
  /** Generator version */
  generatorVersion: string;
  
  /** Path to templates directory */
  templatesDir: string;
  
  /** Path to output directory */
  outputDir: string;
  
  /** Configuration object */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any;
  
  /** Logger function for plugin messages */
  logger: {
    // eslint-disable-next-line no-unused-vars
    info: (_message: string) => void;
    // eslint-disable-next-line no-unused-vars
    warn: (_message: string) => void;
    // eslint-disable-next-line no-unused-vars
    error: (_message: string) => void;
    // eslint-disable-next-line no-unused-vars
    debug: (_message: string) => void;
  };
}

/**
 * Plugin configuration in azmp-config.json
 */
export interface PluginConfig {
  /** Plugin package name or file path */
  package: string;
  
  /** Whether the plugin is enabled */
  enabled?: boolean;
  
  /** Plugin-specific configuration */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options?: Record<string, any>;
  
  // TODO(v3.1.0): Add path validation and normalization
  // - Sanitize PluginConfig.package to prevent path traversal (../)
  // - Whitelist allowed paths (e.g., node_modules, ~/.azmp/plugins)
  // - Document security considerations in PLUGIN_ARCHITECTURE.md
}

/**
 * Example plugin implementation (for documentation purposes)
 * 
 * @example
 * ```typescript
 * export class MyPlugin implements IPlugin {
 *   readonly metadata = {
 *     id: 'my-custom-plugin',
 *     name: 'My Custom Plugin',
 *     description: 'Adds custom templates',
 *     version: '1.0.0',
 *     author: 'Your Name'
 *   };
 * 
 *   initialize(context: PluginContext) {
 *     context.logger.info('MyPlugin initialized');
 *   }
 * 
 *   getTemplates(): TemplateMetadata[] {
 *     return [{
 *       type: 'mytemplate',
 *       name: 'My Template',
 *       description: 'Custom template',
 *       version: '1.0.0',
 *       templatePath: 'mytemplate'
 *     }];
 *   }
 * 
 *   getHandlebarsHelpers(): Record<string, HandlebarsHelper> {
 *     return {
 *       myHelper: (value: string) => value.toUpperCase()
 *     };
 *   }
 * }
 * ```
 */
export abstract class BasePlugin implements IPlugin {
  abstract readonly metadata: IPlugin['metadata'];

  // eslint-disable-next-line no-unused-vars
  initialize?(_context: PluginContext): void | Promise<void> {
    // Default: no-op
  }

  getTemplates?(): TemplateMetadata[] {
    return [];
  }

  getHandlebarsHelpers?(): Record<string, HandlebarsHelper> {
    return {};
  }

  // eslint-disable-next-line no-unused-vars
  registerCommands?(_program: Command): void {
    // Default: no commands
  }

  cleanup?(): void | Promise<void> {
    // Default: no cleanup
  }
}
