import { Command } from 'commander';
import chalk from 'chalk';
import { getConfigManager } from '../../utils/config-manager';
import { getLogger } from '../../utils/logger';
import { ErrorHandler } from '../../utils/error-handler';

const logger = getLogger();

export const configCommand = new Command('config')
  .description('Manage configuration file')
  .addCommand(
    new Command('init')
      .description('Create a sample azmp.config.json file')
      .option('-o, --output <path>', 'Output path for config file', './azmp.config.json')
      .addHelpText('after', `
Examples:
  ${chalk.cyan('$ azmp config init')}
    Creates azmp.config.json in the current directory

  ${chalk.cyan('$ azmp config init --output ./.azmp/config.json')}
    Creates config file in a custom location

Config file structure:
  {
    "publisher": "My Company Inc.",
    "defaultOutputDir": "./output",
    "templates": {
      "storage": {
        "name": "My Storage Solution",
        "location": "eastus"
      }
    },
    "validation": {
      "saveReport": false,
      "reportPath": "./validation-report.txt"
    },
    "packaging": {
      "defaultFileName": "my-app-package.zip"
    }
  }

Benefits:
  • Save time by setting default values for your project
  • Consistent settings across team members
  • Override config values with CLI options when needed
  • Keep sensitive data out of source control (add to .gitignore)
`)
      .action(async (options: { output: string }) => {
        const stopTimer = logger.startTimer('config init');
        
        console.log(chalk.blue('⚙️  Initializing configuration file...'));
        logger.debug('Starting config init', 'config', { output: options.output });

        await ErrorHandler.handleAsync(
          async () => {
            const configManager = getConfigManager();
            await configManager.createSampleConfig(options.output);
            
            console.log(chalk.yellow('💡 Tips:'));
            console.log(chalk.gray('  • Edit the config file to customize defaults'));
            console.log(chalk.gray('  • CLI options override config file settings'));
            console.log(chalk.gray('  • Use --config flag to specify alternate config location'));
            console.log(chalk.gray('  • Add to .gitignore if it contains sensitive data'));
            
            stopTimer();
          },
          'config initialization',
          undefined
        );
      })
  )
  .addCommand(
    new Command('validate')
      .description('Validate configuration file')
      .argument('[path]', 'Path to config file', './azmp.config.json')
      .addHelpText('after', `
Examples:
  ${chalk.cyan('$ azmp config validate')}
    Validates azmp.config.json in the current directory

  ${chalk.cyan('$ azmp config validate ./custom-config.json')}
    Validates a specific config file
`)
      .action(async (configPath: string) => {
        const stopTimer = logger.startTimer('config validate');
        
        console.log(chalk.blue('🔍 Validating configuration file...'));
        logger.debug('Starting config validate', 'config', { path: configPath });

        await ErrorHandler.handleAsync(
          async () => {
            const configManager = getConfigManager();
            const config = await configManager.loadConfig(configPath);
            
            if (!config) {
              console.error(chalk.red('❌ Config file not found'));
              process.exit(1);
            }

            const validation = configManager.validateConfig(config);
            
            if (validation.valid) {
              console.log(chalk.green('✅ Configuration is valid'));
              console.log(chalk.gray('\nConfig summary:'));
              if (config.publisher) {
                console.log(chalk.gray('  Publisher:'), config.publisher);
              }
              if (config.defaultOutputDir) {
                console.log(chalk.gray('  Default output:'), config.defaultOutputDir);
              }
              if (config.templates?.storage) {
                console.log(chalk.gray('  Storage template:'), config.templates.storage.name || 'configured');
              }
            } else {
              console.error(chalk.red('❌ Configuration has errors:'));
              validation.errors.forEach((error, index) => {
                console.error(chalk.red(`   ${index + 1}. ${error}`));
              });
              process.exit(1);
            }
            
            stopTimer();
          },
          'config validation',
          undefined
        );
      })
  );
