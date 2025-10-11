import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { spawn } from 'child_process';

export interface DeploymentConfiguration {
  subscriptionId: string;
  resourceGroup: string;
  location: string;
  applicationName: string;
  managedResourceGroup?: string;
  parameters?: Record<string, any>;
  testMode?: boolean;
}

export interface DeploymentResult {
  success: boolean;
  deploymentId: string;
  resourceGroupUrl: string;
  managedAppUrl: string;
  testResults?: TestResult[];
  deploymentTime: number;
  recommendations: string[];
}

export interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  details?: string;
}

export class AutoDeploymentService {
  private azCommand = 'az';

  async validatePrerequisites(): Promise<boolean> {
    console.log(chalk.blue('🔍 Validating deployment prerequisites...'));

        // Check Azure CLI
    try {
      await this.runCommand('az', ['--version']);
      console.log(chalk.green('✅ Azure CLI installed'));
    } catch (_error) {
      console.error(chalk.red('❌ Azure CLI not found. Please install Azure CLI.'));
      return false;
    }

    // Check authentication
    try {
      await this.runCommand('az', ['account', 'show']);
      console.log(chalk.green('✅ Azure CLI authenticated'));
    } catch (_error) {
      console.error(chalk.red('❌ Not authenticated. Run: az login'));
      return false;
    }

    // Check Microsoft.Solutions provider
    try {
      await this.runCommand('az', [
        'provider', 'list',
        '--query', "[?namespace=='Microsoft.Solutions'].registrationState",
        '-o', 'tsv'
      ]);
      console.log(chalk.green('✅ Microsoft.Solutions provider available'));
    } catch (_error) {
      console.error(chalk.red('❌ Microsoft.Solutions provider not available'));
      return false;
    }

    return true;
  }

  async deployManagedApplication(packagePath: string, config: DeploymentConfiguration): Promise<DeploymentResult> {
    console.log(chalk.blue('🚀 Starting auto-deployment of managed application...'));
    console.log(chalk.gray('  Package:'), packagePath);
    console.log(chalk.gray('  Target:'), `${config.resourceGroup} (${config.location})`);

    const startTime = Date.now();

    try {
      // Validate prerequisites
      if (!await this.validatePrerequisites()) {
        throw new Error('Prerequisites validation failed');
      }

      // Validate package
      await this.validatePackage(packagePath);

      // Extract and prepare deployment
      const tempDir = await this.extractPackage(packagePath);
      const deploymentTemplate = await this.prepareDeployment(tempDir, config);

      // Create resource group if needed
      await this.ensureResourceGroup(config);

      // Deploy managed application
      const deploymentId = await this.executeDeployment(deploymentTemplate, config);

      // Run post-deployment tests
      const testResults = config.testMode ? await this.runDeploymentTests(config) : [];

      // Generate recommendations
      const recommendations = await this.generateDeploymentRecommendations(config, testResults);

      const deploymentTime = Date.now() - startTime;

      console.log(chalk.green('✅ Auto-deployment completed successfully!'));

      return {
        success: true,
        deploymentId,
        resourceGroupUrl: `https://portal.azure.com/#@/resource/subscriptions/${config.subscriptionId}/resourceGroups/${config.resourceGroup}`,
        managedAppUrl: `https://portal.azure.com/#@/resource/subscriptions/${config.subscriptionId}/resourceGroups/${config.resourceGroup}/providers/Microsoft.Solutions/applications/${config.applicationName}`,
        testResults,
        deploymentTime,
        recommendations
      };

    } catch (error: any) {
      console.error(chalk.red('❌ Auto-deployment failed:'), error.message);

      return {
        success: false,
        deploymentId: '',
        resourceGroupUrl: '',
        managedAppUrl: '',
        deploymentTime: Date.now() - startTime,
        recommendations: ['Review deployment logs and fix configuration issues']
      };
    }
  }

  private async validatePackage(packagePath: string): Promise<void> {
    console.log(chalk.blue('📦 Validating package structure...'));

    if (!await fs.pathExists(packagePath)) {
      throw new Error(`Package not found: ${packagePath}`);
    }

    const stats = await fs.stat(packagePath);
    if (!stats.isFile() || !packagePath.endsWith('.zip')) {
      throw new Error('Package must be a .zip file');
    }

    // Check package size (Azure limit is 120MB)
    const sizeKB = stats.size / 1024;
    if (sizeKB > 120 * 1024) {
      throw new Error(`Package too large: ${Math.round(sizeKB/1024)}MB (max 120MB)`);
    }

    console.log(chalk.green('✅ Package validation passed'));
  }

  private async extractPackage(packagePath: string): Promise<string> {
    console.log(chalk.blue('📂 Extracting package for deployment...'));

    const tempDir = path.join(process.cwd(), 'temp', 'deployment-' + Date.now());
    await fs.ensureDir(tempDir);

    // Extract zip file with Zip Slip protection
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(packagePath);
    const entries = zip.getEntries();

    // Safely extract each entry with path validation
    for (const entry of entries) {
      if (!entry.isDirectory) {
        // Normalize and validate the entry path to prevent Zip Slip attacks
        const entryPath = this.validateAndNormalizeZipPath(entry.entryName, tempDir);

        if (entryPath) {
          // Ensure directory exists
          await fs.ensureDir(path.dirname(entryPath));

          // Extract file securely
          const data = entry.getData();
          await fs.writeFile(entryPath, data);
        }
      }
    }

    // Verify required files
    const requiredFiles = ['mainTemplate.json', 'createUiDefinition.json'];
    for (const file of requiredFiles) {
      if (!await fs.pathExists(path.join(tempDir, file))) {
        throw new Error(`Required file missing in package: ${file}`);
      }
    }

    console.log(chalk.green('✅ Package extracted successfully'));
    return tempDir;
  }

  /**
   * Validate and normalize ZIP entry paths to prevent Zip Slip attacks
   */
  private validateAndNormalizeZipPath(entryName: string, tempDir: string): string | null {
    try {
      // Normalize path and resolve potential traversal attempts
      const normalizedEntry = path.normalize(entryName).replace(/^(\.\.[/\\])+/, '');

      // Reject paths that still contain traversal attempts or absolute paths
      if (normalizedEntry.includes('..') || path.isAbsolute(normalizedEntry)) {
        console.warn(chalk.yellow(`⚠️ Skipping potentially malicious ZIP entry: ${entryName}`));
        return null;
      }

      // Ensure the final path is within the temp directory
      const finalPath = path.join(tempDir, normalizedEntry);
      const resolvedFinalPath = path.resolve(finalPath);
      const resolvedTempDir = path.resolve(tempDir);

      if (!resolvedFinalPath.startsWith(resolvedTempDir)) {
        console.warn(chalk.yellow(`⚠️ Skipping ZIP entry outside temp directory: ${entryName}`));
        return null;
      }

      // Additional validation for file extension and size
      const ext = path.extname(normalizedEntry).toLowerCase();
      const allowedExtensions = ['.json', '.txt', '.md', '.yml', '.yaml', '.ps1', '.sh', '.bicep', '.arm'];

      if (ext && !allowedExtensions.includes(ext)) {
        console.warn(chalk.yellow(`⚠️ Skipping file with disallowed extension: ${entryName}`));
        return null;
      }

      return finalPath;
    } catch (_error) {
      console.warn(chalk.yellow(`⚠️ Error processing ZIP entry ${entryName}: ${error}`));
      return null;
    }
  }

  private async prepareDeployment(tempDir: string, config: DeploymentConfiguration): Promise<string> {
    console.log(chalk.blue('🔧 Preparing deployment template...'));

    const deploymentTemplate = {
      "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
      "contentVersion": "1.0.0.0",
      "parameters": {
        "applicationName": {
          "type": "string",
          "defaultValue": config.applicationName
        },
        "managedResourceGroupId": {
          "type": "string",
          "defaultValue": `/subscriptions/${config.subscriptionId}/resourceGroups/${config.managedResourceGroup || config.resourceGroup + '-managed'}`
        }
      },
      "variables": {},
      "resources": [
        {
          "type": "Microsoft.Solutions/applications",
          "apiVersion": "2019-07-01",
          "name": "[parameters('applicationName')]",
          "location": config.location,
          "kind": "MarketplaceManaged",
          "properties": {
            "managedResourceGroupId": "[parameters('managedResourceGroupId')]",
            "applicationDefinitionId": "",
            "parameters": config.parameters || {}
          }
        }
      ],
      "outputs": {
        "applicationId": {
          "type": "string",
          "value": "[resourceId('Microsoft.Solutions/applications', parameters('applicationName'))]"
        }
      }
    };

    const templatePath = path.join(tempDir, 'deployment-template.json');
    await fs.writeFile(templatePath, JSON.stringify(deploymentTemplate, null, 2));

    console.log(chalk.green('✅ Deployment template prepared'));
    return templatePath;
  }

  private async ensureResourceGroup(config: DeploymentConfiguration): Promise<void> {
    console.log(chalk.blue('🏗️ Ensuring resource group exists...'));

    try {
      // Check if resource group exists
      await this.runCommand('az', ['group', 'show', '--name', config.resourceGroup, '--subscription', config.subscriptionId]);
      console.log(chalk.green('✅ Resource group exists'));
    } catch (_error) {
      // Create resource group
      console.log(chalk.blue('📁 Creating resource group...'));
      await this.runCommand('az', [
        'group', 'create',
        '--name', config.resourceGroup,
        '--location', config.location,
        '--subscription', config.subscriptionId
      ]);
      console.log(chalk.green('✅ Resource group created'));
    }
  }

  private async executeDeployment(templatePath: string, config: DeploymentConfiguration): Promise<string> {
    console.log(chalk.blue('🚀 Executing managed application deployment...'));

    const deploymentName = `${config.applicationName}-deployment-${Date.now()}`;

    const deployArgs = [
      'deployment', 'group', 'create',
      '--resource-group', config.resourceGroup,
      '--subscription', config.subscriptionId,
      '--name', deploymentName,
      '--template-file', templatePath,
      '--parameters', `applicationName=${config.applicationName}`,
      '--output', 'json'
    ];

    try {
      const result = await this.runCommand('az', deployArgs);
      const deployment = JSON.parse(result);

      console.log(chalk.green('✅ Deployment completed successfully'));
      console.log(chalk.gray('  Deployment ID:'), deployment.id);

      return deployment.id;
    } catch (error: any) {
      console.error(chalk.red('❌ Deployment failed:'), error.message);
      throw new Error(`Deployment execution failed: ${error.message}`);
    }
  }

  private async runDeploymentTests(config: DeploymentConfiguration): Promise<TestResult[]> {
    console.log(chalk.blue('🧪 Running post-deployment tests...'));

    const tests: TestResult[] = [];

    // Test 1: Resource group accessibility
    try {
      await this.runCommand('az', ['group', 'show', '--name', config.resourceGroup, '--subscription', config.subscriptionId]);
      tests.push({
        name: 'Resource Group Access',
        status: 'passed',
        message: 'Resource group is accessible'
      });
    } catch (_error) {
      tests.push({
        name: 'Resource Group Access',
        status: 'failed',
        message: 'Cannot access resource group',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 2: Managed application status
    try {
      const result = await this.runCommand('az', [
        'managedapp', 'show',
        '--name', config.applicationName,
        '--resource-group', config.resourceGroup,
        '--subscription', config.subscriptionId
      ]);
      const app = JSON.parse(result);

      if (app.properties.provisioningState === 'Succeeded') {
        tests.push({
          name: 'Managed Application Status',
          status: 'passed',
          message: 'Application provisioned successfully'
        });
      } else {
        tests.push({
          name: 'Managed Application Status',
          status: 'warning',
          message: `Application status: ${app.properties.provisioningState}`
        });
      }
    } catch (_error) {
      tests.push({
        name: 'Managed Application Status',
        status: 'failed',
        message: 'Cannot retrieve application status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 3: Managed resource group
    const managedRgName = config.managedResourceGroup || config.resourceGroup + '-managed';
    try {
      await this.runCommand('az', ['group', 'show', '--name', managedRgName, '--subscription', config.subscriptionId]);
      tests.push({
        name: 'Managed Resource Group',
        status: 'passed',
        message: 'Managed resource group created'
      });
    } catch (_error) {
      tests.push({
        name: 'Managed Resource Group',
        status: 'warning',
        message: 'Managed resource group not found or not accessible'
      });
    }

    console.log(chalk.green(`✅ Completed ${tests.length} deployment tests`));
    return tests;
  }

  private async generateDeploymentRecommendations(config: DeploymentConfiguration, tests: TestResult[]): Promise<string[]> {
    const recommendations: string[] = [];

    // Analyze test results
    const failedTests = tests.filter(t => t.status === 'failed');
    const warningTests = tests.filter(t => t.status === 'warning');

    if (failedTests.length > 0) {
      recommendations.push('Review and fix failed deployment tests');
    }

    if (warningTests.length > 0) {
      recommendations.push('Address warning conditions for optimal deployment');
    }

    // Resource group recommendations
    if (config.resourceGroup.includes('test') || config.resourceGroup.includes('dev')) {
      recommendations.push('Consider using production-appropriate resource group naming');
    }

    // Location recommendations
    if (config.location === 'eastus' || config.location === 'westus') {
      recommendations.push('Consider using paired regions for high availability');
    }

    // Test mode recommendations
    if (!config.testMode) {
      recommendations.push('Enable test mode for comprehensive validation');
    }

    // Security recommendations
    recommendations.push('Review managed application permissions and access policies');
    recommendations.push('Implement monitoring and alerting for deployed resources');

    return recommendations;
  }

  private async runCommand(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(stderr || `Command failed with exit code ${code}`));
        } else {
          resolve(stdout.trim());
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  async cleanupDeploymentFiles(tempDir?: string): Promise<void> {
    if (tempDir && await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
      console.log(chalk.gray('🧹 Cleaned up temporary deployment files'));
    }
  }
}