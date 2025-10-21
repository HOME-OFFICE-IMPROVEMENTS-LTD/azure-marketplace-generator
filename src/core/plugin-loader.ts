/**
 * Plugin Loader with Lifecycle Management
 * 
 * Handles plugin initialization with timeout protection and ensures
 * cleanup is called on process exit. Supports dynamic plugin loading
 * from npm packages and local paths with security validation.
 * 
 * @version 3.1.0
 * @since 3.0.0
 */

import { IPlugin, PluginContext, PluginConfig } from './plugin';
import { templateRegistry } from './template-registry';
import { helperRegistrar } from './helper-registrar';
import { commandRegistrar } from './command-registrar';
import { getLogger } from '../utils/logger';
import { Command } from 'commander';
import { createRequire } from 'module';
import * as path from 'path';
import * as fs from 'fs-extra';

const logger = getLogger();

/**
 * Plugin initialization timeout in milliseconds
 * Prevents hung plugins from blocking the CLI
 */
const PLUGIN_INIT_TIMEOUT_MS = 5000; // 5 seconds

/**
 * Plugin loader with lifecycle management
 */
export class PluginLoader {
  private loadedPlugins: Set<string> = new Set();
  private cleanupRegistered = false;

  /**
   * Load plugins from configuration
   * 
   * @param configs Array of plugin configurations
   * @param context Plugin context
   * @param program Commander program instance
   * @returns Array of successfully loaded plugin IDs
   */
  public async loadPluginsFromConfig(
    configs: PluginConfig[],
    context: PluginContext,
    program: Command
  ): Promise<string[]> {
    const loadedPluginIds: string[] = [];
    const errors: Array<{ package: string; error: string }> = [];

    logger.info(`Loading ${configs.length} plugin(s) from configuration`, 'plugin-loader');

    for (const config of configs) {
      // Skip disabled plugins
      const enabled = config.enabled ?? true; // Default to true
      if (!enabled) {
        logger.info(`Skipping disabled plugin: ${config.package}`, 'plugin-loader');
        continue;
      }

      try {
        // Resolve and load module
        const pluginModule = await this.resolveModule(config.package);
        
        // Instantiate plugin
        const plugin = this.instantiatePlugin(pluginModule, config.package);
        
        // Validate plugin metadata
        this.validatePluginMetadata(plugin, config.package);
        
        // Initialize with plugin-specific options
        const pluginContext: PluginContext = {
          ...context,
          config: { ...context.config, pluginOptions: config.options ?? {} }
        };
        
        await this.initializePlugin(plugin, pluginContext);
        
        // Register helpers
        helperRegistrar.register(plugin, plugin.metadata.id);
        
        // Register CLI commands
        commandRegistrar.register(plugin, plugin.metadata.id, program);
        
        loadedPluginIds.push(plugin.metadata.id);
        logger.info(`Successfully loaded plugin: ${plugin.metadata.id}`, 'plugin-loader');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Failed to load plugin '${config.package}': ${message}`, 'plugin-loader');
        errors.push({ package: config.package, error: message });
        
        // Continue with other plugins (error isolation)
        // Don't let one bad plugin crash the entire CLI
      }
    }

    // Log summary
    if (errors.length > 0) {
      logger.warn(
        `Loaded ${loadedPluginIds.length}/${configs.length} plugins (${errors.length} failed)`,
        'plugin-loader'
      );
      for (const { package: pkg, error } of errors) {
        logger.warn(`  - ${pkg}: ${error}`, 'plugin-loader');
      }
    } else {
      logger.info(`All ${loadedPluginIds.length} plugins loaded successfully`, 'plugin-loader');
    }

    return loadedPluginIds;
  }

  /**
   * Resolve and load a plugin module
   * Handles both npm packages and local file paths with security validation
   * 
   * @param packageName npm package name or local file path
   * @returns Loaded module (type is unknown until validated)
   * @throws Error if module cannot be resolved or loaded
   */
  private async resolveModule(packageName: string): Promise<unknown> {
    logger.debug(`Resolving plugin module: ${packageName}`, 'plugin-loader');

    // Determine if this is a local path or npm package
    const isLocalPath = packageName.startsWith('.') || packageName.startsWith('/');

    if (isLocalPath) {
      return this.loadLocalModule(packageName);
    } else {
      return this.loadNpmModule(packageName);
    }
  }

  /**
   * Load a local plugin module with path traversal protection
   * 
   * @param relativePath Relative or absolute path to plugin
   * @returns Loaded module (type is unknown until validated)
   * @throws Error if path is invalid or module cannot be loaded
   */
  private async loadLocalModule(relativePath: string): Promise<unknown> {
    const workspaceRoot = process.cwd();
    
    // Resolve to absolute path
    const absolutePath = path.isAbsolute(relativePath)
      ? relativePath
      : path.resolve(workspaceRoot, relativePath);
    
    // Normalize to collapse ../ sequences
    const normalizedPath = path.normalize(absolutePath);
    
    // Security: Ensure path doesn't escape workspace root (for relative paths)
    if (!path.isAbsolute(relativePath) && !normalizedPath.startsWith(workspaceRoot)) {
      throw new Error(
        `Security violation: Plugin path '${relativePath}' attempts to escape workspace root. ` +
        `Normalized path '${normalizedPath}' is outside '${workspaceRoot}'`
      );
    }
    
    // Check if path exists
    if (!await fs.pathExists(normalizedPath)) {
      throw new Error(`Plugin path does not exist: ${normalizedPath}`);
    }
    
    // Check if it's a file (must be .js or .ts)
    const stats = await fs.stat(normalizedPath);
    let modulePath = normalizedPath;
    
    if (stats.isDirectory()) {
      // Try to find index.js or index.ts
      const indexJs = path.join(normalizedPath, 'index.js');
      const indexTs = path.join(normalizedPath, 'index.ts');
      
      if (await fs.pathExists(indexJs)) {
        modulePath = indexJs;
      } else if (await fs.pathExists(indexTs)) {
        throw new Error(
          `Found TypeScript file at ${indexTs} but expected compiled JavaScript. ` +
          `Please build the plugin before loading.`
        );
      } else {
        throw new Error(
          `Plugin directory '${normalizedPath}' must contain index.js entrypoint`
        );
      }
    } else if (!modulePath.endsWith('.js')) {
      throw new Error(
        `Plugin file '${modulePath}' must be a .js file (compiled JavaScript). ` +
        `TypeScript plugins must be built before loading.`
      );
    }
    
    // Load module using dynamic import
    logger.debug(`Loading local plugin from: ${modulePath}`, 'plugin-loader');
    
    try {
      // Convert to file:// URL for import()
      const fileUrl = `file://${modulePath}`;
      const module = await import(fileUrl);
      return module;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to import local plugin '${modulePath}': ${message}`);
    }
  }

  /**
   * Load an npm package plugin module
   * 
   * @param packageName npm package name
   * @returns Loaded module (type is unknown until validated)
   * @throws Error if package cannot be found or loaded
   */
  private async loadNpmModule(packageName: string): Promise<unknown> {
    logger.debug(`Loading npm plugin: ${packageName}`, 'plugin-loader');
    
    try {
      // Use createRequire to resolve npm package path
      // This respects node_modules resolution from the loader's location
      const require = createRequire(__filename);
      
      try {
        // Resolve package to absolute path
        const resolvedPath = require.resolve(packageName);
        logger.debug(`Resolved npm package to: ${resolvedPath}`, 'plugin-loader');
        
        // Load using dynamic import
        const fileUrl = `file://${resolvedPath}`;
        const module = await import(fileUrl);
        return module;
      } catch {
        // Package not found - provide helpful error
        throw new Error(
          `npm package '${packageName}' not found. ` +
          `Install it with: npm install ${packageName}`
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load npm plugin '${packageName}': ${message}`);
    }
  }

  /**
   * Instantiate a plugin from a loaded module
   * Handles both default exports and named exports
   * 
   * @param module Loaded module (unknown type until validated)
   * @param packageName Package name for error messages
   * @returns Plugin instance
   * @throws Error if module doesn't export a valid plugin
   */
  private instantiatePlugin(module: unknown, packageName: string): IPlugin {
    logger.debug(`Instantiating plugin from: ${packageName}`, 'plugin-loader');
    
    // Type guard: ensure module is an object
    if (!module || typeof module !== 'object') {
      throw new Error(
        `Module '${packageName}' must export an object. Got ${typeof module}`
      );
    }
    
    // Try to find plugin export
    const moduleObj = module as Record<string, unknown>;
    const PluginClass = moduleObj.default || moduleObj.plugin || module;
    
    // If it's not a constructor or object, error
    if (!PluginClass) {
      throw new Error(
        `Module '${packageName}' must export a plugin class or object. ` +
        `Use 'export default class MyPlugin' or 'export const plugin = new MyPlugin()'`
      );
    }
    
    // If it's already an instance (object with metadata), return it
    if (typeof PluginClass === 'object' && 'metadata' in PluginClass) {
      logger.debug(`Using pre-instantiated plugin from: ${packageName}`, 'plugin-loader');
      return PluginClass as IPlugin;
    }
    
    // If it's a constructor, instantiate it
    if (typeof PluginClass === 'function') {
      try {
        logger.debug(`Instantiating plugin class from: ${packageName}`, 'plugin-loader');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const instance = new (PluginClass as any)();
        return instance as IPlugin;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Failed to instantiate plugin class from '${packageName}': ${message}`
        );
      }
    }
    
    throw new Error(
      `Module '${packageName}' exports invalid plugin. ` +
      `Must be a class constructor or object implementing IPlugin interface.`
    );
  }

  /**
   * Validate plugin metadata has required fields
   * 
   * @param plugin Plugin instance
   * @param packageName Package name for error messages
   * @throws Error if metadata is invalid
   */
  private validatePluginMetadata(plugin: IPlugin, packageName: string): void {
    if (!plugin.metadata) {
      throw new Error(`Plugin '${packageName}' missing required metadata object`);
    }
    
    const { metadata } = plugin;
    const requiredFields = ['id', 'name', 'version'];
    
    for (const field of requiredFields) {
      if (!(field in metadata) || !metadata[field as keyof typeof metadata]) {
        throw new Error(
          `Plugin '${packageName}' missing required metadata.${field}`
        );
      }
    }
    
    // Validate ID format (alphanumeric, hyphen, underscore)
    const idPattern = /^[a-zA-Z0-9_-]+$/;
    if (!idPattern.test(metadata.id)) {
      throw new Error(
        `Plugin '${packageName}' has invalid metadata.id '${metadata.id}'. ` +
        `Must match pattern ${idPattern.toString()}`
      );
    }
    
    // TODO: Add semver validation for metadata.version
    // TODO: Add version compatibility check for metadata.requiredGeneratorVersion
    
    logger.debug(
      `Validated plugin metadata: ${metadata.id}@${metadata.version}`,
      'plugin-loader'
    );
  }

  /**
   * Initialize a plugin with timeout protection
   * 
   * @param plugin Plugin instance to initialize
   * @param context Plugin context
   * @throws Error if initialization times out or fails
   */
  public async initializePlugin(
    plugin: IPlugin,
    context: PluginContext
  ): Promise<void> {
    const pluginId = plugin.metadata.id;

    if (this.loadedPlugins.has(pluginId)) {
      logger.warn(`Plugin '${pluginId}' already initialized`, 'plugin-loader');
      return;
    }

    logger.info(`Initializing plugin: ${pluginId}`, 'plugin-loader');

    try {
      // Register the plugin first to detect conflicts early
      templateRegistry.registerPlugin(plugin);

      // Initialize with timeout protection
      if (plugin.initialize) {
        await this.withTimeout(
          plugin.initialize(context),
          PLUGIN_INIT_TIMEOUT_MS,
          `Plugin '${pluginId}' initialization timed out after ${PLUGIN_INIT_TIMEOUT_MS}ms`
        );
      }

      this.loadedPlugins.add(pluginId);
      logger.info(`Plugin '${pluginId}' initialized successfully`, 'plugin-loader');

      // Register cleanup handler on first plugin load
      if (!this.cleanupRegistered) {
        this.registerCleanupHandlers();
        this.cleanupRegistered = true;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to initialize plugin '${pluginId}': ${message}`, 'plugin-loader');
      throw new Error(`Plugin '${pluginId}' initialization failed: ${message}`);
    }
  }

  /**
   * Execute a promise with timeout
   * 
   * @param promise Promise to execute
   * @param timeoutMs Timeout in milliseconds
   * @param timeoutError Error message if timeout occurs
   * @returns Promise result
   * @throws Error if timeout occurs
   */
  private async withTimeout<T>(
    promise: Promise<T> | void,
    timeoutMs: number,
    timeoutError: string
  ): Promise<T | void> {
    if (!promise) {
      return;
    }

    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(timeoutError)), timeoutMs)
      ),
    ]);
  }

  /**
   * Register process cleanup handlers
   * Ensures plugin cleanup is called on normal exit and crashes
   */
  private registerCleanupHandlers(): void {
    const cleanup = async () => {
      logger.info('Running plugin cleanup...', 'plugin-loader');
      await this.cleanupAllPlugins();
    };

    // Normal exit
    process.on('exit', () => {
      // Note: async cleanup not possible in 'exit' event
      // We rely on beforeExit for async cleanup
      logger.debug('Process exiting', 'plugin-loader');
    });

    // Async cleanup before exit
    process.on('beforeExit', async () => {
      await cleanup();
    });

    // Ctrl+C
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, cleaning up...', 'plugin-loader');
      await cleanup();
      process.exit(0);
    });

    // Terminal closed
    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, cleaning up...', 'plugin-loader');
      await cleanup();
      process.exit(0);
    });

    // Uncaught exceptions
    process.on('uncaughtException', async (error) => {
      logger.error(`Uncaught exception: ${error.message}`, 'plugin-loader', { error });
      await cleanup();
      process.exit(1);
    });

    // Unhandled promise rejections
    process.on('unhandledRejection', async (reason) => {
      logger.error('Unhandled rejection', 'plugin-loader', { reason });
      await cleanup();
      process.exit(1);
    });

    logger.debug('Plugin cleanup handlers registered', 'plugin-loader');
  }

  /**
   * Cleanup all loaded plugins
   * Calls cleanup() on each plugin with timeout protection
   */
  private async cleanupAllPlugins(): Promise<void> {
    const plugins = templateRegistry.getAllPlugins();

    for (const plugin of plugins) {
      const pluginId = plugin.metadata.id;

      if (!plugin.cleanup) {
        continue;
      }

      try {
        logger.debug(`Cleaning up plugin: ${pluginId}`, 'plugin-loader');
        await this.withTimeout(
          plugin.cleanup(),
          2000, // 2 second timeout for cleanup
          `Plugin '${pluginId}' cleanup timed out`
        );
        logger.debug(`Plugin '${pluginId}' cleaned up`, 'plugin-loader');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.warn(`Plugin '${pluginId}' cleanup failed: ${message}`, 'plugin-loader');
        // Continue cleaning up other plugins even if one fails
      }
    }

    this.loadedPlugins.clear();
  }

  /**
   * Get the number of loaded plugins
   * 
   * @returns Number of plugins currently loaded
   */
  public getLoadedPluginCount(): number {
    return this.loadedPlugins.size;
  }

  /**
   * Check if a plugin is loaded
   * 
   * @param pluginId Plugin ID
   * @returns True if plugin is loaded
   */
  public isPluginLoaded(pluginId: string): boolean {
    return this.loadedPlugins.has(pluginId);
  }
}

/**
 * Global plugin loader instance
 */
export const pluginLoader = new PluginLoader();
