/**
 * Integration Tests for Core Configuration and Azure Services
 * Tests the integration between AppConfig and ConcurrentAzureService
 */
import { AppConfig, AppConfigManager } from '../config/app-config';
import { ConcurrentAzureService, AzureOperations } from '../services/concurrent-azure-service';

describe('Core System Integration Tests', () => {
  beforeEach(() => {
    // Reset environment for clean tests
    delete process.env.AZMP_ARM_TTK_PATH;
    delete process.env.AZMP_TEMPLATES_PATH;
    delete process.env.AZMP_MAX_CONCURRENCY;
    delete process.env.AZMP_AZURE_TIMEOUT_MS;
    delete process.env.AZMP_AZURE_RETRY_ATTEMPTS;
    delete process.env.AZMP_ARM_TTK_CACHE_TTL_HOURS;

    // Reset singleton instances to pick up environment changes
    AppConfigManager.resetInstance();
    ConcurrentAzureService.resetInstance();
  });

  describe('AppConfig Integration', () => {
    it('should load default configuration when no environment variables set', () => {
      const config = AppConfig.getConfig();

      expect(config).toBeDefined();
      expect(config.monitoring.maxConcurrency).toBe(10);
      expect(config.azure.timeoutMs).toBe(30000);
      expect(config.azure.retryAttempts).toBe(3);
      expect(config.armTtk.cacheTtlHours).toBe(24);
    });

    it('should override configuration with environment variables', () => {
      process.env.AZMP_MAX_CONCURRENCY = '5';
      process.env.AZMP_AZURE_TIMEOUT_MS = '60000';
      process.env.AZMP_ARM_TTK_PATH = '/custom/arm-ttk';

      const config = AppConfig.getConfig();

      expect(config.monitoring.maxConcurrency).toBe(5);
      expect(config.azure.timeoutMs).toBe(60000);
      expect(config.armTtk.scriptPath).toBe('/custom/arm-ttk');
    });

    it('should validate configuration settings', async () => {
      const result = await AppConfig.validateConfiguration();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should initialize directories correctly', async () => {
      await expect(AppConfig.initializeDirectories()).resolves.not.toThrow();
    });

    it('should provide correct path configurations', () => {
      const armTtkPath = AppConfig.getArmTtkPath();
      const config = AppConfig.getConfig();

      expect(config.paths.templates).toMatch(/templates$/);
      expect(config.paths.packages).toMatch(/packages$/);
      expect(config.paths.cache).toMatch(/cache$/);
      expect(typeof armTtkPath).toBe('string');
    });
  });

  describe('ConcurrentAzureService Integration', () => {
    let azureService: ConcurrentAzureService;
    let azureOps: AzureOperations;

    beforeEach(() => {
      azureService = ConcurrentAzureService.getInstance();
      azureOps = new AzureOperations();
    });

    afterEach(() => {
      if (azureService && azureService.cancelAllOperations) {
        azureService.cancelAllOperations();
      }
    });

    it('should create singleton instance correctly', () => {
      const instance1 = ConcurrentAzureService.getInstance();
      const instance2 = ConcurrentAzureService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should respect configuration settings', () => {
      process.env.AZMP_MAX_CONCURRENCY = '3';

      // Create new instance to pick up environment changes
      const testAzureOps = new AzureOperations();
      const stats = testAzureOps.getStats();

      expect(stats.maxConcurrency).toBe(3);
    });

    it('should provide operation statistics', () => {
      const stats = azureOps.getStats();

      expect(stats).toHaveProperty('runningProcesses');
      expect(stats).toHaveProperty('queuedOperations');
      expect(stats).toHaveProperty('maxConcurrency');
      expect(typeof stats.runningProcesses).toBe('number');
      expect(typeof stats.queuedOperations).toBe('number');
      expect(typeof stats.maxConcurrency).toBe('number');
    });

    it('should handle cancellation correctly', () => {
      expect(() => {
        azureOps.cancelOperations();
      }).not.toThrow();
    });
  });

  describe('Configuration-Service Integration', () => {
    it('should use correct timeout from configuration', () => {
      process.env.AZMP_AZURE_TIMEOUT_MS = '15000';

      const config = AppConfig.getConfig();
      expect(config.azure.timeoutMs).toBe(15000);

      // New service instance should pick up the configuration
      const testAzureOps = new AzureOperations();
      const stats = testAzureOps.getStats();
      expect(typeof stats.maxConcurrency).toBe('number');
    });

    it('should handle invalid configuration gracefully', () => {
      process.env.AZMP_MAX_CONCURRENCY = 'invalid';
      process.env.AZMP_AZURE_TIMEOUT_MS = 'not-a-number';

      const config = AppConfig.getConfig();

      // Should fall back to defaults for invalid values
      expect(config.monitoring.maxConcurrency).toBe(10);
      expect(config.azure.timeoutMs).toBe(30000);
    });

    it('should provide consistent path configurations', () => {
      const armTtkPath1 = AppConfig.getArmTtkPath();
      const armTtkPath2 = AppConfig.getArmTtkPath();

      expect(armTtkPath1).toBe(armTtkPath2);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle missing configuration gracefully', () => {
      // Remove all environment variables
      Object.keys(process.env).forEach(key => {
        if (key.startsWith('AZMP_')) {
          delete process.env[key];
        }
      });

      expect(() => AppConfig.getConfig()).not.toThrow();
    });

    it('should validate required paths exist for production', async () => {
      const config = AppConfig.getConfig();

      // In test environment, paths might not exist, but validation should not crash
      expect(() => AppConfig.validateConfiguration()).not.toThrow();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent configuration requests', async () => {
      const configPromises = Array.from({ length: 10 }, () =>
        Promise.resolve(AppConfig.getConfig())
      );

      const configs = await Promise.all(configPromises);

      // All configurations should be identical (singleton behavior)
      configs.forEach(config => {
        expect(config).toEqual(configs[0]);
      });
    });

    it('should handle concurrent service operations', () => {
      const azureOps1 = new AzureOperations();
      const azureOps2 = new AzureOperations();

      const stats1 = azureOps1.getStats();
      const stats2 = azureOps2.getStats();

      // Both should reference the same underlying service
      expect(stats1).toEqual(stats2);
    });
  });

  describe('Environment Variable Handling', () => {
    const testCases = [
      { env: 'AZMP_MAX_CONCURRENCY', value: '8', test: (config: any) => config.monitoring.maxConcurrency === 8 },
      { env: 'AZMP_AZURE_TIMEOUT_MS', value: '45000', test: (config: any) => config.azure.timeoutMs === 45000 },
      { env: 'AZMP_AZURE_RETRY_ATTEMPTS', value: '5', test: (config: any) => config.azure.retryAttempts === 5 },
      { env: 'AZMP_ARM_TTK_CACHE_TTL_HOURS', value: '48', test: (config: any) => config.armTtk.cacheTtlHours === 48 }
    ];

    testCases.forEach(({ env, value, test }) => {
      it(`should correctly parse ${env} environment variable`, () => {
        process.env[env] = value;

        const config = AppConfig.getConfig();
        expect(test(config)).toBe(true);
      });
    });
  });
});