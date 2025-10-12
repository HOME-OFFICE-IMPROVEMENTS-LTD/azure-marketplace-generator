import { Command } from 'commander';
import chalk from 'chalk';
import * as inquirer from 'inquirer';
import * as fs from 'fs-extra';
import * as path from 'path';
import { AppConfig } from '../../config/app-config';

export const configCommand = new Command('config')
  .description('Manage Azure Marketplace Generator configuration')
  .option('--show', 'Show current configuration')
  .option('--validate', 'Validate configuration and dependencies')
  .option('--init', 'Initialize configuration with guided setup')
  .option('--arm-ttk-path <path>', 'Set ARM-TTK script path')
  .action(async (options: any) => {
    console.log(chalk.blue.bold('🔧 Azure Marketplace Generator Configuration'));
    console.log(chalk.blue('='.repeat(55)));

    try {
      if (options.show) {
        await showConfiguration();
      } else if (options.validate) {
        await validateConfiguration();
      } else if (options.init) {
        await initializeConfiguration();
      } else if (options.armTtkPath) {
        await setArmTtkPath(options.armTtkPath);
      } else {
        // Default: show configuration
        await showConfiguration();
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

async function showConfiguration() {
  console.log(chalk.yellow('\n📋 CURRENT CONFIGURATION:\n'));

  const config = AppConfig.getConfig();

  console.log(chalk.blue('ARM-TTK:'));
  console.log(chalk.gray('  Script Path:'), config.armTtk.scriptPath);
  console.log(chalk.gray('  Cache TTL:'), `${config.armTtk.cacheTtlHours}h`);

  console.log(chalk.blue('\nPaths:'));
  console.log(chalk.gray('  Packages:'), config.paths.packages);
  console.log(chalk.gray('  Templates:'), config.paths.templates);
  console.log(chalk.gray('  Cache:'), config.paths.cache);
  console.log(chalk.gray('  Temp:'), config.paths.temp);

  console.log(chalk.blue('\nAzure:'));
  console.log(chalk.gray('  Default Region:'), config.azure.defaultRegion);
  console.log(chalk.gray('  Timeout:'), `${config.azure.timeoutMs}ms`);
  console.log(chalk.gray('  Retries:'), config.azure.retryAttempts);

  console.log(chalk.blue('\nMonitoring:'));
  console.log(chalk.gray('  Interval:'), `${config.monitoring.intervalMinutes}min`);
  console.log(chalk.gray('  Max Concurrency:'), config.monitoring.maxConcurrency);
  console.log(chalk.gray('  Health Check Timeout:'), `${config.monitoring.healthCheckTimeoutMs}ms`);

  console.log(chalk.blue('\nPackaging:'));
  console.log(chalk.gray('  Max Size:'), `${config.packaging.maxSizeMB}MB`);
  console.log(chalk.gray('  Quality Threshold:'), `${config.packaging.qualityThreshold}%`);
  console.log(chalk.gray('  Compression Level:'), config.packaging.compressionLevel);
}

async function validateConfiguration() {
  console.log(chalk.yellow('\n🔍 VALIDATING CONFIGURATION:\n'));

  // Initialize directories
  await AppConfig.initializeDirectories();
  console.log(chalk.green('✅ Required directories initialized'));

  // Validate configuration
  const validation = await AppConfig.validateConfiguration();

  if (validation.valid) {
    console.log(chalk.green('\n✅ Configuration is valid'));
    console.log(chalk.gray('   All paths accessible and ARM-TTK found'));
  } else {
    console.log(chalk.red('\n❌ Configuration validation failed:'));
    validation.errors.forEach((error: string) => {
      console.log(chalk.red(`   • ${error}`));
    });

    console.log(chalk.yellow('\n💡 Recommendations:'));
    console.log(chalk.gray('   • Run "azmp config --init" for guided setup'));
    console.log(chalk.gray('   • Set AZMP_ARM_TTK_PATH environment variable'));
    console.log(chalk.gray('   • Check file permissions for data directories'));
  }
}

async function initializeConfiguration() {
  console.log(chalk.yellow('\n🚀 CONFIGURATION SETUP:\n'));

  const questions = [
    {
      type: 'input',
      name: 'armTtkPath',
      message: 'ARM-TTK Script Path (Test-AzTemplate.ps1):',
      default: AppConfig.getArmTtkPath(),
      validate: async (input: string) => {
        if (!input.trim()) return 'ARM-TTK path is required';
        try {
          if (await fs.pathExists(input)) {
            return true;
          }
          return 'ARM-TTK script not found at this path';
        } catch {
          return 'Invalid path';
        }
      }
    },
    {
      type: 'input',
      name: 'packagesDir',
      message: 'Packages Directory:',
      default: AppConfig.getPackagesDir()
    },
    {
      type: 'input',
      name: 'templatesDir',
      message: 'Templates Directory:',
      default: AppConfig.getTemplatesDir()
    },
    {
      type: 'input',
      name: 'cacheDir',
      message: 'Cache Directory:',
      default: AppConfig.getCacheDir()
    },
    {
      type: 'list',
      name: 'defaultRegion',
      message: 'Default Azure Region:',
      choices: [
        'eastus',
        'westus',
        'westus2',
        'eastus2',
        'centralus',
        'northcentralus',
        'southcentralus',
        'westcentralus',
        'canadacentral',
        'canadaeast',
        'brazilsouth',
        'northeurope',
        'westeurope',
        'uksouth',
        'ukwest',
        'francecentral',
        'germanywestcentral',
        'norwayeast',
        'switzerlandnorth',
        'uaenorth',
        'southafricanorth',
        'australiaeast',
        'australiasoutheast',
        'eastasia',
        'southeastasia',
        'japaneast',
        'japanwest',
        'koreacentral',
        'koreasouth',
        'southindia',
        'westindia',
        'centralindia'
      ],
      default: AppConfig.getConfig().azure.defaultRegion
    },
    {
      type: 'number',
      name: 'qualityThreshold',
      message: 'Minimum Quality Threshold (0-100):',
      default: AppConfig.getConfig().packaging.qualityThreshold,
      validate: (input: number) => {
        if (input >= 0 && input <= 100) return true;
        return 'Quality threshold must be between 0 and 100';
      }
    }
  ];

  const answers = await inquirer.default.prompt(questions);

  // Create environment file with configuration
  const envContent = `# Azure Marketplace Generator Configuration
# Generated by azmp config --init

# ARM-TTK Configuration
AZMP_ARM_TTK_PATH=${answers.armTtkPath}

# Directory Paths
AZMP_PACKAGES_DIR=${answers.packagesDir}
AZMP_TEMPLATES_DIR=${answers.templatesDir}
AZMP_CACHE_DIR=${answers.cacheDir}

# Azure Configuration
AZMP_DEFAULT_REGION=${answers.defaultRegion}

# Packaging Configuration
AZMP_QUALITY_THRESHOLD=${answers.qualityThreshold}
`;

  const configPath = path.join(process.cwd(), '.env.azmp');
  await fs.writeFile(configPath, envContent);

  console.log(chalk.green('\n✅ Configuration saved to .env.azmp'));
  console.log(chalk.yellow('💡 To use this configuration, run:'));
  console.log(chalk.gray('   export $(cat .env.azmp | xargs)'));
  console.log(chalk.gray('   or add these variables to your shell profile'));

  // Validate the new configuration
  process.env = { ...process.env };
  envContent.split('\n').forEach(line => {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    }
  });

  console.log(chalk.yellow('\n🔍 Validating new configuration...'));
  await validateConfiguration();
}

async function setArmTtkPath(newPath: string) {
  try {
    if (!await fs.pathExists(newPath)) {
      throw new Error(`ARM-TTK script not found at: ${newPath}`);
    }

    // Update in-memory configuration
    AppConfig.updateConfig({
      armTtk: {
        ...AppConfig.getConfig().armTtk,
        scriptPath: newPath
      }
    });

    console.log(chalk.green(`✅ ARM-TTK path updated to: ${newPath}`));
    console.log(chalk.yellow('💡 To persist this change, set AZMP_ARM_TTK_PATH environment variable'));
  } catch (error) {
    throw new Error(`Failed to set ARM-TTK path: ${error instanceof Error ? error.message : error}`);
  }
}