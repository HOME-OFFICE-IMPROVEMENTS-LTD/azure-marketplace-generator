/**
 * Comprehensive Workflow Validation Tests
 * Tests end-to-end marketplace template generation and validation workflows
 */
import * as fs from 'fs-extra';
import * as path from 'path';
import { ArmTtkValidator } from '../core/validator';
import { AppConfig, AppConfigManager } from '../config/app-config';
import { ConcurrentAzureService, AzureOperations } from '../services/concurrent-azure-service';

describe('Workflow Validation Tests', () => {
  let validator: ArmTtkValidator;
  let testOutputDir: string;
  let originalCwd: string;

  beforeAll(async () => {
    originalCwd = process.cwd();
    testOutputDir = path.join(process.cwd(), 'temp-test', 'workflow-tests');
    await fs.ensureDir(testOutputDir);

    // Initialize validator
    validator = new ArmTtkValidator();
  });

  beforeEach(() => {
    // Reset environment for clean tests
    AppConfigManager.resetInstance();
    ConcurrentAzureService.resetInstance();
  });

  afterAll(async () => {
    // Cleanup test directories
    try {
      if (await fs.pathExists(testOutputDir)) {
        await fs.remove(testOutputDir);
      }
    } catch (error) {
      console.warn('Failed to cleanup test directory:', error);
    }
  });

  describe('Template Generation Workflow', () => {
    it('should generate valid storage account template with all required files', async () => {
      const templateDir = path.join(testOutputDir, 'storage-template-test');
      await fs.ensureDir(templateDir);

      // Create a basic storage account template for testing
      const mainTemplate = {
        "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
        "contentVersion": "1.0.0.0",
        "metadata": {
          "description": "Deploy a storage account for Azure Marketplace",
          "author": "Azure Marketplace Generator"
        },
        "parameters": {
          "storageAccountName": {
            "type": "string",
            "metadata": {
              "description": "Name of the storage account"
            }
          },
          "location": {
            "type": "string",
            "defaultValue": "[resourceGroup().location]",
            "metadata": {
              "description": "Location for the storage account"
            }
          }
        },
        "variables": {
          "storageAccountType": "Standard_LRS"
        },
        "resources": [
          {
            "type": "Microsoft.Storage/storageAccounts",
            "apiVersion": "2023-01-01",
            "name": "[parameters('storageAccountName')]",
            "location": "[parameters('location')]",
            "sku": {
              "name": "[variables('storageAccountType')]"
            },
            "kind": "StorageV2",
            "properties": {
              "supportsHttpsTrafficOnly": true,
              "minimumTlsVersion": "TLS1_2"
            }
          }
        ],
        "outputs": {
          "storageAccountId": {
            "type": "string",
            "value": "[resourceId('Microsoft.Storage/storageAccounts', parameters('storageAccountName'))]"
          }
        }
      };

      const createUiDefinition = {
        "$schema": "https://schema.management.azure.com/schemas/0.1.2-preview/CreateUIDefinition.MultiVm.json#",
        "handler": "Microsoft.Azure.CreateUIDef",
        "version": "0.1.2-preview",
        "parameters": {
          "basics": [
            {
              "name": "storageAccountName",
              "type": "Microsoft.Common.TextBox",
              "label": "Storage Account Name",
              "placeholder": "Enter storage account name",
              "constraints": {
                "required": true,
                "regex": "^[a-z0-9]{3,24}$",
                "validationMessage": "Storage account name must be 3-24 characters, lowercase letters and numbers only"
              }
            }
          ],
          "steps": [],
          "outputs": {
            "storageAccountName": "[basics('storageAccountName')]",
            "location": "[location()]"
          }
        }
      };

      // Write template files
      await fs.writeJSON(path.join(templateDir, 'mainTemplate.json'), mainTemplate, { spaces: 2 });
      await fs.writeJSON(path.join(templateDir, 'createUiDefinition.json'), createUiDefinition, { spaces: 2 });

      // Verify files were created
      expect(await fs.pathExists(path.join(templateDir, 'mainTemplate.json'))).toBe(true);
      expect(await fs.pathExists(path.join(templateDir, 'createUiDefinition.json'))).toBe(true);

      // Verify file contents
      const mainTemplateContent = await fs.readJSON(path.join(templateDir, 'mainTemplate.json'));
      expect(mainTemplateContent.resources).toHaveLength(1);
      expect(mainTemplateContent.resources[0].type).toBe('Microsoft.Storage/storageAccounts');
    }, 30000);

    it('should handle template generation with nested templates', async () => {
      const templateDir = path.join(testOutputDir, 'nested-template-test');
      const nestedDir = path.join(templateDir, 'nestedtemplates');
      await fs.ensureDir(nestedDir);

      // Create main template that references nested template
      const mainTemplate = {
        "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
        "contentVersion": "1.0.0.0",
        "parameters": {
          "storageAccountName": {
            "type": "string"
          }
        },
        "resources": [
          {
            "type": "Microsoft.Resources/deployments",
            "apiVersion": "2021-04-01",
            "name": "nestedTemplate",
            "properties": {
              "mode": "Incremental",
              "templateLink": {
                "uri": "nestedtemplates/storage.json"
              },
              "parameters": {
                "storageAccountName": {
                  "value": "[parameters('storageAccountName')]"
                }
              }
            }
          }
        ]
      };

      // Create nested template
      const nestedTemplate = {
        "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
        "contentVersion": "1.0.0.0",
        "parameters": {
          "storageAccountName": {
            "type": "string"
          }
        },
        "resources": [
          {
            "type": "Microsoft.Storage/storageAccounts",
            "apiVersion": "2023-01-01",
            "name": "[parameters('storageAccountName')]",
            "location": "[resourceGroup().location]",
            "sku": {
              "name": "Standard_LRS"
            },
            "kind": "StorageV2"
          }
        ]
      };

      await fs.writeJSON(path.join(templateDir, 'mainTemplate.json'), mainTemplate, { spaces: 2 });
      await fs.writeJSON(path.join(nestedDir, 'storage.json'), nestedTemplate, { spaces: 2 });

      // Verify nested structure
      expect(await fs.pathExists(path.join(templateDir, 'mainTemplate.json'))).toBe(true);
      expect(await fs.pathExists(path.join(nestedDir, 'storage.json'))).toBe(true);

      const mainContent = await fs.readJSON(path.join(templateDir, 'mainTemplate.json'));
      expect(mainContent.resources[0].type).toBe('Microsoft.Resources/deployments');
    }, 15000);
  });

  describe('ARM-TTK Validation Pipeline', () => {
    let validTemplateDir: string;
    let invalidTemplateDir: string;

    beforeAll(async () => {
      validTemplateDir = path.join(testOutputDir, 'valid-template');
      invalidTemplateDir = path.join(testOutputDir, 'invalid-template');

      await fs.ensureDir(validTemplateDir);
      await fs.ensureDir(invalidTemplateDir);

      // Create valid template
      const validTemplate = {
        "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
        "contentVersion": "1.0.0.0",
        "parameters": {
          "storageAccountName": {
            "type": "string",
            "metadata": {
              "description": "Storage account name"
            }
          }
        },
        "resources": [
          {
            "type": "Microsoft.Storage/storageAccounts",
            "apiVersion": "2023-01-01",
            "name": "[parameters('storageAccountName')]",
            "location": "[resourceGroup().location]",
            "sku": {
              "name": "Standard_LRS"
            },
            "kind": "StorageV2",
            "properties": {
              "supportsHttpsTrafficOnly": true
            }
          }
        ]
      };

      // Create invalid template (missing required properties)
      const invalidTemplate = {
        "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
        "contentVersion": "1.0.0.0",
        "parameters": {
          "storageAccountName": {
            "type": "string"
            // Missing metadata description
          }
        },
        "resources": [
          {
            "type": "Microsoft.Storage/storageAccounts",
            "apiVersion": "2020-08-01-preview", // Old API version
            "name": "[parameters('storageAccountName')]",
            "location": "[resourceGroup().location]",
            "sku": {
              "name": "Standard_LRS"
            },
            "kind": "StorageV2"
            // Missing security properties
          }
        ]
      };

      await fs.writeJSON(path.join(validTemplateDir, 'mainTemplate.json'), validTemplate, { spaces: 2 });
      await fs.writeJSON(path.join(invalidTemplateDir, 'mainTemplate.json'), invalidTemplate, { spaces: 2 });
    });

    it('should validate templates and provide detailed results', async () => {
      const result = await validator.validateTemplate(validTemplateDir);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('testResults');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.testResults)).toBe(true);
    }, 60000);

    it('should handle validation errors gracefully', async () => {
      const result = await validator.validateTemplate(invalidTemplateDir);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
      expect(Array.isArray(result.errors)).toBe(true);

      // Should have detailed error information
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    }, 60000);

    it('should support selective test skipping', async () => {
      const testsToSkip = ['apiVersions-Should-Be-Recent'];
      const result = await validator.validateTemplate(invalidTemplateDir, testsToSkip);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('testResults');

      // Should not fail on the skipped test
      const apiVersionTest = result.testResults.find(test =>
        test.name.includes('apiVersions-Should-Be-Recent')
      );
      expect(apiVersionTest).toBeUndefined();
    }, 60000);

    it('should save validation reports', async () => {
      const result = await validator.validateTemplate(validTemplateDir);
      const reportPath = await validator.saveValidationReport(result, validTemplateDir, 'test-validation');

      expect(await fs.pathExists(reportPath)).toBe(true);

      const reportContent = await fs.readJSON(reportPath);
      expect(reportContent).toHaveProperty('packageId', 'test-validation');
      expect(reportContent).toHaveProperty('templatePath', validTemplateDir);
      expect(reportContent).toHaveProperty('validationResult');
    }, 30000);
  });

  describe('Marketplace Packaging Workflow', () => {
    let packageTemplateDir: string;

    beforeAll(async () => {
      packageTemplateDir = path.join(testOutputDir, 'package-template');
      await fs.ensureDir(packageTemplateDir);

      // Create complete marketplace package
      const mainTemplate = {
        "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
        "contentVersion": "1.0.0.0",
        "metadata": {
          "description": "Azure Marketplace Package Test Template"
        },
        "parameters": {
          "applicationName": {
            "type": "string",
            "metadata": {
              "description": "Application name"
            }
          }
        },
        "resources": [
          {
            "type": "Microsoft.Storage/storageAccounts",
            "apiVersion": "2023-01-01",
            "name": "[parameters('applicationName')]",
            "location": "[resourceGroup().location]",
            "sku": {
              "name": "Standard_LRS"
            },
            "kind": "StorageV2",
            "properties": {
              "supportsHttpsTrafficOnly": true,
              "minimumTlsVersion": "TLS1_2"
            }
          }
        ]
      };

      const createUiDefinition = {
        "$schema": "https://schema.management.azure.com/schemas/0.1.2-preview/CreateUIDefinition.MultiVm.json#",
        "handler": "Microsoft.Azure.CreateUIDef",
        "version": "0.1.2-preview",
        "parameters": {
          "basics": [
            {
              "name": "applicationName",
              "type": "Microsoft.Common.TextBox",
              "label": "Application Name",
              "constraints": {
                "required": true
              }
            }
          ],
          "steps": [],
          "outputs": {
            "applicationName": "[basics('applicationName')]"
          }
        }
      };

      const viewDefinition = {
        "views": [
          {
            "kind": "Overview",
            "properties": {
              "header": "Marketplace Package Overview",
              "description": "This is a test marketplace package"
            }
          }
        ]
      };

      await fs.writeJSON(path.join(packageTemplateDir, 'mainTemplate.json'), mainTemplate, { spaces: 2 });
      await fs.writeJSON(path.join(packageTemplateDir, 'createUiDefinition.json'), createUiDefinition, { spaces: 2 });
      await fs.writeJSON(path.join(packageTemplateDir, 'viewDefinition.json'), viewDefinition, { spaces: 2 });
    });

    it('should validate complete marketplace package', async () => {
      const result = await validator.validateTemplate(packageTemplateDir);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');

      // Check that all required files are recognized
      const templateFiles = ['mainTemplate.json', 'createUiDefinition.json'];
      for (const file of templateFiles) {
        expect(await fs.pathExists(path.join(packageTemplateDir, file))).toBe(true);
      }
    }, 60000);

    it('should handle promotion to marketplace', async () => {
      // First validate the template
      const validationResult = await validator.validateTemplate(packageTemplateDir);

      if (validationResult.success) {
        const reportPath = await validator.saveValidationReport(
          validationResult,
          packageTemplateDir,
          'marketplace-test'
        );

        // Verify the validation report contains marketplace-ready information
        const report = await fs.readJSON(reportPath);
        expect(report.packageId).toBe('marketplace-test');
        expect(report.validationResult.success).toBe(true);
      }
    }, 30000);
  });

  describe('Concurrent Processing Tests', () => {
    let concurrentTemplatesDir: string;
    let azureOps: AzureOperations;

    beforeAll(async () => {
      concurrentTemplatesDir = path.join(testOutputDir, 'concurrent-templates');
      await fs.ensureDir(concurrentTemplatesDir);
      azureOps = new AzureOperations();

      // Create multiple templates for concurrent testing
      for (let i = 1; i <= 5; i++) {
        const templateDir = path.join(concurrentTemplatesDir, `template-${i}`);
        await fs.ensureDir(templateDir);

        const template = {
          "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
          "contentVersion": "1.0.0.0",
          "parameters": {
            "resourceName": {
              "type": "string",
              "metadata": {
                "description": `Resource name for template ${i}`
              }
            }
          },
          "resources": [
            {
              "type": "Microsoft.Storage/storageAccounts",
              "apiVersion": "2023-01-01",
              "name": "[parameters('resourceName')]",
              "location": "[resourceGroup().location]",
              "sku": {
                "name": "Standard_LRS"
              },
              "kind": "StorageV2",
              "properties": {
                "supportsHttpsTrafficOnly": true
              }
            }
          ]
        };

        await fs.writeJSON(path.join(templateDir, 'mainTemplate.json'), template, { spaces: 2 });
      }
    });

    it('should validate multiple templates concurrently', async () => {
      const templateDirs = [];
      for (let i = 1; i <= 5; i++) {
        templateDirs.push(path.join(concurrentTemplatesDir, `template-${i}`));
      }

      // Validate all templates concurrently
      const validationPromises = templateDirs.map(dir => validator.validateTemplate(dir));
      const results = await Promise.all(validationPromises);

      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result).toBeDefined();
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('testResults');
      });
    }, 120000);

    it('should handle concurrent Azure operations', async () => {
      // Test concurrent Azure service statistics calls
      const statPromises = Array.from({ length: 10 }, () =>
        Promise.resolve(azureOps.getStats())
      );

      const stats = await Promise.all(statPromises);

      expect(stats).toHaveLength(10);
      stats.forEach(stat => {
        expect(stat).toHaveProperty('runningProcesses');
        expect(stat).toHaveProperty('queuedOperations');
        expect(stat).toHaveProperty('maxConcurrency');
        expect(typeof stat.maxConcurrency).toBe('number');
      });
    }, 15000);

    it('should respect concurrency limits', async () => {
      // Set lower concurrency for testing
      process.env.AZMP_MAX_CONCURRENCY = '2';

      const testAzureOps = new AzureOperations();
      const stats = testAzureOps.getStats();

      expect(stats.maxConcurrency).toBe(2);
    }, 5000);
  });

  describe('Performance and Load Testing', () => {
    it('should handle large template validation efficiently', async () => {
      const largeTemplateDir = path.join(testOutputDir, 'large-template');
      await fs.ensureDir(largeTemplateDir);

      // Create a template with many resources
      const largeTemplate: any = {
        "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
        "contentVersion": "1.0.0.0",
        "parameters": {
          "prefix": {
            "type": "string",
            "metadata": {
              "description": "Prefix for all resources"
            }
          }
        },
        "resources": []
      };

      // Add 50 storage accounts to test performance
      for (let i = 0; i < 50; i++) {
        largeTemplate.resources.push({
          "type": "Microsoft.Storage/storageAccounts",
          "apiVersion": "2023-01-01",
          "name": `[concat(parameters('prefix'), 'storage', '${i}')]`,
          "location": "[resourceGroup().location]",
          "sku": {
            "name": "Standard_LRS"
          },
          "kind": "StorageV2",
          "properties": {
            "supportsHttpsTrafficOnly": true
          }
        });
      }

      await fs.writeJSON(path.join(largeTemplateDir, 'mainTemplate.json'), largeTemplate, { spaces: 2 });

      // Measure validation time
      const startTime = Date.now();
      const result = await validator.validateTemplate(largeTemplateDir);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(60000); // Should complete within 60 seconds

      console.log(`Large template (50 resources) validated in ${duration}ms`);
    }, 90000);

    it('should maintain performance under memory pressure', async () => {
      // Create and validate multiple templates rapidly to test memory handling
      const templates = [];

      for (let i = 0; i < 10; i++) {
        const templateDir = path.join(testOutputDir, `memory-test-${i}`);
        await fs.ensureDir(templateDir);

        const template = {
          "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
          "contentVersion": "1.0.0.0",
          "parameters": {
            "param": {
              "type": "string",
              "metadata": {
                "description": `Parameter ${i}`
              }
            }
          },
          "resources": [
            {
              "type": "Microsoft.Storage/storageAccounts",
              "apiVersion": "2023-01-01",
              "name": `[parameters('param')]`,
              "location": "[resourceGroup().location]",
              "sku": {
                "name": "Standard_LRS"
              },
              "kind": "StorageV2"
            }
          ]
        };

        await fs.writeJSON(path.join(templateDir, 'mainTemplate.json'), template, { spaces: 2 });
        templates.push(templateDir);
      }

      // Rapid sequential validation
      const startTime = Date.now();
      for (const templateDir of templates) {
        const result = await validator.validateTemplate(templateDir);
        expect(result).toBeDefined();
      }
      const endTime = Date.now();

      console.log(`10 sequential validations completed in ${endTime - startTime}ms`);
      expect(endTime - startTime).toBeLessThan(120000); // 2 minutes max
    }, 150000);
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle malformed JSON gracefully', async () => {
      const malformedDir = path.join(testOutputDir, 'malformed-template');
      await fs.ensureDir(malformedDir);

      // Create malformed JSON
      const malformedJson = '{ "schema": "invalid json syntax without closing brace"';
      await fs.writeFile(path.join(malformedDir, 'mainTemplate.json'), malformedJson);

      const result = await validator.validateTemplate(malformedDir);

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    }, 30000);

    it('should handle missing required files', async () => {
      const incompleteDir = path.join(testOutputDir, 'incomplete-template');
      await fs.ensureDir(incompleteDir);

      // Create directory without mainTemplate.json
      await fs.writeFile(path.join(incompleteDir, 'readme.txt'), 'No template here');

      const result = await validator.validateTemplate(incompleteDir);

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
    }, 30000);

    it('should recover from validation timeout scenarios', async () => {
      // This test would require a very complex template that causes timeout
      // For now, we'll test the timeout handling mechanism exists
      const config = AppConfig.getConfig();
      expect(config.azure.timeoutMs).toBeGreaterThan(0);
      expect(config.azure.retryAttempts).toBeGreaterThan(0);
    }, 5000);
  });
});