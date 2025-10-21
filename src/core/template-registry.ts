/**
 * Template Registry for Azure Marketplace Generator
 * 
 * Manages the registration and discovery of template types, including both
 * built-in templates and those provided by plugins.
 * 
 * @version 3.0.0
 * @since 3.0.0
 */

import { TemplateMetadata, IPlugin } from './plugin';
import * as path from 'path';
import * as fs from 'fs-extra';

/**
 * Template Registry manages all available template types
 */
export class TemplateRegistry {
  private templates: Map<string, TemplateMetadata> = new Map();
  private plugins: Map<string, IPlugin> = new Map();

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
   */
  public registerPlugin(plugin: IPlugin): void {
    const pluginId = plugin.metadata.id;
    
    if (this.plugins.has(pluginId)) {
      throw new Error(`Plugin '${pluginId}' is already registered`);
    }

    this.plugins.set(pluginId, plugin);

    // Register templates from plugin
    const templates = plugin.getTemplates?.() || [];
    for (const template of templates) {
      if (this.templates.has(template.type)) {
        throw new Error(
          `Template type '${template.type}' from plugin '${pluginId}' conflicts with existing template`
        );
      }
      this.templates.set(template.type, template);
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
