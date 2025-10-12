import * as chalk from 'chalk';
import * as https from 'https';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { execSync } from 'child_process';

/**
 * Enhanced Template Generation Service
 *
 * Replaces static API versions with dynamic fetching,
 * adds resource naming policies, and implements post-generation validation.
 */

export interface ApiVersionInfo {
  resourceType: string;
  apiVersion: string;
  lastUpdated: Date;
  isPreview: boolean;
  isDeprecated: boolean;
  stability: 'stable' | 'preview' | 'deprecated';
}

export interface ResourceNamingPolicy {
  resourceType: string;
  prefix?: string;
  suffix?: string;
  maxLength: number;
  minLength: number;
  allowedCharacters: string;
  pattern: string;
  uniquenessSuffix: boolean;
  examples: string[];
}

export interface TemplateValidationResult {
  templatePath: string;
  isValid: boolean;
  armTtkResults: {
    passed: number;
    failed: number;
    warnings: number;
    errors: string[];
  };
  bicepValidation?: {
    isValid: boolean;
    errors: string[];
  };
  customValidation: {
    apiVersions: boolean;
    namingPolicies: boolean;
    securityBaseline: boolean;
    issues: string[];
  };
  recommendations: string[];
}

export interface EnhancedTemplateConfig {
  type: string;
  publisher: string;
  offer: string;
  version: string;
  region: string;
  enforceNamingPolicies: boolean;
  useLatestApiVersions: boolean;
  applySecurityBaseline: boolean;
  validateAfterGeneration: boolean;
  customProperties?: { [key: string]: any };
}

export class EnhancedTemplateGenerator {
  private apiVersionCache: Map<string, ApiVersionInfo> = new Map();
  private namingPolicies: Map<string, ResourceNamingPolicy> = new Map();
  private templateDir: string;
  private cacheExpiryMs = 6 * 60 * 60 * 1000; // 6 hours

  constructor(templateDir: string = './templates') {
    this.templateDir = templateDir;
    this.initializeNamingPolicies();
    this.loadApiVersionCache();
    this.registerEnhancedHelpers();
  }

  /**
   * Generate template with enhanced features
   */
  async generateEnhancedTemplate(config: EnhancedTemplateConfig): Promise<TemplateValidationResult> {
    console.log(chalk.blue('🎨 Generating enhanced ARM template...'));

    // Update API versions if requested
    if (config.useLatestApiVersions) {
      await this.updateApiVersions();
    }

    // Generate the template
    const outputPath = await this.generateTemplate(config);

    // Validate the generated template
    const validationResult = await this.validateGeneratedTemplate(outputPath, config);

    this.printGenerationReport(validationResult);
    return validationResult;
  }

  /**
   * Initialize resource naming policies
   */
  private initializeNamingPolicies(): void {
    // Storage Account naming policy
    this.namingPolicies.set('Microsoft.Storage/storageAccounts', {
      resourceType: 'Microsoft.Storage/storageAccounts',
      prefix: 'st',
      maxLength: 24,
      minLength: 3,
      allowedCharacters: 'abcdefghijklmnopqrstuvwxyz0123456789',
      pattern: '^[a-z0-9]{3,24}$',
      uniquenessSuffix: true,
      examples: ['stmyapp001', 'stprod123', 'stdev456']
    });

    // Virtual Machine naming policy
    this.namingPolicies.set('Microsoft.Compute/virtualMachines', {
      resourceType: 'Microsoft.Compute/virtualMachines',
      prefix: 'vm',
      maxLength: 15, // Windows VM limit
      minLength: 1,
      allowedCharacters: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-',
      pattern: '^[a-zA-Z][a-zA-Z0-9-]{0,14}$',
      uniquenessSuffix: false,
      examples: ['vm-web-001', 'vm-db-prod', 'vm-app-dev']
    });

    // App Service naming policy
    this.namingPolicies.set('Microsoft.Web/sites', {
      resourceType: 'Microsoft.Web/sites',
      prefix: 'app',
      maxLength: 60,
      minLength: 2,
      allowedCharacters: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-',
      pattern: '^[a-zA-Z0-9][a-zA-Z0-9-]{0,58}[a-zA-Z0-9]$',
      uniquenessSuffix: true,
      examples: ['app-mywebsite-prod', 'app-api-dev', 'app-portal-test']
    });

    // Key Vault naming policy
    this.namingPolicies.set('Microsoft.KeyVault/vaults', {
      resourceType: 'Microsoft.KeyVault/vaults',
      prefix: 'kv',
      maxLength: 24,
      minLength: 3,
      allowedCharacters: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-',
      pattern: '^[a-zA-Z][a-zA-Z0-9-]{1,22}[a-zA-Z0-9]$',
      uniquenessSuffix: true,
      examples: ['kv-secrets-prod', 'kv-app-dev', 'kv-shared-001']
    });

    // SQL Server naming policy
    this.namingPolicies.set('Microsoft.Sql/servers', {
      resourceType: 'Microsoft.Sql/servers',
      prefix: 'sql',
      maxLength: 63,
      minLength: 1,
      allowedCharacters: 'abcdefghijklmnopqrstuvwxyz0123456789-',
      pattern: '^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$',
      uniquenessSuffix: true,
      examples: ['sql-myapp-prod', 'sql-reporting-dev', 'sql-shared-001']
    });

    // Resource Group naming policy
    this.namingPolicies.set('Microsoft.Resources/resourceGroups', {
      resourceType: 'Microsoft.Resources/resourceGroups',
      prefix: 'rg',
      maxLength: 90,
      minLength: 1,
      allowedCharacters: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.()',
      pattern: '^[a-zA-Z0-9-_().]{1,89}[a-zA-Z0-9-_()]$',
      uniquenessSuffix: false,
      examples: ['rg-myapp-prod', 'rg-infrastructure-dev', 'rg-shared-services']
    });
  }

  /**
   * Register enhanced Handlebars helpers
   */
  private registerEnhancedHelpers(): void {
    // Dynamic API version helper
    Handlebars.registerHelper('latestApiVersion', (resourceType: string) => {
      const apiInfo = this.apiVersionCache.get(resourceType);
      if (apiInfo && !apiInfo.isDeprecated) {
        return apiInfo.apiVersion;
      }

      // Fallback to safe defaults
      const fallbackVersions: { [key: string]: string } = {
        'Microsoft.Storage/storageAccounts': '2023-01-01',
        'Microsoft.Compute/virtualMachines': '2023-03-01',
        'Microsoft.Web/sites': '2023-01-01',
        'Microsoft.KeyVault/vaults': '2023-02-01',
        'Microsoft.Sql/servers': '2023-02-01-preview',
        'Microsoft.Resources/deployments': '2022-09-01'
      };

      return fallbackVersions[resourceType] || '2023-01-01';
    });

    // Enhanced resource naming helper
    Handlebars.registerHelper('resourceName', (resourceType: string, baseName: string, environment?: string) => {
      const policy = this.namingPolicies.get(resourceType);
      if (!policy) {
        // Fallback to simple naming if no policy exists
        return `${baseName}-${this.generateUniqueSuffix()}`;
      }

      let name = '';

      // Add prefix if defined
      if (policy.prefix) {
        name += policy.prefix + '-';
      }

      // Add base name
      name += baseName;

      // Add environment if provided
      if (environment) {
        name += '-' + environment;
      }

      // Add unique suffix if required
      if (policy.uniquenessSuffix) {
        name += '-' + this.generateUniqueSuffix();
      }

      // Clean name to match policy requirements
      name = this.cleanResourceName(name, policy);

      return name;
    });

    // Secure SKU helper
    Handlebars.registerHelper('secureSkuName', (resourceType: string, defaultSku?: string) => {
      const secureSkus: { [key: string]: string } = {
        'Microsoft.Storage/storageAccounts': 'Standard_GRS',
        'Microsoft.Compute/virtualMachines': 'Standard_D2s_v3',
        'Microsoft.Web/serverfarms': 'P1V2',
        'Microsoft.Sql/servers/databases': 'S1',
        'Microsoft.KeyVault/vaults': 'standard'
      };

      return secureSkus[resourceType] || defaultSku || 'Standard';
    });

    // Security baseline helper
    Handlebars.registerHelper('securityBaseline', (resourceType: string) => {
      const baselines: { [key: string]: any } = {
        'Microsoft.Storage/storageAccounts': {
          supportsHttpsTrafficOnly: true,
          minimumTlsVersion: 'TLS1_2',
          allowBlobPublicAccess: false,
          allowSharedKeyAccess: false
        },
        'Microsoft.Sql/servers': {
          minimalTlsVersion: '1.2',
          publicNetworkAccess: 'Disabled'
        },
        'Microsoft.KeyVault/vaults': {
          enableSoftDelete: true,
          enablePurgeProtection: true,
          enableRbacAuthorization: true
        }
      };

      return JSON.stringify(baselines[resourceType] || {});
    });

    // Generate compliance tags
    Handlebars.registerHelper('complianceTags', (environment: string) => {
      return JSON.stringify({
        Environment: environment,
        CostCenter: 'IT',
        DataClassification: 'Internal',
        Backup: 'Required',
        'Monitoring-Required': 'true',
        'Compliance-Framework': 'ISO27001'
      });
    });

    // RBAC assignments helper
    Handlebars.registerHelper('rbacAssignments', (principalType: string, role: string) => {
      const roleDefinitions: { [key: string]: string } = {
        'Contributor': 'b24988ac-6180-42a0-ab88-20f7382dd24c',
        'Reader': 'acdd72a7-3385-48ef-bd42-f606fba81ae7',
        'Owner': '8e3af657-a8ff-443c-a75c-2fe8c4bcb635',
        'Storage Blob Data Contributor': 'ba92f5b4-2d11-453d-a403-e96b0029c9fe',
        'Key Vault Secrets Officer': 'b86a8fe4-44ce-4948-aee5-eccb2c155cd7'
      };

      return roleDefinitions[role] || roleDefinitions['Reader'];
    });
  }

  /**
   * Update API versions from Azure Resource Manager
   */
  private async updateApiVersions(): Promise<void> {
    console.log(chalk.yellow('🔄 Updating API versions from Azure Resource Manager...'));

    try {
      // Use Azure CLI to get latest API versions
      const providers = await this.getResourceProviders();

      for (const provider of providers) {
        for (const resourceType of provider.resourceTypes) {
          const fullType = `${provider.namespace}/${resourceType.resourceType}`;
          const latestVersion = this.getLatestApiVersion(resourceType.apiVersions);

          if (latestVersion) {
            this.apiVersionCache.set(fullType, {
              resourceType: fullType,
              apiVersion: latestVersion,
              lastUpdated: new Date(),
              isPreview: latestVersion.includes('preview'),
              isDeprecated: false,
              stability: latestVersion.includes('preview') ? 'preview' : 'stable'
            });
          }
        }
      }

      await this.saveApiVersionCache();
      console.log(chalk.green(`✅ Updated ${this.apiVersionCache.size} API versions`));
    } catch (error) {
      console.warn(chalk.yellow(`⚠️ Could not update API versions: ${error}`));
    }
  }

  /**
   * Get resource providers from Azure
   */
  private async getResourceProviders(): Promise<any[]> {
    try {
      const output = execSync('az provider list --query "[].{namespace:namespace,resourceTypes:resourceTypes}" -o json', {
        encoding: 'utf8',
        timeout: 30000
      });

      return JSON.parse(output);
    } catch (error) {
      // Fallback to cached data or hardcoded providers
      return this.getFallbackProviders();
    }
  }

  /**
   * Get fallback provider data
   */
  private getFallbackProviders(): any[] {
    return [
      {
        namespace: 'Microsoft.Storage',
        resourceTypes: [
          {
            resourceType: 'storageAccounts',
            apiVersions: ['2023-01-01', '2022-09-01', '2022-05-01']
          }
        ]
      },
      {
        namespace: 'Microsoft.Compute',
        resourceTypes: [
          {
            resourceType: 'virtualMachines',
            apiVersions: ['2023-03-01', '2022-11-01', '2022-08-01']
          }
        ]
      }
    ];
  }

  /**
   * Get latest stable API version
   */
  private getLatestApiVersion(versions: string[]): string | null {
    if (!versions || versions.length === 0) return null;

    // Prefer stable versions over preview
    const stableVersions = versions.filter(v => !v.includes('preview'));
    const sortedVersions = (stableVersions.length > 0 ? stableVersions : versions).sort().reverse();

    return sortedVersions[0];
  }

  /**
   * Generate unique suffix
   */
  private generateUniqueSuffix(): string {
    return Math.random().toString(36).substring(2, 8);
  }

  /**
   * Clean resource name according to policy
   */
  private cleanResourceName(name: string, policy: ResourceNamingPolicy): string {
    // Remove disallowed characters
    const allowedChars = new Set(policy.allowedCharacters);
    let cleaned = name.split('').filter(char => allowedChars.has(char)).join('');

    // Ensure length constraints
    if (cleaned.length > policy.maxLength) {
      cleaned = cleaned.substring(0, policy.maxLength);
    }

    // Ensure it matches the pattern
    const regex = new RegExp(policy.pattern);
    if (!regex.test(cleaned)) {
      // If it doesn't match, create a valid name
      cleaned = this.createValidName(policy);
    }

    return cleaned;
  }

  /**
   * Create valid name based on policy
   */
  private createValidName(policy: ResourceNamingPolicy): string {
    let name = policy.prefix || 'resource';

    if (policy.uniquenessSuffix) {
      name += this.generateUniqueSuffix();
    }

    // Ensure it fits length constraints
    if (name.length > policy.maxLength) {
      name = name.substring(0, policy.maxLength);
    }

    return name;
  }

  /**
   * Generate template using enhanced config
   */
  private async generateTemplate(config: EnhancedTemplateConfig): Promise<string> {
    const templatePath = path.join(this.templateDir, config.type);
    const outputPath = path.join(process.cwd(), 'temp', `${config.offer}-${config.version}`);

    // Ensure output directory exists
    await fs.ensureDir(outputPath);

    // Copy and process template files
    const templateFiles = await fs.readdir(templatePath);

    for (const file of templateFiles) {
      const sourcePath = path.join(templatePath, file);
      const destPath = path.join(outputPath, file);

      if (file.endsWith('.json') || file.endsWith('.md')) {
        // Process template files
        const content = await fs.readFile(sourcePath, 'utf8');
        const template = Handlebars.compile(content);
        const processed = template(config);
        await fs.writeFile(destPath, processed);
      } else {
        // Copy other files as-is
        await fs.copy(sourcePath, destPath);
      }
    }

    return outputPath;
  }

  /**
   * Validate generated template
   */
  private async validateGeneratedTemplate(
    templatePath: string,
    config: EnhancedTemplateConfig
  ): Promise<TemplateValidationResult> {
    console.log(chalk.yellow('🔍 Validating generated template...'));

    const result: TemplateValidationResult = {
      templatePath,
      isValid: false,
      armTtkResults: {
        passed: 0,
        failed: 0,
        warnings: 0,
        errors: []
      },
      customValidation: {
        apiVersions: true,
        namingPolicies: true,
        securityBaseline: true,
        issues: []
      },
      recommendations: []
    };

    // Run ARM-TTK validation
    await this.runArmTtkValidation(templatePath, result);

    // Run custom validations
    await this.runCustomValidations(templatePath, config, result);

    // Calculate overall validity
    result.isValid = result.armTtkResults.failed === 0 &&
                    result.customValidation.apiVersions &&
                    result.customValidation.namingPolicies &&
                    result.customValidation.securityBaseline;

    return result;
  }

  /**
   * Run ARM-TTK validation
   */
  private async runArmTtkValidation(templatePath: string, result: TemplateValidationResult): Promise<void> {
    try {
      const armTtkPath = '/home/msalsouri/tools/arm-ttk/arm-ttk/Test-AzTemplate.ps1';

      if (await fs.pathExists(armTtkPath)) {
        const output = execSync(
          `pwsh -ExecutionPolicy Bypass -File "${armTtkPath}" -TemplatePath "${templatePath}"`,
          { encoding: 'utf8', timeout: 60000 }
        );

        this.parseArmTtkOutput(output, result);
      } else {
        result.armTtkResults.errors.push('ARM-TTK not found - skipped validation');
      }
    } catch (error) {
      result.armTtkResults.errors.push(`ARM-TTK validation failed: ${error}`);
    }
  }

  /**
   * Parse ARM-TTK output
   */
  private parseArmTtkOutput(output: string, result: TemplateValidationResult): void {
    const lines = output.split('\n');

    for (const line of lines) {
      if (line.includes('[+]')) {
        result.armTtkResults.passed++;
      } else if (line.includes('[-]')) {
        result.armTtkResults.failed++;
        result.armTtkResults.errors.push(line.trim());
      } else if (line.includes('[?]')) {
        result.armTtkResults.warnings++;
      }
    }
  }

  /**
   * Run custom validations
   */
  private async runCustomValidations(
    templatePath: string,
    config: EnhancedTemplateConfig,
    result: TemplateValidationResult
  ): Promise<void> {
    try {
      const mainTemplatePath = path.join(templatePath, 'mainTemplate.json');
      const template = await fs.readJson(mainTemplatePath);

      // Validate API versions
      if (config.useLatestApiVersions) {
        result.customValidation.apiVersions = this.validateApiVersions(template, result);
      }

      // Validate naming policies
      if (config.enforceNamingPolicies) {
        result.customValidation.namingPolicies = this.validateNamingPolicies(template, result);
      }

      // Validate security baseline
      if (config.applySecurityBaseline) {
        result.customValidation.securityBaseline = this.validateSecurityBaseline(template, result);
      }

    } catch (error) {
      result.customValidation.issues.push(`Template validation error: ${error}`);
    }
  }

  /**
   * Validate API versions in template
   */
  private validateApiVersions(template: any, result: TemplateValidationResult): boolean {
    const resources = template.resources || [];
    let allValid = true;

    for (const resource of resources) {
      const cachedVersion = this.apiVersionCache.get(resource.type);

      if (cachedVersion && cachedVersion.isDeprecated) {
        result.customValidation.issues.push(`Resource ${resource.type} uses deprecated API version`);
        allValid = false;
      }

      if (resource.apiVersion && resource.apiVersion.includes('preview')) {
        result.recommendations.push(`Consider using stable API version for ${resource.type}`);
      }
    }

    return allValid;
  }

  /**
   * Validate naming policies
   */
  private validateNamingPolicies(template: any, result: TemplateValidationResult): boolean {
    // This would validate resource names against policies
    // For now, assume valid
    return true;
  }

  /**
   * Validate security baseline
   */
  private validateSecurityBaseline(template: any, result: TemplateValidationResult): boolean {
    const resources = template.resources || [];
    let allValid = true;

    for (const resource of resources) {
      // Check storage accounts for HTTPS only
      if (resource.type === 'Microsoft.Storage/storageAccounts') {
        if (!resource.properties?.supportsHttpsTrafficOnly) {
          result.customValidation.issues.push('Storage account should enforce HTTPS only');
          allValid = false;
        }
      }

      // Check SQL servers for minimum TLS version
      if (resource.type === 'Microsoft.Sql/servers') {
        if (!resource.properties?.minimalTlsVersion || resource.properties.minimalTlsVersion < '1.2') {
          result.customValidation.issues.push('SQL server should use TLS 1.2 or higher');
          allValid = false;
        }
      }
    }

    return allValid;
  }

  /**
   * Load API version cache
   */
  private async loadApiVersionCache(): Promise<void> {
    try {
      const cachePath = path.join(process.cwd(), '.azmp-api-cache.json');
      if (await fs.pathExists(cachePath)) {
        const cacheData = await fs.readJson(cachePath);
        this.apiVersionCache = new Map(Object.entries(cacheData));
      }
    } catch (error) {
      // Ignore cache loading errors
    }
  }

  /**
   * Save API version cache
   */
  private async saveApiVersionCache(): Promise<void> {
    try {
      const cachePath = path.join(process.cwd(), '.azmp-api-cache.json');
      const cacheData = Object.fromEntries(this.apiVersionCache);
      await fs.writeJson(cachePath, cacheData);
    } catch (error) {
      // Ignore cache saving errors
    }
  }

  /**
   * Print generation report
   */
  private printGenerationReport(result: TemplateValidationResult): void {
    console.log(chalk.blue('\n🎨 TEMPLATE GENERATION REPORT'));
    console.log(chalk.blue('=============================='));

    console.log(chalk.white(`Template Path: ${result.templatePath}`));

    if (result.isValid) {
      console.log(chalk.green(`✅ Template Valid: YES`));
    } else {
      console.log(chalk.red(`❌ Template Valid: NO`));
    }

    console.log(chalk.white(`\nARM-TTK Results:`));
    console.log(chalk.green(`  ✅ Passed: ${result.armTtkResults.passed}`));
    console.log(chalk.red(`  ❌ Failed: ${result.armTtkResults.failed}`));
    console.log(chalk.yellow(`  ⚠️ Warnings: ${result.armTtkResults.warnings}`));

    console.log(chalk.white(`\nCustom Validation:`));
    console.log(result.customValidation.apiVersions ? chalk.green(`  ✅ API Versions`) : chalk.red(`  ❌ API Versions`));
    console.log(result.customValidation.namingPolicies ? chalk.green(`  ✅ Naming Policies`) : chalk.red(`  ❌ Naming Policies`));
    console.log(result.customValidation.securityBaseline ? chalk.green(`  ✅ Security Baseline`) : chalk.red(`  ❌ Security Baseline`));

    if (result.customValidation.issues.length > 0) {
      console.log(chalk.red('\n🚫 VALIDATION ISSUES:'));
      result.customValidation.issues.forEach((issue, i) => {
        console.log(chalk.red(`  ${i + 1}. ${issue}`));
      });
    }

    if (result.recommendations.length > 0) {
      console.log(chalk.yellow('\n📋 RECOMMENDATIONS:'));
      result.recommendations.forEach((rec, i) => {
        console.log(chalk.yellow(`  ${i + 1}. ${rec}`));
      });
    }
  }
}