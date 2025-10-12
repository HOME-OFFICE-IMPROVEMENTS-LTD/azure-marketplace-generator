import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import { AutoDeploymentService, DeploymentConfiguration } from '../../services/auto-deployment-service';

export const deployCommand = new Command('deploy')
  .description('Auto-deploy managed application to Azure')
  .argument('<package>', 'Path to packaged managed application (.zip)')
  .option('-s, --subscription <id>', 'Azure subscription ID')
  .option('-g, --resource-group <name>', 'Target resource group name')
  .option('-l, --location <region>', 'Azure region for deployment', 'eastus')
  .option('-n, --name <name>', 'Managed application name')
  .option('--managed-rg <name>', 'Managed resource group name (optional)')
  .option('--test-mode', 'Enable comprehensive post-deployment testing')
  .option('--auto-approve', 'Skip deployment confirmation prompts')
  .option('--parameters <json>', 'JSON string of deployment parameters')
  .option('--timeout <minutes>', 'Deployment timeout in minutes', '30')
  .action(async (packagePath: string, options: any) => {
    console.log(chalk.blue.bold('🚀 PHASE 3: AUTO-DEPLOYMENT ACTIVE'));
    console.log(chalk.gray('  Package:'), packagePath);
    console.log(chalk.gray('  Target:'), options.resourceGroup || '[interactive]');

    try {
      // Validate package exists
      if (!await fs.pathExists(packagePath)) {
        throw new Error(`Package not found: ${packagePath}`);
      }

      // Interactive configuration if not provided
      const config = await buildDeploymentConfig(packagePath, options);

      // Display deployment plan
      await displayDeploymentPlan(config);

      // Confirmation prompt (unless auto-approved)
      if (!options.autoApprove) {
        const confirmed = await confirmDeployment();
        if (!confirmed) {
          console.log(chalk.yellow('⏹️ Deployment cancelled'));
          return;
        }
      }

      // Initialize auto-deployment service
      const deploymentService = new AutoDeploymentService();

      // Execute auto-deployment
      console.log(chalk.blue('\n⚡ Starting auto-deployment process...'));
      const result = await deploymentService.deployManagedApplication(packagePath, config);

      // Display results
      await displayDeploymentResults(result);

      // Cleanup
      console.log(chalk.gray('\n🧹 Cleaning up temporary files...'));
      await deploymentService.cleanupDeploymentFiles();

      if (result.success) {
        console.log(chalk.green.bold('\n🎉 AUTO-DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉'));
        if (result.testResults && result.testResults.every(t => t.status === 'passed')) {
          console.log(chalk.green('🏆 ALL DEPLOYMENT TESTS PASSED!'));
        }
      } else {
        console.log(chalk.red.bold('\n❌ AUTO-DEPLOYMENT FAILED'));
        console.log(chalk.yellow('💡 Check the logs above for troubleshooting guidance'));
        process.exit(1);
      }

    } catch (error: any) {
      console.error(chalk.red('❌ Deployment error:'), error.message);
      console.log(chalk.blue('\n💡 Troubleshooting:'));
      console.log(chalk.blue('   • Verify Azure CLI authentication: az login'));
      console.log(chalk.blue('   • Check subscription permissions'));
      console.log(chalk.blue('   • Validate package structure'));
      console.log(chalk.blue('   • Run with --test-mode for detailed validation'));
      process.exit(1);
    }
  });

async function buildDeploymentConfig(packagePath: string, options: any): Promise<DeploymentConfiguration> {
  const inquirer = require('inquirer');

  // Get package name for defaults
  const packageName = path.basename(packagePath, '.zip');
  const defaultAppName = packageName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  let config: DeploymentConfiguration = {
    subscriptionId: options.subscription || '',
    resourceGroup: options.resourceGroup || '',
    location: options.location || 'eastus',
    applicationName: options.name || defaultAppName,
    managedResourceGroup: options.managedRg,
    testMode: options.testMode || false
  };

  // Parse parameters if provided
  if (options.parameters) {
    try {
      config.parameters = JSON.parse(options.parameters);
    } catch (_error) {
      throw new Error('Invalid JSON format for parameters');
    }
  }

  // Interactive prompts for missing required fields
  if (!config.subscriptionId || !config.resourceGroup) {
    console.log(chalk.blue('\n📋 Deployment Configuration Setup:'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'subscriptionId',
        message: 'Azure Subscription ID:',
        when: !config.subscriptionId,
        validate: (input: string) => input.length > 0 || 'Subscription ID is required'
      },
      {
        type: 'input',
        name: 'resourceGroup',
        message: 'Resource Group Name:',
        when: !config.resourceGroup,
        default: `${defaultAppName}-rg`,
        validate: (input: string) => input.length > 0 || 'Resource group name is required'
      },
      {
        type: 'input',
        name: 'applicationName',
        message: 'Managed Application Name:',
        default: config.applicationName,
        validate: (input: string) => input.length > 0 || 'Application name is required'
      },
      {
        type: 'list',
        name: 'location',
        message: 'Azure Region:',
        choices: [
          'eastus', 'eastus2', 'westus', 'westus2', 'westus3',
          'centralus', 'southcentralus', 'northcentralus',
          'westeurope', 'northeurope', 'uksouth', 'ukwest',
          'southeastasia', 'eastasia', 'japaneast', 'japanwest',
          'australiaeast', 'australiasoutheast', 'brazilsouth'
        ],
        default: config.location
      },
      {
        type: 'confirm',
        name: 'testMode',
        message: 'Enable comprehensive post-deployment testing?',
        default: true
      }
    ]);

    // Merge answers with config
    Object.assign(config, answers);
  }

  return config;
}

async function displayDeploymentPlan(config: DeploymentConfiguration): Promise<void> {
  console.log(chalk.blue('\n📋 DEPLOYMENT PLAN:'));
  console.log(chalk.blue('='.repeat(50)));
  console.log(chalk.gray('  Subscription:'), config.subscriptionId);
  console.log(chalk.gray('  Resource Group:'), config.resourceGroup);
  console.log(chalk.gray('  Location:'), config.location);
  console.log(chalk.gray('  Application:'), config.applicationName);
  console.log(chalk.gray('  Managed RG:'), config.managedResourceGroup || `${config.resourceGroup}-managed`);
  console.log(chalk.gray('  Test Mode:'), config.testMode ? 'Enabled' : 'Disabled');

  if (config.parameters) {
    console.log(chalk.gray('  Parameters:'), Object.keys(config.parameters).length + ' provided');
  }

  console.log(chalk.blue('='.repeat(50)));
}

async function confirmDeployment(): Promise<boolean> {
  const inquirer = require('inquirer');

  const answer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'proceed',
      message: 'Proceed with deployment?',
      default: false
    }
  ]);

  return answer.proceed;
}

async function displayDeploymentResults(result: any): Promise<void> {
  console.log(chalk.blue('\n📊 DEPLOYMENT RESULTS:'));
  console.log(chalk.blue('='.repeat(50)));

  if (result.success) {
    console.log(chalk.green('✅ Status:'), 'SUCCESS');
    console.log(chalk.gray('  Deployment ID:'), result.deploymentId);
    console.log(chalk.gray('  Duration:'), `${Math.round(result.deploymentTime / 1000)}s`);
    console.log(chalk.blue('  Resource Group:'), result.resourceGroupUrl);
    console.log(chalk.blue('  Managed App:'), result.managedAppUrl);
  } else {
    console.log(chalk.red('❌ Status:'), 'FAILED');
    console.log(chalk.gray('  Duration:'), `${Math.round(result.deploymentTime / 1000)}s`);
  }

  // Display test results
  if (result.testResults && result.testResults.length > 0) {
    console.log(chalk.blue('\n🧪 POST-DEPLOYMENT TESTS:'));
    for (const test of result.testResults) {
      const statusIcon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⚠️';
      const statusColor = test.status === 'passed' ? chalk.green : test.status === 'failed' ? chalk.red : chalk.yellow;

      console.log(statusColor(`  ${statusIcon} ${test.name}: ${test.message}`));
      if (test.details) {
        console.log(chalk.gray(`     ${test.details}`));
      }
    }
  }

  // Display recommendations
  if (result.recommendations && result.recommendations.length > 0) {
    console.log(chalk.yellow('\n💡 RECOMMENDATIONS:'));
    result.recommendations.forEach((rec: string) =>
      console.log(chalk.gray('    •'), rec)
    );
  }

  console.log(chalk.blue('='.repeat(50)));
}