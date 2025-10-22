import { ArmTtkValidator } from '../core/validator';
import fs from 'fs';


describe('ArmTtkValidator', () => {
  let validator: ArmTtkValidator;

  beforeEach(() => {
    validator = new ArmTtkValidator();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Input Sanitization', () => {
    test('should reject package ID with special characters', () => {
      const maliciousId = '../../../etc/passwd';
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (validator as any).sanitizePackageId(maliciousId);
      }).toThrow('Invalid package ID');
    });

    test('should reject version with script injection attempts', () => {
      const maliciousVersion = '1.0.0; rm -rf /';
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (validator as any).sanitizeVersion(maliciousVersion);
      }).toThrow('Invalid version format');
    });

    test('should handle empty or null inputs safely', () => {
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (validator as any).sanitizePackageId('');
      }).toThrow('Invalid package ID');

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (validator as any).sanitizeVersion('');
      }).toThrow('Invalid version format');
    });
  });

  describe('Template Validation', () => {
    test('should reject invalid template path', async () => {
      const invalidPath = '/non/existent/template.json';

      await expect(validator.validateTemplate(invalidPath))
        .rejects
        .toThrow();
    });

    test('should handle validation errors gracefully', async () => {
      // Mock fs.existsSync to return true
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue('invalid json');

      await expect(validator.validateTemplate('test.json'))
        .rejects
        .toThrow();
    });
  });

  describe('Security Tests', () => {
    test('should prevent command injection in package validation', () => {
      const maliciousPackage = '../malicious-package';
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (validator as any).sanitizePackageId(maliciousPackage);
      }).toThrow('Invalid package ID');
    });

    test('should prevent path traversal in version strings', () => {
      const maliciousVersion = '../../etc/passwd';
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (validator as any).sanitizeVersion(maliciousVersion);
      }).toThrow('Invalid version format');
    });
  });
});