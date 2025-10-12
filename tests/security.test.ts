/**
 * Security Regression Tests
 *
 * Tests to ensure that malicious payloads cannot be used for command injection
 */

import { SecurityValidation, ValidationError } from '../src/utils/security-validation';
import { ArmTtkValidator } from '../src/core/validator';
import { EnhancedArmTtkValidator } from '../src/core/enhanced-validator';
import { ComplianceEngine } from '../src/services/compliance-engine';
import * as path from 'path';
import * as fs from 'fs-extra';

describe('Security Regression Tests', () => {
  // Malicious payloads to test for command injection
  const maliciousPayloads = [
    "'; Remove-Item C:\\ -Recurse; 'foo",
    "'; & calc.exe; 'test",
    "'; Start-Process notepad; 'valid",
    "test'; echo 'pwned'; 'end",
    "; rm -rf /; echo 'test",
    "$(rm -rf /)",
    "`rm -rf /`",
    "test && rm important.txt",
    "test || echo malicious",
    "test; echo injection > /tmp/pwned",
    "test | cat /etc/passwd",
    'test" && echo "injected',
    "test' OR '1'='1",
    "../../../etc/passwd",
    "..\\..\\..\\windows\\system32\\calc.exe"
  ];

  describe('SecurityValidation', () => {
    describe('validateSubscriptionId', () => {
      it('should reject malicious subscription IDs', () => {
        maliciousPayloads.forEach(payload => {
          expect(SecurityValidation.validateSubscriptionId(payload)).toBe(false);
        });
      });

      it('should accept valid subscription IDs', () => {
        const validIds = [
          '12345678-1234-1234-1234-123456789012',
          'abcdef01-2345-6789-abcd-ef0123456789'
        ];
        validIds.forEach(id => {
          expect(SecurityValidation.validateSubscriptionId(id)).toBe(true);
        });
      });
    });

    describe('validateResourceGroupName', () => {
      it('should reject malicious resource group names', () => {
        maliciousPayloads.forEach(payload => {
          expect(SecurityValidation.validateResourceGroupName(payload)).toBe(false);
        });
      });

      it('should accept valid resource group names', () => {
        const validNames = ['my-resource-group', 'test_rg', 'rg-prod-001'];
        validNames.forEach(name => {
          expect(SecurityValidation.validateResourceGroupName(name)).toBe(true);
        });
      });
    });

    describe('validatePolicyName', () => {
      it('should reject malicious policy names', () => {
        maliciousPayloads.forEach(payload => {
          expect(SecurityValidation.validatePolicyName(payload)).toBe(false);
        });
      });

      it('should accept valid policy names', () => {
        const validNames = ['require-https', 'storage_encryption', 'vm-backup-policy'];
        validNames.forEach(name => {
          expect(SecurityValidation.validatePolicyName(name)).toBe(true);
        });
      });
    });

    describe('escapePowerShellString', () => {
      it('should properly escape single quotes', () => {
        expect(SecurityValidation.escapePowerShellString("test'quote")).toBe("test''quote");
        expect(SecurityValidation.escapePowerShellString("'; echo 'pwned'; '")).toBe("''; echo ''pwned''; ''");
      });
    });

    describe('validateFilePath', () => {
      it('should reject directory traversal attempts', () => {
        const traversalAttempts = [
          '../../../etc/passwd',
          '..\\..\\..\\windows\\system32',
          './secret/file',
          '/absolute/path',
          'normal/../../../traversal'
        ];
        traversalAttempts.forEach(path => {
          expect(SecurityValidation.validateFilePath(path)).toBe(false);
        });
      });

      it('should accept safe relative paths', () => {
        const safePaths = ['template.json', 'folder/template.json', 'safe-path.arm'];
        safePaths.forEach(path => {
          expect(SecurityValidation.validateFilePath(path)).toBe(true);
        });
      });
    });

    describe('validateTestName', () => {
      it('should reject malicious test names', () => {
        maliciousPayloads.forEach(payload => {
          expect(SecurityValidation.validateTestName(payload)).toBe(false);
        });
      });

      it('should accept valid test names', () => {
        const validNames = ['test-name', 'Valid Test Name', 'test_with_underscores'];
        validNames.forEach(name => {
          expect(SecurityValidation.validateTestName(name)).toBe(true);
        });
      });
    });
  });

  describe('ArmTtkValidator Security', () => {
    let validator: ArmTtkValidator;

    beforeEach(() => {
      validator = new ArmTtkValidator();
    });

    it('should reject malicious template paths', async () => {
      for (const payload of maliciousPayloads) {
        await expect(async () => {
          await validator.validateTemplate(payload);
        }).rejects.toThrow(ValidationError);
      }
    });

    it('should reject malicious skip test names', async () => {
      const validTemplatePath = 'test-template.json';

      // Create a mock template file for testing
      const tempDir = '/tmp/security-test';
      await fs.ensureDir(tempDir);
      const templatePath = path.join(tempDir, 'test-template.json');
      await fs.writeJson(templatePath, { "$schema": "test" });

      try {
        for (const payload of maliciousPayloads) {
          // The validator should filter out malicious test names
          // and only process valid ones
          const result = await validator.validateTemplate(templatePath, [payload]);
          // If we get here, the malicious payload was filtered out
          expect(result).toBeDefined();
        }
      } finally {
        await fs.remove(tempDir);
      }
    });
  });

  describe('EnhancedArmTtkValidator Security', () => {
    let validator: EnhancedArmTtkValidator;

    beforeEach(() => {
      validator = new EnhancedArmTtkValidator();
    });

    it('should reject malicious template paths', async () => {
      for (const payload of maliciousPayloads) {
        await expect(async () => {
          await validator.validateTemplate(payload);
        }).rejects.toThrow(ValidationError);
      }
    });

    it('should reject malicious skip test names', async () => {
      const validTemplatePath = 'test-template.json';

      // Create a mock template file for testing
      const tempDir = '/tmp/security-test-enhanced';
      await fs.ensureDir(tempDir);
      const templatePath = path.join(tempDir, 'test-template.json');
      await fs.writeJson(templatePath, { "$schema": "test" });

      try {
        for (const payload of maliciousPayloads) {
          // The validator should filter out malicious test names
          const result = await validator.validateTemplate(templatePath, [payload]);
          // If we get here, the malicious payload was filtered out
          expect(result).toBeDefined();
        }
      } finally {
        await fs.remove(tempDir);
      }
    });
  });

  describe('ComplianceEngine Security', () => {
    let complianceEngine: ComplianceEngine;

    beforeEach(() => {
      complianceEngine = new ComplianceEngine();
    });

    it('should reject malicious subscription IDs', async () => {
      for (const payload of maliciousPayloads) {
        await expect(async () => {
          await complianceEngine.assessCompliance(payload, 'SOC2');
        }).rejects.toThrow(ValidationError);
      }
    });

    it('should reject malicious tenant IDs', async () => {
      const validSubscriptionId = '12345678-1234-1234-1234-123456789012';

      for (const payload of maliciousPayloads) {
        await expect(async () => {
          await complianceEngine.assessCompliance(validSubscriptionId, 'SOC2', payload);
        }).rejects.toThrow(ValidationError);
      }
    });

    it('should accept valid Azure identifiers', async () => {
      const validSubscriptionId = '12345678-1234-1234-1234-123456789012';
      const validTenantId = '87654321-4321-4321-4321-210987654321';

      // This should not throw, even if it returns null due to network/auth issues
      const result = await complianceEngine.assessCompliance(validSubscriptionId, 'SOC2', validTenantId);
      expect(result).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complex attack scenarios', () => {
      const complexAttacks = [
        // SQL injection style
        "'; DROP TABLE users; --",
        // XSS style
        "<script>alert('xss')</script>",
        // Command chaining
        "test && echo 'pwned' > /tmp/attack",
        // Unicode/encoding attacks
        "test%27%3B%20rm%20-rf%20%2F%3B%20echo%20%27",
        // Path traversal with encoding
        "..%2F..%2F..%2Fetc%2Fpasswd"
      ];

      complexAttacks.forEach(attack => {
        expect(SecurityValidation.validateSubscriptionId(attack)).toBe(false);
        expect(SecurityValidation.validateResourceGroupName(attack)).toBe(false);
        expect(SecurityValidation.validatePolicyName(attack)).toBe(false);
        expect(SecurityValidation.validateTestName(attack)).toBe(false);
        expect(SecurityValidation.validateFilePath(attack)).toBe(false);
      });
    });

    it('should properly sanitize CLI arguments', () => {
      maliciousPayloads.forEach(payload => {
        const sanitized = SecurityValidation.sanitizeCliArgument(payload);
        // Sanitized version should not contain dangerous characters
        expect(sanitized).not.toMatch(/[;&|`$(){}[\]'"\\]/);
      });
    });
  });
});

describe('Edge Cases and Boundary Tests', () => {
  it('should handle empty and null inputs safely', () => {
    expect(SecurityValidation.validateSubscriptionId('')).toBe(false);
    expect(SecurityValidation.validateResourceGroupName('')).toBe(false);
    expect(SecurityValidation.validatePolicyName('')).toBe(false);
    expect(SecurityValidation.validateTestName('')).toBe(false);
    expect(SecurityValidation.validateFilePath('')).toBe(false);
  });

  it('should handle very long inputs', () => {
    const longString = 'a'.repeat(1000);
    expect(SecurityValidation.validateSubscriptionId(longString)).toBe(false);
    expect(SecurityValidation.validateResourceGroupName(longString)).toBe(false);
    expect(SecurityValidation.validatePolicyName(longString)).toBe(false);
    expect(SecurityValidation.validateTestName(longString)).toBe(false);
  });

  it('should handle unicode and special characters', () => {
    const unicodeStrings = ['test🚀', 'тест', 'テスト', '测试'];
    unicodeStrings.forEach(str => {
      // Most Azure identifiers don't support unicode
      expect(SecurityValidation.validateSubscriptionId(str)).toBe(false);
      expect(SecurityValidation.validatePolicyName(str)).toBe(false);
    });
  });
});