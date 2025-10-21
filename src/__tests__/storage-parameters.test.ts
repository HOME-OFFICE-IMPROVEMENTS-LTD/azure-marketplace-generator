/**
 * Storage Parameters Validation Tests (v3.0.0)
 *
 * Tests the enhanced storage parameters added in v3.0.0.
 * These tests validate template structure without runtime deployment.
 */

import { describe, test, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('Storage Template Files', () => {
  const templatesDir = path.join(__dirname, '../templates/storage');

  test('should have all required template files', () => {
    expect(fs.existsSync(path.join(templatesDir, 'mainTemplate.json.hbs'))).toBe(true);
    expect(fs.existsSync(path.join(templatesDir, 'createUiDefinition.json.hbs'))).toBe(true);
    expect(fs.existsSync(path.join(templatesDir, 'viewDefinition.json.hbs'))).toBe(true);
  });
});

describe('Enhanced Security Parameters', () => {
  const mainTemplatePath = path.join(__dirname, '../templates/storage/mainTemplate.json.hbs');
  const content = fs.readFileSync(mainTemplatePath, 'utf8');

  test('should define all security parameters', () => {
    expect(content).toContain('"allowBlobPublicAccess"');
    expect(content).toContain('"minimumTlsVersion"');
    expect(content).toContain('"supportsHttpsTrafficOnly"');
    expect(content).toContain('"publicNetworkAccess"');
    expect(content).toContain('"defaultToOAuthAuthentication"');
    expect(content).toContain('"allowSharedKeyAccess"');
    expect(content).toContain('"requireInfrastructureEncryption"');
  });

  test('should have secure defaults', () => {
    expect(content).toContain('"allowSharedKeyAccess"');
    expect(content).toContain('"defaultValue": false');
    expect(content).toContain('"minimumTlsVersion"');
    expect(content).toContain('"defaultValue": "TLS1_2"');
  });
});

describe('Enhanced Data Protection Parameters', () => {
  const mainTemplatePath = path.join(__dirname, '../templates/storage/mainTemplate.json.hbs');
  const content = fs.readFileSync(mainTemplatePath, 'utf8');

  test('should define all data protection parameters', () => {
    expect(content).toContain('"blobSoftDeleteDays"');
    expect(content).toContain('"containerSoftDeleteDays"');
    expect(content).toContain('"enableVersioning"');
    expect(content).toContain('"changeFeedEnabled"');
    expect(content).toContain('"lastAccessTimeTrackingEnabled"');
  });

  test('should have retention day constraints', () => {
    expect(content).toContain('"minValue": 0');
    expect(content).toContain('"maxValue": 365');
    expect(content).toContain('storage costs');
  });
});

describe('UI Definition Enhancements', () => {
  const uiPath = path.join(__dirname, '../templates/storage/createUiDefinition.json.hbs');
  const content = fs.readFileSync(uiPath, 'utf8');

  test('should have Security & Access Control step', () => {
    expect(content).toContain('"securityConfig"');
    expect(content).toContain('Security');
  });

  test('should have Data Protection step', () => {
    expect(content).toContain('"dataProtectionConfig"');
    expect(content).toContain('Data Protection');
  });

  test('should map parameters to outputs', () => {
    expect(content).toContain('allowBlobPublicAccess');
    expect(content).toContain('blobSoftDeleteDays');
    expect(content).toContain('enableVersioning');
  });
});

describe('View Definition Enhancements', () => {
  const viewPath = path.join(__dirname, '../templates/storage/viewDefinition.json.hbs');
  const content = fs.readFileSync(viewPath, 'utf8');

  test('should have Security Status panel', () => {
    expect(content).toContain('Security Status');
  });

  test('should have Data Protection Status panel', () => {
    expect(content).toContain('Data Protection Status');
  });
});

describe('Template Integration', () => {
  const mainTemplatePath = path.join(__dirname, '../templates/storage/mainTemplate.json.hbs');
  const content = fs.readFileSync(mainTemplatePath, 'utf8');

  test('should use dynamic API version helpers', () => {
    expect(content).toContain('latestApiVersion');
  });

  test('should have blobServices resource', () => {
    expect(content).toContain('Microsoft.Storage/storageAccounts/blobServices');
  });

  test('should have enhanced security outputs', () => {
    expect(content).toContain('"securityStatus"');
  });

  test('should have data protection outputs', () => {
    expect(content).toContain('"dataProtectionStatus"');
  });
});
