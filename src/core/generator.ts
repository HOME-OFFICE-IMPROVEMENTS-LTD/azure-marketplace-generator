import Handlebars from 'handlebars';
import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { AppConfig } from '../config/app-config';

export interface TemplateConfig {
  type: string;
  publisher: string;
  name: string;
  output: string;
  // Add more config as needed
}

export class TemplateGenerator {
  private templateDir: string;

  constructor() {
    this.templateDir = AppConfig.getTemplatesDir();
    this.registerHelpers();
  }

  private registerHelpers() {
    // Custom Handlebars helpers for ARM templates

    // Generate unique string (Trade Secret: Azure requires unique resource names)
    Handlebars.registerHelper('uniqueString', (prefix: string) => {
      const suffix = Math.random().toString(36).substring(2, 8);
      return `${prefix}${suffix}`;
    });

    // Generate storage account name (Trade Secret: Must be lowercase, no special chars)
    Handlebars.registerHelper('storageAccountName', (prefix: string) => {
      const cleanPrefix = prefix.toLowerCase().replace(/[^a-z0-9]/g, '');
      const suffix = Math.random().toString(36).substring(2, 8);
      return `${cleanPrefix}${suffix}`.substring(0, 24); // Max 24 chars for storage accounts
    });

    // Latest API version helper
    Handlebars.registerHelper('latestApiVersion', (resourceType: string) => {
      // Updated fallback API versions
      const fallbackVersions: { [key: string]: string } = {
        'Microsoft.Storage/storageAccounts': '2023-04-01',
        'Microsoft.Compute/virtualMachines': '2023-09-01',
        'Microsoft.Web/sites': '2023-12-01',
        'Microsoft.KeyVault/vaults': '2023-07-01',
        'Microsoft.Sql/servers': '2023-08-01-preview',
        'Microsoft.Resources/deployments': '2022-09-01',
        'Microsoft.ManagedIdentity/userAssignedIdentities': '2023-01-31',
        'Microsoft.OperationalInsights/workspaces': '2023-09-01',
        'Microsoft.Network/networkSecurityGroups': '2023-09-01'
      };

      return fallbackVersions[resourceType] || '2023-04-01';
    });

    // Secure parameter helper (Trade Secret: All passwords must use @secure())
    Handlebars.registerHelper('secureParam', (paramName: string) => {
      return `"${paramName}": {
      "type": "securestring",
      "metadata": {
        "description": "${paramName} (secure parameter)"
      }
    }`;
    });
  }

  async generateTemplate(config: TemplateConfig): Promise<void> {
    console.log(chalk.blue('🎨 Generating templates from Handlebars...'));

    const templatePath = path.join(this.templateDir, config.type);

    if (!await fs.pathExists(templatePath)) {
      throw new Error(`Template not found for type: ${config.type}`);
    }

    // Ensure output directory exists
    await fs.ensureDir(config.output);

    // Generate the 3 core files
    await this.generateFile(templatePath, 'mainTemplate.json.hbs', config, 'mainTemplate.json');
    await this.generateFile(templatePath, 'createUiDefinition.json.hbs', config, 'createUiDefinition.json');
    await this.generateFile(templatePath, 'viewDefinition.json.hbs', config, 'viewDefinition.json');

    // Generate nested templates if they exist
    const nestedDir = path.join(templatePath, 'nestedtemplates');
    if (await fs.pathExists(nestedDir)) {
      const nestedOutputDir = path.join(config.output, 'nestedtemplates');
      await fs.ensureDir(nestedOutputDir);

      const nestedFiles = await fs.readdir(nestedDir);
      for (const file of nestedFiles) {
        if (file.endsWith('.hbs')) {
          const outputName = file.replace('.hbs', '');
          await this.generateFile(nestedDir, file, config, outputName, nestedOutputDir);
        }
      }
    }

    console.log(chalk.green('✅ Templates generated successfully!'));
  }

  private async generateFile(
    templateDir: string,
    templateFile: string,
    config: TemplateConfig,
    outputFile: string,
    outputDir?: string
  ): Promise<void> {
    const templatePath = path.join(templateDir, templateFile);
    const outputPath = path.join(outputDir || config.output, outputFile);

    if (!await fs.pathExists(templatePath)) {
      console.log(chalk.yellow(`⚠️  Template file not found: ${templateFile}`));
      return;
    }

    const templateContent = await fs.readFile(templatePath, 'utf8');
    const template = Handlebars.compile(templateContent);

    // Generate context for template
    const context = {
      ...config,
      // Trade Secret: Add current date for metadata
      generatedDate: new Date().toISOString(),
      // Trade Secret: Add schema URLs (required for marketplace)
      armSchemaUrl: 'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#',
      uiSchemaUrl: 'https://schema.management.azure.com/schemas/0.1.2-preview/CreateUIDefinition.MultiVm.json#'
    };

    const result = template(context);
    await fs.writeFile(outputPath, result, 'utf8');

    console.log(chalk.gray(`  Generated: ${outputFile}`));
  }
}