/**
 * Application Configuration Manager
 * Centralizes all configuration with environment variable support
 */
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import { AzureKeyVaultService, createKeyVaultService, DEFAULT_SECRET_NAMES } from '../services/azure-keyvault-service';

export interface AppConfigSettings {
  // ARM-TTK Configuration
  armTtk: {
    scriptPath: string;
    cacheTtlHours: number;
  };

  // Paths Configuration
  paths: {
    packages: string;
    templates: string;
    cache: string;
    temp: string;
  };

  // Azure Configuration
  azure: {
    defaultRegion: string;
    timeoutMs: number;
    retryAttempts: number;
  };

  // Monitoring Configuration
  monitoring: {
    intervalMinutes: number;
    maxConcurrency: number;
    healthCheckTimeoutMs: number;
  };

  // Packaging Configuration
  packaging: {
    maxSizeMB: number;
    qualityThreshold: number;
    compressionLevel: number;
  };

  // Azure Key Vault
  keyVaultUrl?: string;
  useKeyVault?: boolean;

  // Organization
  organizationName?: string;
  defaultPublisher?: string;
}

class AppConfigManager {
  private static instance: AppConfigManager;
  private config: AppConfigSettings;
  private isTestEnvironment: boolean;

  private constructor() {
    this.isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
    this.config = this.loadConfiguration();
  }

  static getInstance(): AppConfigManager {
    if (!AppConfigManager.instance) {
      AppConfigManager.instance = new AppConfigManager();
    }
    return AppConfigManager.instance;
  }

  /**
   * Reset the singleton instance (for testing purposes only)
   */
  static resetInstance(): void {
    AppConfigManager.instance = null as any;
  }

  /**
   * Reload configuration from environment variables (useful for tests)
   */
  reloadConfiguration(): void {
    this.config = this.loadConfiguration();
  }

  private loadConfiguration(): AppConfigSettings {
    // Default configuration
    const defaultConfig: AppConfigSettings = {
      armTtk: {
        scriptPath: this.resolveArmTtkPath(),
        cacheTtlHours: 24
      },
      paths: {
        packages: path.join(process.cwd(), 'packages'),
        templates: path.join(process.cwd(), 'templates'),
        cache: path.join(require('os').homedir(), '.azmp', 'cache'),
        temp: path.join(require('os').tmpdir(), 'azmp')
      },
      azure: {
        defaultRegion: 'eastus',
        timeoutMs: 30000,
        retryAttempts: 3
      },
      monitoring: {
        intervalMinutes: 5,
        maxConcurrency: 10,
        healthCheckTimeoutMs: 5000
      },
      packaging: {
        maxSizeMB: 100,
        qualityThreshold: 70,
        compressionLevel: 6
      },
      // Azure Key Vault Configuration
      keyVaultUrl: process.env.AZURE_KEYVAULT_URL,
      useKeyVault: process.env.AZURE_KEYVAULT_URL !== undefined,
      // Organization Configuration
      organizationName: process.env.AZMP_ORGANIZATION_NAME || 'HOME-OFFICE-IMPROVEMENTS-LTD',
      defaultPublisher: process.env.AZMP_DEFAULT_PUBLISHER || 'HOME-OFFICE-IMPROVEMENTS-LTD'
    };

    // Override with environment variables
    const config = { ...defaultConfig };

    // ARM-TTK configuration
    if (process.env.AZMP_ARM_TTK_PATH) {
      config.armTtk.scriptPath = process.env.AZMP_ARM_TTK_PATH;
    }
    if (process.env.AZMP_ARM_TTK_CACHE_TTL_HOURS) {
      const parsed = parseInt(process.env.AZMP_ARM_TTK_CACHE_TTL_HOURS);
      if (!isNaN(parsed)) {
        config.armTtk.cacheTtlHours = parsed;
      }
    }

    // Path configuration
    if (process.env.AZMP_PACKAGES_PATH) {
      config.paths.packages = process.env.AZMP_PACKAGES_PATH;
    }
    if (process.env.AZMP_TEMPLATES_PATH) {
      config.paths.templates = process.env.AZMP_TEMPLATES_PATH;
    }
    if (process.env.AZMP_CACHE_PATH) {
      config.paths.cache = process.env.AZMP_CACHE_PATH;
    }
    if (process.env.AZMP_TEMP_PATH) {
      config.paths.temp = process.env.AZMP_TEMP_PATH;
    }

    // Azure configuration
    if (process.env.AZMP_DEFAULT_REGION) {
      config.azure.defaultRegion = process.env.AZMP_DEFAULT_REGION;
    }
    if (process.env.AZMP_AZURE_TIMEOUT_MS) {
      const parsed = parseInt(process.env.AZMP_AZURE_TIMEOUT_MS);
      if (!isNaN(parsed)) {
        config.azure.timeoutMs = parsed;
      }
    }
    if (process.env.AZMP_AZURE_RETRY_ATTEMPTS) {
      const parsed = parseInt(process.env.AZMP_AZURE_RETRY_ATTEMPTS);
      if (!isNaN(parsed)) {
        config.azure.retryAttempts = parsed;
      }
    }

    // Monitoring configuration
    if (process.env.AZMP_MONITOR_INTERVAL) {
      const parsed = parseInt(process.env.AZMP_MONITOR_INTERVAL);
      if (!isNaN(parsed)) {
        config.monitoring.intervalMinutes = parsed;
      }
    }
    if (process.env.AZMP_MAX_CONCURRENCY) {
      const parsed = parseInt(process.env.AZMP_MAX_CONCURRENCY);
      if (!isNaN(parsed)) {
        config.monitoring.maxConcurrency = parsed;
      }
    }
    if (process.env.AZMP_HEALTH_CHECK_TIMEOUT) {
      const parsed = parseInt(process.env.AZMP_HEALTH_CHECK_TIMEOUT);
      if (!isNaN(parsed)) {
        config.monitoring.healthCheckTimeoutMs = parsed;
      }
    }

    // Packaging configuration
    if (process.env.AZMP_MAX_PACKAGE_SIZE) {
      config.packaging.maxSizeMB = parseInt(process.env.AZMP_MAX_PACKAGE_SIZE);
    }
    if (process.env.AZMP_QUALITY_THRESHOLD) {
      config.packaging.qualityThreshold = parseInt(process.env.AZMP_QUALITY_THRESHOLD);
    }

    return config;
  }

  private resolveArmTtkPath(): string {
    // Try multiple common locations for ARM-TTK
    const possiblePaths = [
      // Environment variable (highest priority)
      process.env.AZMP_ARM_TTK_PATH,
      // Current workspace
      path.join(process.cwd(), 'arm-ttk', 'arm-ttk', 'Test-AzTemplate.ps1'),
      // User home directory
      path.join(require('os').homedir(), 'tools', 'arm-ttk', 'arm-ttk', 'Test-AzTemplate.ps1'),
      // Global installation paths
      '/usr/local/share/arm-ttk/arm-ttk/Test-AzTemplate.ps1',
      '/opt/arm-ttk/arm-ttk/Test-AzTemplate.ps1',
      // Windows paths
      'C:\\tools\\arm-ttk\\arm-ttk\\Test-AzTemplate.ps1',
      'C:\\Program Files\\arm-ttk\\arm-ttk\\Test-AzTemplate.ps1',
      // Developer workspace (fallback)
      '/home/msalsouri/tools/arm-ttk/arm-ttk/Test-AzTemplate.ps1'
    ].filter(Boolean) as string[];

    for (const possiblePath of possiblePaths) {
      try {
        if (fs.pathExistsSync(possiblePath)) {
          return possiblePath;
        }
      } catch (error) {
        // Continue checking other paths
      }
    }

    // If no ARM-TTK found, return a sensible default and let the validator handle the error
    return path.join(process.cwd(), 'arm-ttk', 'arm-ttk', 'Test-AzTemplate.ps1');
  }

  getConfig(): AppConfigSettings {
    // In test environment, always reload configuration to pick up env var changes
    if (this.isTestEnvironment) {
      this.reloadConfiguration();
    }
    return { ...this.config };
  }

  getArmTtkPath(): string {
    return this.config.armTtk.scriptPath;
  }

  getPackagesDir(): string {
    return this.config.paths.packages;
  }

  getTemplatesDir(): string {
    return this.config.paths.templates;
  }

  getCacheDir(): string {
    return this.config.paths.cache;
  }

  getTempDir(): string {
    return this.config.paths.temp;
  }

  updateConfig(updates: Partial<AppConfigSettings>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Initialize required directories
   */
  async initializeDirectories(): Promise<void> {
    const dirs = [
      this.config.paths.packages,
      this.config.paths.cache,
      this.config.paths.temp
    ];

    for (const dir of dirs) {
      await fs.ensureDir(dir);
    }
  }

  /**
   * Validate configuration and ARM-TTK availability
   */
  async validateConfiguration(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check ARM-TTK availability
    try {
      if (!await fs.pathExists(this.config.armTtk.scriptPath)) {
        errors.push(`ARM-TTK script not found at: ${this.config.armTtk.scriptPath}`);
        errors.push('Set AZMP_ARM_TTK_PATH environment variable or install ARM-TTK');
      }
    } catch (error) {
      errors.push(`Failed to check ARM-TTK path: ${error instanceof Error ? error.message : error}`);
    }

    // Validate directory permissions
    for (const [name, dir] of Object.entries(this.config.paths)) {
      try {
        await fs.ensureDir(dir as string);
        await fs.access(dir as string, fs.constants.W_OK);
      } catch (error) {
        errors.push(`Cannot write to ${name} directory: ${dir}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get Azure Key Vault service instance if configured
   */
  getKeyVaultService(): AzureKeyVaultService | null {
    if (!this.config.useKeyVault || !this.config.keyVaultUrl) {
      return null;
    }

    return createKeyVaultService();
  }

  /**
   * Get organization configuration
   */
  getOrganizationConfig() {
    return {
      name: this.config.organizationName || 'HOME-OFFICE-IMPROVEMENTS-LTD',
      defaultPublisher: this.config.defaultPublisher || 'HOME-OFFICE-IMPROVEMENTS-LTD'
    };
  }

  /**
   * Check if Key Vault is configured and available
   */
  async isKeyVaultAvailable(): Promise<boolean> {
    const keyVaultService = this.getKeyVaultService();
    if (!keyVaultService) {
      return false;
    }

    try {
      // Try to get a known secret to verify connectivity
      // Using microsoft-graph-tenant-id as it exists in mobot-keyvault-mpn
      await keyVaultService.getSecret('microsoft-graph-tenant-id');
      return true;
    } catch (error) {
      console.warn('Key Vault not available:', error instanceof Error ? error.message : error);
      return false;
    }
  }
}

export const AppConfig = AppConfigManager.getInstance();
export { AppConfigManager };
export default AppConfig;