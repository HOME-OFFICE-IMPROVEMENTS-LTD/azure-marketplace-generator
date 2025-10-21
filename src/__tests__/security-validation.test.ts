/**
 * Core Security Validation Tests
 *
 * Tests the security validation utilities to ensure they properly block
 * command injection attempts and validate Azure resource identifiers.
 */

import { SecurityValidation } from '../utils/security-validation';

describe('Security Validation Tests', () => {
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

  describe('validateSubscriptionId', () => {
    it('should reject malicious subscription IDs', () => {
      maliciousPayloads.forEach(payload => {
        expect(SecurityValidation.validateSubscriptionId(payload)).toBe(false);
      });
    });

    it('should accept valid subscription IDs', () => {
      const validIds = [
        '12345678-1234-1234-1234-123456789012',
        'abcdef01-2345-6789-abcd-ef0123456789',
        'ABCDEF01-2345-6789-ABCD-EF0123456789'
      ];
      validIds.forEach(id => {
        expect(SecurityValidation.validateSubscriptionId(id)).toBe(true);
      });
    });

    it('should reject invalid formats', () => {
      const invalidIds = [
        '12345678-1234-1234-1234-12345678901', // too short
        '12345678-1234-1234-1234-1234567890123', // too long
        '12345678-1234-1234-1234-12345678901g', // invalid character
        '12345678123412341234123456789012', // no dashes
        ''
      ];
      invalidIds.forEach(id => {
        expect(SecurityValidation.validateSubscriptionId(id)).toBe(false);
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
      const validNames = [
        'my-resource-group',
        'test_rg',
        'rg-prod-001',
        'simple',
        'with.periods',
        'with(parentheses)'
      ];
      validNames.forEach(name => {
        expect(SecurityValidation.validateResourceGroupName(name)).toBe(true);
      });
    });

    it('should reject names ending with period', () => {
      expect(SecurityValidation.validateResourceGroupName('invalid.')).toBe(false);
    });

    it('should reject names that are too long', () => {
      const longName = 'a'.repeat(91);
      expect(SecurityValidation.validateResourceGroupName(longName)).toBe(false);
    });
  });

  describe('validatePolicyName', () => {
    it('should reject malicious policy names', () => {
      maliciousPayloads.forEach(payload => {
        expect(SecurityValidation.validatePolicyName(payload)).toBe(false);
      });
    });

    it('should accept valid policy names', () => {
      const validNames = [
        'require-https',
        'storage_encryption',
        'vm-backup-policy',
        'policy.with.dots',
        'policy-with-dashes'
      ];
      validNames.forEach(name => {
        expect(SecurityValidation.validatePolicyName(name)).toBe(true);
      });
    });

    it('should reject names that are too long', () => {
      const longName = 'a'.repeat(129);
      expect(SecurityValidation.validatePolicyName(longName)).toBe(false);
    });
  });

  describe('validateTenantId', () => {
    it('should reject malicious tenant IDs', () => {
      maliciousPayloads.forEach(payload => {
        expect(SecurityValidation.validateTenantId(payload)).toBe(false);
      });
    });

    it('should accept valid tenant IDs', () => {
      const validIds = [
        '87654321-4321-4321-4321-210987654321',
        'fedcba09-8765-4321-fedc-ba0987654321'
      ];
      validIds.forEach(id => {
        expect(SecurityValidation.validateTenantId(id)).toBe(true);
      });
    });
  });

  describe('escapePowerShellString', () => {
    it('should properly escape single quotes', () => {
      expect(SecurityValidation.escapePowerShellString("test'quote")).toBe("test''quote");
      expect(SecurityValidation.escapePowerShellString("'; echo 'pwned'; '")).toBe("''; echo ''pwned''; ''");
      expect(SecurityValidation.escapePowerShellString("normal text")).toBe("normal text");
    });

    it('should handle multiple single quotes', () => {
      expect(SecurityValidation.escapePowerShellString("test'multiple'quotes'here")).toBe("test''multiple''quotes''here");
    });

    it('should handle empty strings', () => {
      expect(SecurityValidation.escapePowerShellString("")).toBe("");
    });
  });

  describe('validateFilePath', () => {
    it('should reject directory traversal attempts', () => {
      const traversalAttempts = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        '/absolute/path',
        'normal/../../../traversal',
        '../parent'
      ];
      traversalAttempts.forEach(path => {
        expect(SecurityValidation.validateFilePath(path)).toBe(false);
      });
    });

    it('should accept safe relative paths including current directory references', () => {
      const safePaths = [
        'template.json',
        'folder/template.json',
        'deep/folder/structure/template.json',
        'safe-path.arm',
        'file_with_underscores.json',
        './secret/file',      // Safe current directory reference
        './current'           // Safe current directory reference
      ];
      safePaths.forEach(path => {
        expect(SecurityValidation.validateFilePath(path)).toBe(true);
      });
    });

    it('should reject empty paths', () => {
      expect(SecurityValidation.validateFilePath('')).toBe(false);
    });
  });

  describe('validateResourceName', () => {
    it('should reject malicious resource names', () => {
      maliciousPayloads.forEach(payload => {
        expect(SecurityValidation.validateResourceName(payload)).toBe(false);
      });
    });

    it('should accept valid resource names', () => {
      const validNames = [
        'myresource',
        'my-resource',
        'my_resource',
        'resource123',
        'r1'
      ];
      validNames.forEach(name => {
        expect(SecurityValidation.validateResourceName(name)).toBe(true);
      });
    });

    it('should reject names starting or ending with special characters', () => {
      expect(SecurityValidation.validateResourceName('-startdash')).toBe(false);
      expect(SecurityValidation.validateResourceName('_startunderscore')).toBe(false);
      expect(SecurityValidation.validateResourceName('enddash-')).toBe(false);
      expect(SecurityValidation.validateResourceName('endunderscore_')).toBe(false);
    });

    it('should reject single character names', () => {
      expect(SecurityValidation.validateResourceName('a')).toBe(false);
      expect(SecurityValidation.validateResourceName('1')).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should reject malicious email inputs', () => {
      maliciousPayloads.forEach(payload => {
        expect(SecurityValidation.validateEmail(payload)).toBe(false);
      });
    });

    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com'
      ];
      validEmails.forEach(email => {
        expect(SecurityValidation.validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        'user..double@domain.com',
        'a'.repeat(250) + '@domain.com' // too long
      ];
      invalidEmails.forEach(email => {
        expect(SecurityValidation.validateEmail(email)).toBe(false);
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
      const validNames = [
        'test-name',
        'Valid Test Name',
        'test_with_underscores',
        'Test123',
        'simple'
      ];
      validNames.forEach(name => {
        expect(SecurityValidation.validateTestName(name)).toBe(true);
      });
    });

    it('should reject names that are too long', () => {
      const longName = 'a'.repeat(101);
      expect(SecurityValidation.validateTestName(longName)).toBe(false);
    });

    it('should reject names with special characters', () => {
      const invalidNames = [
        'test;name',
        'test|name',
        'test&name',
        'test$name',
        'test`name'
      ];
      invalidNames.forEach(name => {
        expect(SecurityValidation.validateTestName(name)).toBe(false);
      });
    });
  });

  describe('sanitizeCliArgument', () => {
    it('should remove dangerous characters', () => {
      maliciousPayloads.forEach(payload => {
        const sanitized = SecurityValidation.sanitizeCliArgument(payload);
        // Sanitized version should not contain dangerous characters
        expect(sanitized).not.toMatch(/[;&|`$(){}[\]'"\\]/);
      });
    });

    it('should preserve safe characters', () => {
      const safeInput = 'safe-input_123.txt';
      const sanitized = SecurityValidation.sanitizeCliArgument(safeInput);
      expect(sanitized).toBe(safeInput);
    });

    it('should handle empty strings', () => {
      expect(SecurityValidation.sanitizeCliArgument('')).toBe('');
    });
  });

  describe('Edge Cases and Boundary Tests', () => {
    it('should handle empty and null inputs safely', () => {
      expect(SecurityValidation.validateSubscriptionId('')).toBe(false);
      expect(SecurityValidation.validateResourceGroupName('')).toBe(false);
      expect(SecurityValidation.validatePolicyName('')).toBe(false);
      expect(SecurityValidation.validateTestName('')).toBe(false);
      expect(SecurityValidation.validateFilePath('')).toBe(false);
      expect(SecurityValidation.validateEmail('')).toBe(false);
    });

    it('should handle very long inputs', () => {
      const longString = 'a'.repeat(1000);
      expect(SecurityValidation.validateSubscriptionId(longString)).toBe(false);
      expect(SecurityValidation.validateResourceGroupName(longString)).toBe(false);
      expect(SecurityValidation.validatePolicyName(longString)).toBe(false);
      expect(SecurityValidation.validateTestName(longString)).toBe(false);
      expect(SecurityValidation.validateEmail(longString)).toBe(false);
    });

    it('should handle unicode and special characters', () => {
      const unicodeStrings = ['test🚀', 'тест', 'テスト', '测试'];
      unicodeStrings.forEach(str => {
        // Most Azure identifiers don't support unicode
        expect(SecurityValidation.validateSubscriptionId(str)).toBe(false);
        expect(SecurityValidation.validatePolicyName(str)).toBe(false);
        expect(SecurityValidation.validateResourceName(str)).toBe(false);
      });
    });

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
        expect(SecurityValidation.validateEmail(attack)).toBe(false);
      });
    });
  });
});