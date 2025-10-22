/**
 * Handlebars Helper Registrar
 * 
 * Manages registration of Handlebars helpers from plugins with conflict detection.
 * Ensures helper names follow naming conventions and prevents duplicate registrations.
 * 
 * @version 3.1.0
 * @since 3.1.0
 */

import * as Handlebars from 'handlebars';
import { IPlugin, HandlebarsHelper } from './plugin';
import { getLogger } from '../utils/logger';

const logger = getLogger();

/**
 * Helper name validation pattern
 * Allows: letters, numbers, underscore, hyphen, colon (for namespaces), dot (for sub-namespaces)
 * Examples: "myHelper", "vm-size", "net:vnet.template", "security:policy.rule"
 */
const HELPER_NAME_PATTERN = /^[a-zA-Z0-9_:.-]+$/;

/**
 * Handlebars helper registrar with conflict detection
 */
export class HelperRegistrar {
  private registeredHelpers: Map<string, string> = new Map(); // helperName -> pluginId

  /**
   * Register Handlebars helpers from a plugin
   * 
   * @param plugin Plugin instance
   * @param pluginId Plugin ID for error messages
   * @throws Error if helper name is invalid or conflicts with existing helper
   */
  public register(plugin: IPlugin, pluginId: string): void {
    const helpers = plugin.getHandlebarsHelpers?.() || {};
    const helperNames = Object.keys(helpers);

    if (helperNames.length === 0) {
      logger.debug(`Plugin '${pluginId}' provides no Handlebars helpers`, 'helper-registrar');
      return;
    }

    logger.info(`Registering ${helperNames.length} helper(s) from plugin '${pluginId}'`, 'helper-registrar');

    for (const [helperName, helperFn] of Object.entries(helpers)) {
      this.validateHelperName(helperName, pluginId);
      this.checkConflict(helperName, pluginId);
      this.registerHelper(helperName, helperFn, pluginId);
    }
  }

  /**
   * Validate helper name follows naming conventions
   * 
   * @param helperName Helper name to validate
   * @param pluginId Plugin ID for error messages
   * @throws Error if helper name is invalid
   */
  private validateHelperName(helperName: string, pluginId: string): void {
    if (!helperName || typeof helperName !== 'string') {
      throw new Error(
        `Invalid helper name from plugin '${pluginId}': must be a non-empty string`
      );
    }

    if (!HELPER_NAME_PATTERN.test(helperName)) {
      throw new Error(
        `Invalid helper name '${helperName}' from plugin '${pluginId}': ` +
        `must match pattern ${HELPER_NAME_PATTERN.toString()}`
      );
    }
  }

  /**
   * Check if helper name conflicts with existing helper
   * 
   * @param helperName Helper name to check
   * @param pluginId Plugin ID for error messages
   * @throws Error if helper name already exists
   */
  private checkConflict(helperName: string, pluginId: string): void {
    if (this.registeredHelpers.has(helperName)) {
      const existingPlugin = this.registeredHelpers.get(helperName);
      throw new Error(
        `Helper name conflict: '${helperName}' from plugin '${pluginId}' ` +
        `conflicts with helper from plugin '${existingPlugin}'`
      );
    }
  }

  /**
   * Register helper with Handlebars and track registration
   * 
   * @param helperName Helper name
   * @param helperFn Helper function
   * @param pluginId Plugin ID for tracking
   */
  private registerHelper(
    helperName: string,
    helperFn: HandlebarsHelper,
    pluginId: string
  ): void {
    try {
      Handlebars.registerHelper(helperName, helperFn);
      this.registeredHelpers.set(helperName, pluginId);
      logger.debug(`Registered helper '${helperName}' from plugin '${pluginId}'`, 'helper-registrar');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to register helper '${helperName}' from plugin '${pluginId}': ${message}`
      );
    }
  }

  /**
   * Check if a helper name is already registered
   * 
   * @param helperName Helper name to check
   * @returns True if helper is registered
   */
  public hasHelper(helperName: string): boolean {
    return this.registeredHelpers.has(helperName);
  }

  /**
   * Get the plugin ID that registered a helper
   * 
   * @param helperName Helper name
   * @returns Plugin ID or undefined
   */
  public getHelperOwner(helperName: string): string | undefined {
    return this.registeredHelpers.get(helperName);
  }

  /**
   * Get all registered helper names
   * 
   * @returns Array of helper names
   */
  public getAllHelperNames(): string[] {
    return Array.from(this.registeredHelpers.keys());
  }

  /**
   * Get count of registered helpers
   * 
   * @returns Number of helpers
   */
  public getHelperCount(): number {
    return this.registeredHelpers.size;
  }

  /**
   * Clear all registered helpers
   * Used primarily for testing
   */
  public clear(): void {
    // Note: Handlebars doesn't provide unregisterHelper, so we can't remove them
    // We just clear our tracking map
    this.registeredHelpers.clear();
    logger.debug('Cleared helper registration tracking', 'helper-registrar');
  }
}

/**
 * Global helper registrar instance
 */
export const helperRegistrar = new HelperRegistrar();
