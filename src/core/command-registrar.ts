/**
 * CLI Command Registrar
 * 
 * Manages registration of CLI commands from plugins with conflict detection.
 * Ensures command names and aliases don't conflict with existing commands.
 * 
 * @version 3.1.0
 * @since 3.1.0
 */

import { Command } from 'commander';
import { IPlugin } from './plugin';
import { getLogger } from '../utils/logger';

const logger = getLogger();

/**
 * CLI command registrar with conflict detection
 */
export class CommandRegistrar {
  private registeredCommands: Map<string, string> = new Map(); // commandName -> pluginId
  private registeredAliases: Map<string, string> = new Map(); // alias -> pluginId

  /**
   * Initialize registrar with existing commands from the program
   * 
   * @param program Commander program instance
   */
  public initialize(program: Command): void {
    // Track existing built-in commands
    const existingCommands = program.commands.map(cmd => cmd.name());
    for (const cmdName of existingCommands) {
      this.registeredCommands.set(cmdName, 'built-in');
      logger.debug(`Tracked built-in command: ${cmdName}`, 'command-registrar');
    }

    // Track existing aliases
    for (const cmd of program.commands) {
      const aliases = cmd.aliases();
      for (const alias of aliases) {
        this.registeredAliases.set(alias, 'built-in');
        logger.debug(`Tracked built-in alias: ${alias}`, 'command-registrar');
      }
    }
  }

  /**
   * Register CLI commands from a plugin
   * 
   * @param plugin Plugin instance
   * @param pluginId Plugin ID for error messages
   * @param program Commander program instance
   * @throws Error if command name or alias conflicts with existing command
   */
  public register(plugin: IPlugin, pluginId: string, program: Command): void {
    if (!plugin.registerCommands) {
      logger.debug(`Plugin '${pluginId}' provides no CLI commands`, 'command-registrar');
      return;
    }

    logger.info(`Registering CLI commands from plugin '${pluginId}'`, 'command-registrar');

    // Capture command count before registration
    const beforeCount = program.commands.length;

    try {
      // Let plugin register its commands
      plugin.registerCommands(program);

      // Check for conflicts with newly added commands
      const newCommands = program.commands.slice(beforeCount);

      for (const cmd of newCommands) {
        const cmdName = cmd.name();
        this.checkCommandConflict(cmdName, pluginId);
        this.registeredCommands.set(cmdName, pluginId);
        logger.debug(`Registered command '${cmdName}' from plugin '${pluginId}'`, 'command-registrar');

        // Check aliases
        const aliases = cmd.aliases();
        for (const alias of aliases) {
          this.checkAliasConflict(alias, pluginId);
          this.registeredAliases.set(alias, pluginId);
          logger.debug(`Registered alias '${alias}' from plugin '${pluginId}'`, 'command-registrar');
        }
      }

      if (newCommands.length === 0) {
        logger.warn(
          `Plugin '${pluginId}' called registerCommands() but added no commands`,
          'command-registrar'
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to register commands from plugin '${pluginId}': ${message}`
      );
    }
  }

  /**
   * Check if command name conflicts with existing command
   * 
   * @param commandName Command name to check
   * @param pluginId Plugin ID for error messages
   * @throws Error if command name already exists
   */
  private checkCommandConflict(commandName: string, pluginId: string): void {
    if (this.registeredCommands.has(commandName)) {
      const existingPlugin = this.registeredCommands.get(commandName);
      throw new Error(
        `Command name conflict: '${commandName}' from plugin '${pluginId}' ` +
        `conflicts with command from '${existingPlugin}'`
      );
    }
  }

  /**
   * Check if alias conflicts with existing alias or command
   * 
   * @param alias Alias to check
   * @param pluginId Plugin ID for error messages
   * @throws Error if alias already exists
   */
  private checkAliasConflict(alias: string, pluginId: string): void {
    // Check against existing aliases
    if (this.registeredAliases.has(alias)) {
      const existingPlugin = this.registeredAliases.get(alias);
      throw new Error(
        `Command alias conflict: '${alias}' from plugin '${pluginId}' ` +
        `conflicts with alias from '${existingPlugin}'`
      );
    }

    // Check against existing command names
    if (this.registeredCommands.has(alias)) {
      const existingPlugin = this.registeredCommands.get(alias);
      throw new Error(
        `Command alias conflict: '${alias}' from plugin '${pluginId}' ` +
        `conflicts with command name from '${existingPlugin}'`
      );
    }
  }

  /**
   * Check if a command name is already registered
   * 
   * @param commandName Command name to check
   * @returns True if command is registered
   */
  public hasCommand(commandName: string): boolean {
    return this.registeredCommands.has(commandName);
  }

  /**
   * Check if an alias is already registered
   * 
   * @param alias Alias to check
   * @returns True if alias is registered
   */
  public hasAlias(alias: string): boolean {
    return this.registeredAliases.has(alias);
  }

  /**
   * Get the plugin ID that registered a command
   * 
   * @param commandName Command name
   * @returns Plugin ID or undefined
   */
  public getCommandOwner(commandName: string): string | undefined {
    return this.registeredCommands.get(commandName);
  }

  /**
   * Get all registered command names
   * 
   * @returns Array of command names
   */
  public getAllCommandNames(): string[] {
    return Array.from(this.registeredCommands.keys());
  }

  /**
   * Get count of registered commands (excluding built-in)
   * 
   * @returns Number of plugin commands
   */
  public getPluginCommandCount(): number {
    let count = 0;
    for (const pluginId of this.registeredCommands.values()) {
      if (pluginId !== 'built-in') {
        count++;
      }
    }
    return count;
  }

  /**
   * Clear all registered commands (except built-in)
   * Used primarily for testing
   */
  public clear(): void {
    // Keep built-in commands, remove plugin commands
    const builtInCommands = new Map<string, string>();
    const builtInAliases = new Map<string, string>();

    for (const [name, pluginId] of this.registeredCommands.entries()) {
      if (pluginId === 'built-in') {
        builtInCommands.set(name, pluginId);
      }
    }

    for (const [alias, pluginId] of this.registeredAliases.entries()) {
      if (pluginId === 'built-in') {
        builtInAliases.set(alias, pluginId);
      }
    }

    this.registeredCommands = builtInCommands;
    this.registeredAliases = builtInAliases;
    logger.debug('Cleared plugin command registrations', 'command-registrar');
  }
}

/**
 * Global command registrar instance
 */
export const commandRegistrar = new CommandRegistrar();
