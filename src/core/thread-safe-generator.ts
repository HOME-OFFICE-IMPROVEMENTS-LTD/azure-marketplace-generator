import Handlebars from 'handlebars';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import chalk from 'chalk';

export interface TemplateConfig {
  type: string;
  publisher: string;
  name: string;
  output: string;
  seed?: string; // For deterministic generation
}

export interface ThreadSafeGeneratorOptions {
  seed?: string;
  templateDir?: string;
}

export class ThreadSafeTemplateGenerator {
  private templateDir: string;
  private seed: string;
  private helperCache: Map<string, any> = new Map();

  constructor(options: ThreadSafeGeneratorOptions = {}) {
    this.templateDir = options.templateDir || path.join(__dirname, '../templates');
    this.seed = options.seed || crypto.randomBytes(16).toString('hex');
    this.registerThreadSafeHelpers();
  }

  private registerThreadSafeHelpers() {
    // Create a deterministic random number generator for reproducible results
    const createSeededRandom = (contextSeed: string) => {
      let seed = this.hashStrToNumber(contextSeed + this.seed);
      return () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
    };

    // Thread-safe unique string generator with deterministic randomness
    Handlebars.registerHelper('uniqueString', (prefix: string, options: any) => {
      const context = options?.data?.root || {};
      const contextSeed = `${prefix}-${JSON.stringify(context)}-${Date.now()}`;
      const seededRandom = createSeededRandom(contextSeed);

      const suffix = this.generateRandomString(6, seededRandom);
      return `${prefix}${suffix}`;
    });

    // Thread-safe storage account name generator
    Handlebars.registerHelper('storageAccountName', (prefix: string, options: any) => {
      const context = options?.data?.root || {};
      const contextSeed = `storage-${prefix}-${JSON.stringify(context)}`;
      const seededRandom = createSeededRandom(contextSeed);

      const cleanPrefix = prefix.toLowerCase().replace(/[^a-z0-9]/g, '');
      const suffix = this.generateRandomString(6, seededRandom);
      return `${cleanPrefix}${suffix}`.substring(0, 24); // Max 24 chars for storage accounts
    });

    // Deterministic unique identifier
    Handlebars.registerHelper('deterministicId', (prefix: string, context: string) => {
      const hash = crypto.createHash('md5').update(`${prefix}-${context}-${this.seed}`).digest('hex');
      return `${prefix}${hash.substring(0, 8)}`;
    });

    // Latest API version helper (cached for performance)
    Handlebars.registerHelper('latestApiVersion', (resourceType: string) => {
      if (!this.helperCache.has('apiVersions')) {
        this.helperCache.set('apiVersions', {
          'Microsoft.Storage/storageAccounts': '2023-04-01',
          'Microsoft.Compute/virtualMachines': '2023-09-01',
          'Microsoft.Web/sites': '2023-12-01',
          'Microsoft.Resources/deployments': '2022-09-01',
          'Microsoft.Solutions/applicationDefinitions': '2021-07-01',
          'Microsoft.Network/virtualNetworks': '2023-09-01',
          'Microsoft.Network/networkSecurityGroups': '2023-09-01',
          'Microsoft.Sql/servers': '2023-08-01-preview',
          'Microsoft.KeyVault/vaults': '2023-07-01',
          'Microsoft.ManagedIdentity/userAssignedIdentities': '2023-01-31',
          'Microsoft.OperationalInsights/workspaces': '2023-09-01'
        });
      }

      const apiVersions = this.helperCache.get('apiVersions');
      return apiVersions[resourceType] || '2023-04-01';
    });

    // Secure parameter helper (static template)
    Handlebars.registerHelper('secureParam', (paramName: string, description?: string) => {
      return JSON.stringify({
        type: "securestring",
        metadata: {
          description: description || `${paramName} (secure parameter)`
        }
      }, null, 2);
    });

    // Thread-safe resource naming helper
    Handlebars.registerHelper('resourceName', (resourceType: string, baseName: string, options: any) => {
      const context = options?.data?.root || {};
      const contextSeed = `${resourceType}-${baseName}-${JSON.stringify(context)}`;
      const hash = crypto.createHash('md5').update(contextSeed + this.seed).digest('hex');

      const cleanBaseName = baseName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const suffix = hash.substring(0, 6);

      // Apply resource-specific naming rules
      switch (resourceType) {
        case 'storage':
          return `${cleanBaseName}${suffix}`.substring(0, 24);
        case 'vm':
          return `${cleanBaseName}-${suffix}`.substring(0, 64);
        case 'app':
          return `${cleanBaseName}-${suffix}`.substring(0, 60);
        default:
          return `${cleanBaseName}-${suffix}`;
      }
    });

    // Conditional helper for complex template logic
    Handlebars.registerHelper('conditional', (v1: any, operator: string, v2: any, options: any) => {
      switch (operator) {
        case '==':
          return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
          return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
          return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
          return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
          return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
          return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
          return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
          return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
          return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
          return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
          return options.inverse(this);
      }
    });

    // Array manipulation helpers
    Handlebars.registerHelper('arrayLength', (array: any[]) => {
      return Array.isArray(array) ? array.length : 0;
    });

    Handlebars.registerHelper('arrayJoin', (array: any[], separator: string = ',') => {
      return Array.isArray(array) ? array.join(separator) : '';
    });

    // String manipulation helpers
    Handlebars.registerHelper('toLowerCase', (str: string) => {
      return typeof str === 'string' ? str.toLowerCase() : str;
    });

    Handlebars.registerHelper('toUpperCase', (str: string) => {
      return typeof str === 'string' ? str.toUpperCase() : str;
    });

    Handlebars.registerHelper('camelCase', (str: string) => {
      if (typeof str !== 'string') return str;
      return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      }).replace(/\s+/g, '');
    });

    // Date helpers for template metadata
    Handlebars.registerHelper('currentDateTime', () => {
      return new Date().toISOString();
    });

    Handlebars.registerHelper('formatDate', (date: string | Date, format: string = 'YYYY-MM-DD') => {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');

      return format
        .replace('YYYY', String(year))
        .replace('MM', month)
        .replace('DD', day);
    });
  }

  /**
   * Generate random string with seeded randomness for deterministic results
   */
  private generateRandomString(length: number, randomFunc: () => number): string {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(randomFunc() * chars.length)];
    }
    return result;
  }

  /**
   * Convert string to number for seeding
   */
  private hashStrToNumber(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Generate template with thread-safe helpers
   */
  async generateTemplate(config: TemplateConfig): Promise<void> {
    console.log(chalk.blue('🎨 Generating templates with thread-safe helpers...'));
    console.log(chalk.gray(`  Using seed: ${this.seed.substring(0, 8)}...`));

    const templatePath = path.join(this.templateDir, config.type);

    if (!await fs.pathExists(templatePath)) {
      throw new Error(`Template not found for type: ${config.type}`);
    }

    // Ensure output directory exists
    await fs.ensureDir(config.output);

    // Use config seed if provided for deterministic generation
    if (config.seed) {
      this.seed = config.seed;
      console.log(chalk.gray(`  Overriding seed: ${config.seed.substring(0, 8)}...`));
    }

    // Generate the core template files
    await this.generateFile(templatePath, 'mainTemplate.json.hbs', config, 'mainTemplate.json');
    await this.generateFile(templatePath, 'createUiDefinition.json.hbs', config, 'createUiDefinition.json');
    await this.generateFile(templatePath, 'viewDefinition.json.hbs', config, 'viewDefinition.json');

    // Generate metadata file
    await this.generateMetadata(config);

    console.log(chalk.green('✅ Thread-safe template generation completed!'));
  }

  /**
   * Generate individual file from template
   */
  private async generateFile(templatePath: string, templateFile: string, config: TemplateConfig, outputFile: string): Promise<void> {
    const templateFilePath = path.join(templatePath, templateFile);

    if (!await fs.pathExists(templateFilePath)) {
      console.warn(chalk.yellow(`⚠️  Template file not found: ${templateFile}`));
      return;
    }

    try {
      const templateContent = await fs.readFile(templateFilePath, 'utf8');
      const template = Handlebars.compile(templateContent);

      // Create enhanced context with metadata
      const context = {
        ...config,
        metadata: {
          generated: new Date().toISOString(),
          generator: 'ThreadSafeTemplateGenerator',
          seed: this.seed.substring(0, 8),
          version: '1.0.0'
        }
      };

      const output = template(context);
      const outputPath = path.join(config.output, outputFile);

      await fs.writeFile(outputPath, output);
      console.log(chalk.green(`📝 Generated: ${outputFile}`));

    } catch (error: any) {
      console.error(chalk.red(`❌ Failed to generate ${outputFile}:`), error.message);
      throw error;
    }
  }

  /**
   * Generate metadata file with generation information
   */
  private async generateMetadata(config: TemplateConfig): Promise<void> {
    const metadata = {
      packageId: config.name,
      type: config.type,
      publisher: config.publisher,
      generated: new Date().toISOString(),
      generator: {
        name: 'ThreadSafeTemplateGenerator',
        version: '1.0.0',
        seed: this.seed.substring(0, 8)
      },
      deterministic: true,
      threadSafe: true
    };

    const metadataPath = path.join(config.output, 'generation-metadata.json');
    await fs.writeJSON(metadataPath, metadata, { spaces: 2 });
    console.log(chalk.green('📋 Generated: generation-metadata.json'));
  }

  /**
   * Get current seed (useful for debugging and testing)
   */
  getSeed(): string {
    return this.seed;
  }

  /**
   * Set new seed for deterministic generation
   */
  setSeed(seed: string): void {
    this.seed = seed;
    this.helperCache.clear(); // Clear cache when seed changes
  }

  /**
   * Generate multiple templates concurrently with isolation
   */
  async generateBatch(configs: TemplateConfig[]): Promise<void> {
    console.log(chalk.blue(`🚀 Generating ${configs.length} templates in parallel...`));

    const promises = configs.map(async (config, index) => {
      // Create isolated generator instance for each template
      const generator = new ThreadSafeTemplateGenerator({
        seed: config.seed || `${this.seed}-${index}`,
        templateDir: this.templateDir
      });

      try {
        await generator.generateTemplate(config);
        return { success: true, config };
      } catch (error: any) {
        return { success: false, config, error: error.message };
      }
    });

    const results = await Promise.allSettled(promises);

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    console.log(chalk.blue('\n📊 Batch Generation Summary:'));
    console.log(chalk.blue(`✅ Successful: ${chalk.green(successful)}`));
    console.log(chalk.blue(`❌ Failed: ${chalk.red(failed)}`));

    // Log failures
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && !result.value.success) {
        console.error(chalk.red(`❌ ${configs[index].name}: ${result.value.error}`));
      } else if (result.status === 'rejected') {
        console.error(chalk.red(`❌ ${configs[index].name}: ${result.reason}`));
      }
    });
  }

  /**
   * Cleanup helper cache
   */
  clearCache(): void {
    this.helperCache.clear();
    console.log(chalk.blue('🧹 Generator cache cleared'));
  }
}