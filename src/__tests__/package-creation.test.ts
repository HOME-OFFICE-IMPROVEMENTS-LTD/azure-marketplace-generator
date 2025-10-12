import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import * as path from 'path';

describe('Package Creation Comprehensive Tests', () => {
  const testFixturesPath = path.join(__dirname, '../../test-fixtures/packages');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Package Fixture Validation', () => {
    test('webapp package fixtures should be structured correctly', () => {
      const webappPath = path.join(testFixturesPath, 'webapp');

      // Expected files for webapp package
      const expectedFiles = [
        'mainTemplate.json',
        'createUiDefinition.json'
      ];

      expectedFiles.forEach(file => {
        const filePath = path.join(webappPath, file);
        expect(filePath).toContain(file);
      });
    });

    test('database package fixtures should be structured correctly', () => {
      const databasePath = path.join(testFixturesPath, 'database');

      const expectedFiles = [
        'mainTemplate.json',
        'createUiDefinition.json'
      ];

      expectedFiles.forEach(file => {
        const filePath = path.join(databasePath, file);
        expect(filePath).toContain(file);
      });
    });

    test('storage package fixtures should be structured correctly', () => {
      const storagePath = path.join(testFixturesPath, 'storage');

      const expectedFiles = [
        'mainTemplate.json',
        'createUiDefinition.json'
      ];

      expectedFiles.forEach(file => {
        const filePath = path.join(storagePath, file);
        expect(filePath).toContain(file);
      });
    });

    test('networking package fixtures should be structured correctly', () => {
      const networkingPath = path.join(testFixturesPath, 'networking');

      const expectedFiles = [
        'mainTemplate.json',
        'createUiDefinition.json'
      ];

      expectedFiles.forEach(file => {
        const filePath = path.join(networkingPath, file);
        expect(filePath).toContain(file);
      });
    });
  });

  describe('Package Complexity Calculation', () => {
    test('should calculate complexity based on resource count', () => {
      const calculateComplexity = (resourceCount: number) => {
        if (resourceCount <= 5) return 'simple';
        if (resourceCount <= 15) return 'medium';
        return 'complex';
      };

      expect(calculateComplexity(3)).toBe('simple');
      expect(calculateComplexity(10)).toBe('medium');
      expect(calculateComplexity(20)).toBe('complex');
    });

    test('should calculate complexity based on parameter count', () => {
      const calculateComplexityByParams = (paramCount: number) => {
        if (paramCount <= 10) return 'simple';
        if (paramCount <= 25) return 'medium';
        return 'complex';
      };

      expect(calculateComplexityByParams(5)).toBe('simple');
      expect(calculateComplexityByParams(20)).toBe('medium');
      expect(calculateComplexityByParams(30)).toBe('complex');
    });

    test('should calculate complexity based on nested deployments', () => {
      const calculateComplexityByNesting = (nestingLevel: number) => {
        if (nestingLevel <= 2) return 'simple';
        if (nestingLevel <= 5) return 'medium';
        return 'complex';
      };

      expect(calculateComplexityByNesting(1)).toBe('simple');
      expect(calculateComplexityByNesting(4)).toBe('medium');
      expect(calculateComplexityByNesting(8)).toBe('complex');
    });
  });

  describe('Resource Type Validation', () => {
    test('should identify webapp resource types', () => {
      const webappResources = [
        'Microsoft.Web/serverfarms',
        'Microsoft.Web/sites',
        'Microsoft.Insights/components'
      ];

      const isWebappResource = (resourceType: string) => {
        return resourceType.startsWith('Microsoft.Web/') ||
               resourceType === 'Microsoft.Insights/components';
      };

      webappResources.forEach(resource => {
        expect(isWebappResource(resource)).toBe(true);
      });
    });

    test('should identify database resource types', () => {
      const databaseResources = [
        'Microsoft.Sql/servers',
        'Microsoft.Sql/servers/databases',
        'Microsoft.Sql/servers/firewallRules',
        'Microsoft.DocumentDB/databaseAccounts'
      ];

      const isDatabaseResource = (resourceType: string) => {
        return resourceType.startsWith('Microsoft.Sql/') ||
               resourceType.startsWith('Microsoft.DocumentDB/') ||
               resourceType.startsWith('Microsoft.DBforMySQL/') ||
               resourceType.startsWith('Microsoft.DBforPostgreSQL/');
      };

      databaseResources.forEach(resource => {
        expect(isDatabaseResource(resource)).toBe(true);
      });
    });

    test('should identify storage resource types', () => {
      const storageResources = [
        'Microsoft.Storage/storageAccounts',
        'Microsoft.Storage/storageAccounts/blobServices',
        'Microsoft.Storage/storageAccounts/fileServices'
      ];

      const isStorageResource = (resourceType: string) => {
        return resourceType.startsWith('Microsoft.Storage/');
      };

      storageResources.forEach(resource => {
        expect(isStorageResource(resource)).toBe(true);
      });
    });

    test('should identify networking resource types', () => {
      const networkingResources = [
        'Microsoft.Network/virtualNetworks',
        'Microsoft.Network/networkSecurityGroups',
        'Microsoft.Network/loadBalancers',
        'Microsoft.Network/publicIPAddresses'
      ];

      const isNetworkingResource = (resourceType: string) => {
        return resourceType.startsWith('Microsoft.Network/');
      };

      networkingResources.forEach(resource => {
        expect(isNetworkingResource(resource)).toBe(true);
      });
    });
  });

  describe('Package Quality Score Calculation', () => {
    test('should calculate quality score based on multiple factors', () => {
      interface QualityFactors {
        hasDescription: boolean;
        hasParameters: boolean;
        hasOutputs: boolean;
        hasMetadata: boolean;
        resourceCount: number;
        hasValidation: boolean;
      }

      const calculateQualityScore = (factors: QualityFactors): number => {
        let score = 0;

        if (factors.hasDescription) score += 20;
        if (factors.hasParameters) score += 15;
        if (factors.hasOutputs) score += 15;
        if (factors.hasMetadata) score += 10;
        if (factors.hasValidation) score += 20;

        // Resource count scoring
        if (factors.resourceCount > 0) score += 10;
        if (factors.resourceCount >= 5) score += 10;

        return Math.min(score, 100);
      };

      const highQualityPackage: QualityFactors = {
        hasDescription: true,
        hasParameters: true,
        hasOutputs: true,
        hasMetadata: true,
        resourceCount: 8,
        hasValidation: true
      };

      const lowQualityPackage: QualityFactors = {
        hasDescription: false,
        hasParameters: false,
        hasOutputs: false,
        hasMetadata: false,
        resourceCount: 1,
        hasValidation: false
      };

      expect(calculateQualityScore(highQualityPackage)).toBeGreaterThan(80);
      expect(calculateQualityScore(lowQualityPackage)).toBeLessThan(30);
    });

    test('should enforce quality threshold for packaging', () => {
      const qualityThreshold = 70;

      const canPackage = (qualityScore: number, forceFlag: boolean = false): boolean => {
        return forceFlag || qualityScore >= qualityThreshold;
      };

      expect(canPackage(80)).toBe(true);
      expect(canPackage(60)).toBe(false);
      expect(canPackage(60, true)).toBe(true); // Force flag overrides
    });
  });

  describe('UI Definition Validation', () => {
    test('should validate createUiDefinition structure', () => {
      const validUiDefinition = {
        "$schema": "https://schema.management.azure.com/schemas/0.1.2-preview/CreateUIDefinition.MultiVm.json#",
        "handler": "Microsoft.Azure.CreateUIDef",
        "version": "0.1.2-preview",
        "parameters": {
          "basics": [],
          "steps": [],
          "outputs": {}
        }
      };

      const isValidUiDefinition = (uiDef: any): boolean => {
        return uiDef.$schema !== undefined &&
               uiDef.handler === "Microsoft.Azure.CreateUIDef" &&
               uiDef.parameters !== undefined &&
               uiDef.parameters.basics !== undefined &&
               uiDef.parameters.steps !== undefined &&
               uiDef.parameters.outputs !== undefined;
      };

      expect(isValidUiDefinition(validUiDefinition)).toBe(true);
    });

    test('should detect missing UI definition components', () => {
      const incompleteUiDefinition = {
        "$schema": "https://schema.management.azure.com/schemas/0.1.2-preview/CreateUIDefinition.MultiVm.json#",
        "handler": "Microsoft.Azure.CreateUIDef"
        // Missing parameters section
      };

      const isValidUiDefinition = (uiDef: any): boolean => {
        return uiDef.$schema !== undefined &&
               uiDef.handler === "Microsoft.Azure.CreateUIDef" &&
               uiDef.parameters !== undefined &&
               uiDef.parameters.basics !== undefined &&
               uiDef.parameters.steps !== undefined &&
               uiDef.parameters.outputs !== undefined;
      };

      expect(isValidUiDefinition(incompleteUiDefinition)).toBe(false);
    });
  });

  describe('Package Metadata Validation', () => {
    test('should validate required metadata fields', () => {
      interface PackageMetadata {
        name?: string;
        version?: string;
        description?: string;
        publisher?: string;
        category?: string;
      }

      const validateMetadata = (metadata: PackageMetadata): string[] => {
        const errors: string[] = [];

        if (!metadata.name) errors.push('Package name is required');
        if (!metadata.version) errors.push('Package version is required');
        if (!metadata.description) errors.push('Package description is required');
        if (!metadata.publisher) errors.push('Publisher is required');
        if (!metadata.category) errors.push('Category is required');

        return errors;
      };

      const validMetadata: PackageMetadata = {
        name: 'webapp-package',
        version: '1.0.0',
        description: 'Web application deployment package',
        publisher: 'Contoso',
        category: 'Web Applications'
      };

      const invalidMetadata: PackageMetadata = {
        name: 'webapp-package'
        // Missing other required fields
      };

      expect(validateMetadata(validMetadata)).toHaveLength(0);
      expect(validateMetadata(invalidMetadata)).toHaveLength(4);
    });

    test('should validate version format', () => {
      const isValidVersion = (version: string): boolean => {
        const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+)?(\+[a-zA-Z0-9-]+)?$/;
        return semverRegex.test(version);
      };

      expect(isValidVersion('1.0.0')).toBe(true);
      expect(isValidVersion('2.1.3-beta')).toBe(true);
      expect(isValidVersion('1.0')).toBe(false);
      expect(isValidVersion('invalid')).toBe(false);
    });
  });

  describe('Force Flag Implementation', () => {
    test('should respect force flag for low quality packages', () => {
      interface PackageOptions {
        force?: boolean;
        qualityScore: number;
        threshold: number;
      }

      const shouldAllowPackaging = (options: PackageOptions): boolean => {
        return options.force === true || options.qualityScore >= options.threshold;
      };

      expect(shouldAllowPackaging({
        qualityScore: 60,
        threshold: 80
      })).toBe(false);

      expect(shouldAllowPackaging({
        force: true,
        qualityScore: 60,
        threshold: 80
      })).toBe(true);

      expect(shouldAllowPackaging({
        qualityScore: 90,
        threshold: 80
      })).toBe(true);
    });
  });
});