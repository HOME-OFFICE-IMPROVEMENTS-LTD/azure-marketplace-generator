import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { getLogger } from './logger';
import { PluginConfig } from '../core/plugin';

const logger = getLogger();

/**
 * Configuration structure for azmp.config.json
 */
export interface AzmpConfig {
  publisher?: string;
  defaultOutputDir?: string;
  templates?: {
    storage?: {
      name?: string;
      location?: string;
    };
  };
  validation?: {
    saveReport?: boolean;
    reportPath?: string;
  };
  packaging?: {
    defaultFileName?: string;
  };
  /**
   * Plugin configuration (v3.1.0+)
   * Array of plugins to load with their configuration
   */
  plugins?: PluginConfig[];
}

/**
 * Configuration manager for loading and validating azmp.config.json
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: AzmpConfig | null = null;
  private configPath: string | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Load configuration from file
   */
  async loadConfig(customPath?: string): Promise<AzmpConfig | null> {
    try {
      // Try custom path first
      if (customPath) {
        logger.debug('Attempting to load config from custom path', 'config', { path: customPath });
        if (await fs.pathExists(customPath)) {
          return await this.readConfigFile(customPath);
        }
        logger.warn(`Custom config path not found: ${customPath}`, 'config');
        return null;
      }

      // Search for config in current directory and parent directories
      const configLocations = [
        path.join(process.cwd(), 'azmp.config.json'),
        path.join(process.cwd(), '.azmp', 'config.json'),
        path.join(process.cwd(), '..', 'azmp.config.json'),
      ];

      logger.debug('Searching for config file', 'config', { locations: configLocations });

      for (const location of configLocations) {
        if (await fs.pathExists(location)) {
          logger.debug(`Found config file at: ${location}`, 'config');
          return await this.readConfigFile(location);
        }
      }

      logger.debug('No config file found', 'config');
      return null;
    } catch (error) {
      logger.warn('Error loading config file', 'config', { error });
      console.warn(chalk.yellow('⚠️  Failed to load config file'));
      return null;
    }
  }

  /**
   * Read and parse config file
   */
  private async readConfigFile(filePath: string): Promise<AzmpConfig> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const config = JSON.parse(content) as AzmpConfig;
      
      logger.info(`Loaded config from: ${filePath}`, 'config');
      console.log(chalk.blue('📄 Loaded configuration from:'), chalk.gray(filePath));
      
      this.config = config;
      this.configPath = filePath;
      
      return config;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to parse config file: ${message}`, 'config', { filePath });
      throw new Error(`Invalid config file format: ${message}`);
    }
  }

  /**
   * Get current config
   */
  getConfig(): AzmpConfig | null {
    return this.config;
  }

  /**
   * Get config path
   */
  getConfigPath(): string | null {
    return this.configPath;
  }

  /**
   * Merge CLI options with config file
   */
  mergeWithCliOptions<T extends Record<string, unknown>>(
    cliOptions: T,
    configDefaults: Partial<T>
  ): T {
    const merged = { ...configDefaults };
    
    // CLI options override config file
    for (const key in cliOptions) {
      if (cliOptions[key] !== undefined) {
        merged[key] = cliOptions[key];
      }
    }
    
    logger.debug('Merged CLI options with config', 'config', { 
      cliOptions, 
      configDefaults, 
      merged 
    });
    
    return merged as T;
  }

  /**
   * Create a sample config file
   */
  async createSampleConfig(outputPath: string = './azmp.config.json'): Promise<void> {
    const sampleConfig: AzmpConfig = {
      publisher: "My Company Inc.",
      defaultOutputDir: "./output",
      templates: {
        storage: {
          name: "My Storage Solution",
          location: "eastus"
        }
      },
      validation: {
        saveReport: false,
        reportPath: "./validation-report.txt"
      },
      packaging: {
        defaultFileName: "my-app-package.zip"
      },
      plugins: [
        // Example plugin configuration (disabled by default)
        // Uncomment to enable plugin support in v3.1.0+
        // {
        //   package: "azmp-compute-templates",
        //   enabled: false,
        //   options: {}
        // }
      ]
    };

    try {
      await fs.writeFile(
        outputPath,
        JSON.stringify(sampleConfig, null, 2),
        'utf-8'
      );
      logger.success(`Created sample config at: ${outputPath}`, 'config');
      console.log(chalk.green('✅ Created sample configuration file:'), outputPath);
      console.log(chalk.gray('\nEdit this file to customize default values for your project.'));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to create sample config: ${message}`, 'config');
      throw new Error(`Failed to create sample config: ${message}`);
    }
  }

  /**
   * Validate config structure
   */
  validateConfig(config: AzmpConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate publisher name length
    if (config.publisher && config.publisher.length > 100) {
      errors.push('Publisher name exceeds 100 characters');
    }

    // Validate output directory is not absolute
    if (config.defaultOutputDir && path.isAbsolute(config.defaultOutputDir)) {
      errors.push('defaultOutputDir should be a relative path');
    }

    // Validate packaging file name ends with .zip
    if (config.packaging?.defaultFileName && 
        !config.packaging.defaultFileName.toLowerCase().endsWith('.zip')) {
      errors.push('Packaging defaultFileName must end with .zip');
    }

    if (errors.length > 0) {
      logger.warn('Config validation failed', 'config', { errors });
    } else {
      logger.debug('Config validation passed', 'config');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Reset config (for testing)
   */
  reset(): void {
    this.config = null;
    this.configPath = null;
  }
}

/**
 * Convenience function to get config manager instance
 */
export function getConfigManager(): ConfigManager {
  return ConfigManager.getInstance();
}
