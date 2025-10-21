/**
 * Template Registry for Azure Marketplace Generator
 * 
 * Manages the registration and discovery of template types, including both
 * built-in templates and those provided by plugins.
 * 
 * @version 3.0.0
 * @since 3.0.0
 * 
 * TODO(v3.1.0): Add eager template validation
 * - Call validateTemplatePath() automatically during registerPlugin()
 * - Fail fast if plugin templates are missing required files
 * - Add configuration option to skip validation for development
 */

import { TemplateMetadata, IPlugin, HandlebarsHelper } from './plugin';
import * as path from 'path';
import * as fs from 'fs-extra';

/**
 * Template Registry manages all available template types
 */
export class TemplateRegistry {
  private templates: Map<string, TemplateMetadata> = new Map();
  private plugins: Map<string, IPlugin> = new Map();
  private helpers: Map<string, { pluginId: string; helper: HandlebarsHelper }> = new Map();
  private commands: Map<string, string> = new Map(); // commandName -> pluginId

  /**
   * Register a built-in template
   * 
   * @param metadata Template metadata
   */
  public registerTemplate(metadata: TemplateMetadata): void {
    if (this.templates.has(metadata.type)) {
      throw new Error(`Template type '${metadata.type}' is already registered`);
    }
    this.templates.set(metadata.type, metadata);
  }

  /**
   * Register a plugin and its templates
   * 
   * @param plugin Plugin instance
   * @throws Error if plugin ID, template type, helper name, or command name conflicts
   */
  public registerPlugin(plugin: IPlugin): void {
    const pluginId = plugin.metadata.id;
    
    if (this.plugins.has(pluginId)) {
      throw new Error(`Plugin '${pluginId}' is already registered`);
    }

    // Check for template conflicts
    const templates = plugin.getTemplates?.() || [];
    for (const template of templates) {
      if (this.templates.has(template.type)) {
        throw new Error(
          `Template type '${template.type}' from plugin '${pluginId}' conflicts with existing template`
        );
      }
    }

    // Check for helper name conflicts (BLOCKER FIX)
    const helpers = plugin.getHandlebarsHelpers?.() || {};
    for (const helperName of Object.keys(helpers)) {
      if (this.helpers.has(helperName)) {
        const existing = this.helpers.get(helperName);
        const existingPlugin = existing ? existing.pluginId : 'built-in';
        throw new Error(
          `Handlebars helper '${helperName}' from plugin '${pluginId}' conflicts with helper from '${existingPlugin}'`
        );
      }
    }

    // Register plugin
    this.plugins.set(pluginId, plugin);

    // Register templates
    for (const template of templates) {
      this.templates.set(template.type, template);
    }

    // Register helpers
    for (const [helperName, helper] of Object.entries(helpers)) {
      this.helpers.set(helperName, { pluginId, helper });
    }
  }

  /**
   * Get template metadata by type
   * 
   * @param type Template type
   * @returns Template metadata or undefined if not found
   */
  public getTemplate(type: string): TemplateMetadata | undefined {
    return this.templates.get(type);
  }

  /**
   * Get all registered templates
   * 
   * @returns Array of all template metadata
   */
  public getAllTemplates(): TemplateMetadata[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get all registered template types
   * 
   * @returns Array of template type identifiers
   */
  public getTemplateTypes(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Check if a template type exists
   * 
   * @param type Template type
   * @returns True if template exists
   */
  public hasTemplate(type: string): boolean {
    return this.templates.has(type);
  }

  /**
   * Get plugin by ID
   * 
   * @param id Plugin ID
   * @returns Plugin instance or undefined
   */
  public getPlugin(id: string): IPlugin | undefined {
    return this.plugins.get(id);
  }

  /**
   * Get all registered plugins
   * 
   * @returns Array of plugin instances
   */
  public getAllPlugins(): IPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get all registered Handlebars helpers
   * 
   * @returns Map of helper names to helper functions
   */
  public getAllHelpers(): Map<string, HandlebarsHelper> {
    const result = new Map<string, HandlebarsHelper>();
    for (const [name, { helper }] of this.helpers.entries()) {
      result.set(name, helper);
    }
    return result;
  }

  /**
   * Register a command name to prevent conflicts
   * Called by plugin loader when registering CLI commands
   * 
   * @param commandName Command name being registered
   * @param pluginId Plugin ID registering the command
   * @throws Error if command name already exists
   */
  public registerCommand(commandName: string, pluginId: string): void {
    if (this.commands.has(commandName)) {
      const existingPlugin = this.commands.get(commandName);
      throw new Error(
        `CLI command '${commandName}' from plugin '${pluginId}' conflicts with command from '${existingPlugin}'`
      );
    }
    this.commands.set(commandName, pluginId);
  }

  /**
   * Check if a command name is already registered
   * 
   * @param commandName Command name to check
   * @returns True if command exists
   */
  public hasCommand(commandName: string): boolean {
    return this.commands.has(commandName);
  }

  /**
   * Validate that a template directory exists
   * 
   * @param templatesDir Base templates directory
   * @param templatePath Relative template path
   * @returns True if template directory exists and is valid
   */
  public async validateTemplatePath(
    templatesDir: string,
    templatePath: string
  ): Promise<boolean> {
    const fullPath = path.join(templatesDir, templatePath);
    
    try {
      const stats = await fs.stat(fullPath);
      if (!stats.isDirectory()) {
        return false;
      }

      // Check for required template files
      const requiredFiles = [
        'mainTemplate.json.hbs',
        'createUiDefinition.json.hbs'
      ];

      for (const file of requiredFiles) {
        const filePath = path.join(fullPath, file);
        if (!await fs.pathExists(filePath)) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear all registered templates and plugins
   * Used primarily for testing
   */
  public clear(): void {
    this.templates.clear();
    this.plugins.clear();
    this.helpers.clear();
    this.commands.clear();
  }

  /**
   * Get templates by tag
   * 
   * @param tag Tag to filter by
   * @returns Array of matching template metadata
   */
  public getTemplatesByTag(tag: string): TemplateMetadata[] {
    return Array.from(this.templates.values()).filter(
      template => template.tags?.includes(tag)
    );
  }

  /**
   * Search templates by keyword
   * 
   * @param keyword Keyword to search for in name/description
   * @returns Array of matching template metadata
   */
  public searchTemplates(keyword: string): TemplateMetadata[] {
    const lowerKeyword = keyword.toLowerCase();
    return Array.from(this.templates.values()).filter(
      template =>
        template.name.toLowerCase().includes(lowerKeyword) ||
        template.description.toLowerCase().includes(lowerKeyword) ||
        template.type.toLowerCase().includes(lowerKeyword)
    );
  }
}

/**
 * Global template registry instance
 * This is the singleton registry used throughout the application
 */
export const templateRegistry = new TemplateRegistry();
