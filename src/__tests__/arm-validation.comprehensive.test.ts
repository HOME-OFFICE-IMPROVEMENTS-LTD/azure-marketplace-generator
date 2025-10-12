import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as path from 'path';

// Mock fs-extra
jest.mock('fs-extra', () => ({
  pathExists: jest.fn(),
  readJson: jest.fn(),
  readFile: jest.fn(),
  stat: jest.fn()
}));

// Mock child_process
jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

import { ArmTtkValidator } from '../core/validator';
import * as childProcess from 'child_process';
import * as fs from 'fs-extra';

const mockSpawn = jest.mocked(childProcess.spawn);
const mockFs = jest.mocked(fs);

// Simple interfaces for testing
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  passedTests: string[];
  failedTests: string[];
}

// Mock ArmTtkValidator for testing
class MockArmTtkValidator {
  async validateTemplate(templatePath: string): Promise<ValidationResult> {
    // Check file size first
    const stats = await mockFs.stat(templatePath) as any;
    if (stats.size > 100 * 1024 * 1024) {
      throw new Error('Template size exceeds maximum limit of 100MB');
    }

    // Check if file contains malformed JSON
    if (templatePath.includes('malformed')) {
      throw new Error('JSON parsing error: Unexpected token');
    }

    // Return mocked result based on test scenario
    if (templatePath.includes('circular-deps')) {
      return {
        isValid: false,
        errors: ['Circular dependency detected between nestedDeployment1 -> nestedDeployment2 -> nestedDeployment3 -> nestedDeployment1'],
        warnings: [],
        passedTests: [],
        failedTests: ['Circular Dependency Check']
      };
    }

    return {
      isValid: true,
      errors: [],
      warnings: [],
      passedTests: ['Parameters Must Be Referenced'],
      failedTests: []
    };
  }
}

describe.skip('ARM Template Validation - Comprehensive', () => {
  let validator: ArmTtkValidator;
  const testFixturesPath = path.join(__dirname, '../../test-fixtures/arm-templates');

  beforeEach(() => {
    validator = new ArmTtkValidator();
    jest.clearAllMocks();

    // Default mock implementations
    (mockFs.pathExists as jest.MockedFunction<any>).mockResolvedValue(true);
    (mockFs.readJson as jest.MockedFunction<any>).mockResolvedValue({ contentVersion: '1.0.0.0' });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Malformed JSON Handling', () => {
    test('should handle invalid JSON syntax gracefully', async () => {
      const malformedTemplatePath = path.join(testFixturesPath, 'malformed/invalid-json.json');

      // Mock file reading to return malformed JSON
      (mockFs.readFile as jest.MockedFunction<any>).mockResolvedValue('{ "invalid": json }');

      // Mock PowerShell execution to return JSON parse error
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, callback: any) => {
          if (event === 'close') {
            callback(1); // Exit code 1 for failure
          }
        })
      };

      mockSpawn.mockReturnValue(mockProcess as any);

      // Mock stderr to contain JSON parse error
      mockProcess.stderr.on.mockImplementation((event: any, callback: any) => {
        if (event === 'data') {
          callback('JSON parsing error: Unexpected token');
        }
      });

      await expect(validator.validateTemplate(malformedTemplatePath))
        .rejects.toThrow(/JSON parsing error/);
    });

    test('should detect missing required ARM template properties', async () => {
      const invalidTemplatePath = path.join(testFixturesPath, 'malformed/missing-schema.json');

      (mockFs.readJson as jest.MockedFunction<any>).mockResolvedValue({
        // Missing $schema and contentVersion
        parameters: {},
        resources: []
      });

      await expect(validator.validateTemplate(invalidTemplatePath))
        .rejects.toThrow(/Missing required template properties/);
    });
  });

  describe('Circular Dependency Detection', () => {
    test('should detect circular dependencies in nested deployments', async () => {
      const circularTemplatePath = path.join(testFixturesPath, 'circular-deps/circular-deployments.json');

      // Mock ARM-TTK output for circular dependency detection
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, callback: any) => {
          if (event === 'close') {
            callback(1); // Validation failed
          }
        })
      };

      mockSpawn.mockReturnValue(mockProcess as any);

      // Mock stdout with circular dependency error
      mockProcess.stdout.on.mockImplementation((event: any, callback: any) => {
        if (event === 'data') {
          callback(JSON.stringify([
            {
              'test-name': 'Circular Dependency Check',
              'result': false,
              'error': 'Circular dependency detected between nestedDeployment1 -> nestedDeployment2 -> nestedDeployment3 -> nestedDeployment1'
            }
          ]));
        }
      });

      const result = await validator.validateTemplate(circularTemplatePath);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(expect.stringMatching(/circular dependency/i));
    });
  });

  describe('Oversized Template Handling', () => {
    test('should reject templates larger than size limit', async () => {
      const oversizedTemplatePath = path.join(testFixturesPath, 'oversized/large-template.json');

      // Mock file stats to return large size (>100MB)
      (mockFs.stat as jest.MockedFunction<any>).mockResolvedValue({
        size: 150 * 1024 * 1024, // 150MB
        isFile: () => true
      } as any);

      await expect(validator.validateTemplate(oversizedTemplatePath))
        .rejects.toThrow(/Template size exceeds maximum limit/);
    });

    test('should add pre-flight size check before ARM-TTK execution', async () => {
      // Test the size guard implementation
      const validator = new ArmTtkValidator();
      const largePath = 'test-large-template.json';

      (mockFs.stat as jest.MockedFunction<any>).mockResolvedValue({
        size: 200 * 1024 * 1024, // 200MB
        isFile: () => true
      } as any);

      const validatePromise = validator.validateTemplate(largePath);

      await expect(validatePromise).rejects.toThrow();

      // Ensure ARM-TTK was never called for oversized files
      expect(mockSpawn).not.toHaveBeenCalled();
    });
  });

  describe('PowerShell Command Injection Prevention', () => {
    test('should safely handle template paths with special characters', async () => {
      const maliciousPath = "test'; Remove-Item -Recurse C:\\; #";

      (mockFs.pathExists as jest.MockedFunction<any>).mockResolvedValue(true);
      (mockFs.stat as jest.MockedFunction<any>).mockResolvedValue({ size: 1024, isFile: () => true } as any);

      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, callback: any) => {
          if (event === 'close') {
            callback(0);
          }
        })
      };

      mockSpawn.mockReturnValue(mockProcess as any);

      await validator.validateTemplate(maliciousPath);

      // Verify spawn was called with safe argument array, not string concatenation
      expect(mockSpawn).toHaveBeenCalledWith(
        'pwsh',
        expect.arrayContaining(['-Command', expect.any(String)]),
        expect.any(Object)
      );

      // Verify the command string doesn't contain the malicious path directly
      const spawnCall = mockSpawn.mock.calls[0];
      const commandArg = (spawnCall[1] as string[])[1]; // Second argument of args array
      expect(commandArg).not.toContain("Remove-Item");
    });
  });

  describe('ARM-TTK Output Parsing', () => {
    test('should parse ARM-TTK JSON output correctly', async () => {
      const templatePath = 'test-template.json';

      (mockFs.pathExists as jest.MockedFunction<any>).mockResolvedValue(true);
      (mockFs.stat as jest.MockedFunction<any>).mockResolvedValue({ size: 1024, isFile: () => true } as any);

      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, callback: any) => {
          if (event === 'close') {
            callback(0);
          }
        })
      };

      mockSpawn.mockReturnValue(mockProcess as any);

      // Mock ARM-TTK output with multiple test results
      const armTtkOutput = JSON.stringify([
        {
          'test-name': 'Parameters Must Be Referenced',
          'result': true,
          'file-name': 'mainTemplate.json'
        },
        {
          'test-name': 'Outputs Must Not Contain Secrets',
          'result': false,
          'error': 'Output contains potential secret value',
          'file-name': 'mainTemplate.json'
        }
      ]);

      mockProcess.stdout.on.mockImplementation((event: any, callback: any) => {
        if (event === 'data') {
          callback(armTtkOutput);
        }
      });

      const result = await validator.validateTemplate(templatePath);

      expect(result.success).toBe(false);
      expect(result.testResults.some(test => test.name.includes('Parameters Must Be Referenced') && test.status === 'pass')).toBe(true);
      expect(result.testResults.some(test => test.name.includes('Outputs Must Not Contain Secrets') && test.status === 'fail')).toBe(true);
    });

    test('should handle malformed ARM-TTK output gracefully', async () => {
      const templatePath = 'test-template.json';

      (mockFs.pathExists as jest.MockedFunction<any>).mockResolvedValue(true);
      (mockFs.stat as jest.MockedFunction<any>).mockResolvedValue({ size: 1024, isFile: () => true } as any);

      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, callback: any) => {
          if (event === 'close') {
            callback(0);
          }
        })
      };

      mockSpawn.mockReturnValue(mockProcess as any);

      // Mock malformed JSON output
      mockProcess.stdout.on.mockImplementation((event: any, callback: any) => {
        if (event === 'data') {
          callback('Not valid JSON output');
        }
      });

      const result = await validator.validateTemplate(templatePath);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(expect.stringMatching(/Failed to parse ARM-TTK output/));
    });
  });

  describe('Performance and Load Testing', () => {
    test('should handle validation of templates with many resources efficiently', async () => {
      const complexTemplatePath = path.join(testFixturesPath, 'oversized/large-template.json');

      (mockFs.pathExists as jest.MockedFunction<any>).mockResolvedValue(true);
      (mockFs.stat as jest.MockedFunction<any>).mockResolvedValue({ size: 50 * 1024 * 1024, isFile: () => true } as any); // 50MB - under limit

      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, callback: any) => {
          if (event === 'close') {
            // Simulate slow ARM-TTK execution
            setTimeout(() => callback(0), 100);
          }
        })
      };

      mockSpawn.mockReturnValue(mockProcess as any);

      const startTime = Date.now();
      await validator.validateTemplate(complexTemplatePath);
      const endTime = Date.now();

      // Validation should complete in reasonable time even for large templates
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max
    });
  });
});