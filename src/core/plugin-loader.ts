/**
 * Plugin Loader with Lifecycle Management
 * 
 * Handles plugin initialization with timeout protection and ensures
 * cleanup is called on process exit.
 * 
 * @version 3.0.0
 * @since 3.0.0
 * 
 * TODO(v3.1.0): Implement dynamic plugin loading
 * - Load plugins from PluginConfig (npm packages and local paths)
 * - Validate and normalize paths (prevent ../ traversal)
 * - Add semver validation for metadata.requiredGeneratorVersion
 * - Implement plugin discovery from node_modules and config paths
 */

import { IPlugin, PluginContext } from './plugin';
import { templateRegistry } from './template-registry';
import { getLogger } from '../utils/logger';

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
