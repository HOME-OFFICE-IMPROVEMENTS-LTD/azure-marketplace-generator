/**
 * Security validation utilities for user inputs
 */

export class SecurityValidation {
  /**
   * Validates Azure subscription ID format
   */
  static validateSubscriptionId(subscriptionId: string): boolean {
    // Azure subscription IDs are UUIDs (36 characters with dashes)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(subscriptionId);
  }

  /**
   * Validates Azure resource group name
   */
  static validateResourceGroupName(name: string): boolean {
    // Azure resource group names: 1-90 chars, alphanumeric, periods, underscores, hyphens, parentheses
    // Cannot end with period
    const rgRegex = /^[a-zA-Z0-9._()-]{1,90}$/;
    return rgRegex.test(name) && !name.endsWith('.');
  }

  /**
   * Validates Azure policy name
   */
  static validatePolicyName(policyName: string): boolean {
    // Policy names should be alphanumeric with limited special characters
    const policyRegex = /^[a-zA-Z0-9._-]{1,128}$/;
    return policyRegex.test(policyName);
  }

  /**
   * Validates tenant ID format (UUID)
   */
  static validateTenantId(tenantId: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(tenantId);
  }

  /**
   * Sanitizes PowerShell single-quoted strings by escaping single quotes
   */
  static escapePowerShellString(input: string): string {
    return input.replace(/'/g, "''");
  }

  /**
   * Validates file paths to prevent directory traversal
   */
  static validateFilePath(filePath: string): boolean {
    // Prevent directory traversal attacks and reject empty paths
    if (!filePath || filePath.length === 0) {
      return false;
    }

    const normalized = filePath.replace(/\\/g, '/').toLowerCase();

    // Decode URL encoding to catch encoded attacks
    let decoded;
    try {
      decoded = decodeURIComponent(normalized);
    } catch {
      // Invalid encoding is suspicious
      return false;
    }

    // Reject dangerous traversal patterns, absolute paths, and current directory references
    if (normalized.includes('../') ||
        normalized.includes('..\\') ||
        normalized.startsWith('/') ||       // Reject absolute paths
        normalized.startsWith('./') ||      // Reject current directory references
        normalized.includes('%2e%2e') ||    // URL encoded .. (case insensitive)
        normalized.includes('%2f') ||       // URL encoded /
        normalized.includes('%5c') ||       // URL encoded \
        normalized.includes('%00') ||       // Null byte
        decoded.includes('../') ||          // Decoded traversal patterns
        decoded.includes('..\\') ||
        decoded.startsWith('/') ||
        decoded.startsWith('./') ||
        normalized.includes('<') || normalized.includes('>') ||
        normalized.includes('|') || normalized.includes('&') ||
        normalized.includes(';') || normalized.includes('`') ||
        normalized.includes('$') ||
        normalized.includes('"') || normalized.includes('--') ||
        normalized.includes("'") ||         // SQL injection character
        normalized.includes('script') ||    // XSS attempt
        normalized.includes('drop') ||      // SQL injection keyword
        normalized.includes('echo') ||      // Command injection
        normalized.includes('rm ') ||       // Command injection
        normalized.includes('alert') ||     // XSS attempt
        normalized.includes('%27') ||       // Encoded single quote
        normalized.includes('%3b')) {       // Encoded semicolon
      return false;
    }

    // Additional check: simple file/folder structure only (alphanumeric, dots, hyphens, underscores, slashes)
    const safePathRegex = /^[a-zA-Z0-9._/-]+$/;
    if (!safePathRegex.test(normalized)) {
      return false;
    }

    // Only allow simple relative paths without any traversal attempts
    // Valid examples: 'template.json', 'folder/template.json', 'deep/folder/structure/template.json'
    return true;
  }

  /**
   * Validates Azure resource names
   */
  static validateResourceName(name: string): boolean {
    // General Azure resource name pattern (most restrictive common case)
    const nameRegex = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,62}[a-zA-Z0-9]$/;
    return nameRegex.test(name);
  }

  /**
   * Validates email format for notifications
   */
  static validateEmail(email: string): boolean {
    if (!email || email.length === 0 || email.length > 254) {
      return false;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    // Additional checks for invalid patterns
    if (email.includes('..') || email.startsWith('.') || email.endsWith('.') ||
        email.includes('@.') || email.includes('.@')) {
      return false;
    }
    return emailRegex.test(email);
  }

  /**
   * Validates ARM template test names for ARM-TTK
   */
  static validateTestName(testName: string): boolean {
    // ARM-TTK test names are alphanumeric with spaces, hyphens, underscores
    const testRegex = /^[a-zA-Z0-9\-_\s]{1,100}$/;
    return testRegex.test(testName);
  }

  /**
   * Sanitizes command-line arguments to prevent injection
   */
  static sanitizeCliArgument(arg: string): string {
    // Remove or escape dangerous characters for command-line usage
    return arg.replace(/[;&|`$(){}[\]'"\\]/g, '');
  }
}

/**
 * Custom error for validation failures
 */
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}