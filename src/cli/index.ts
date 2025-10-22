#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createCommand } from './commands/create';
import { validateCommand } from './commands/validate';
import { packageCommand } from './commands/package';
import { configCommand } from './commands/config';
import { setupGlobalErrorHandlers } from '../utils/error-handler';
import { getLogger } from '../utils/logger';
import { getConfigManager } from '../utils/config-manager';
import { pluginLoader } from '../core/plugin-loader';
import { commandRegistrar } from '../core/command-registrar';
import * as packageJson from '../../package.json';

// Setup global error handlers for uncaught exceptions and signals
setupGlobalErrorHandlers();

// Initialize logger
const logger = getLogger();

const program = new Command();

// Global configuration
program
  .name('azmp')
  .description('Azure Marketplace Generator - Create marketplace-ready managed applications')
  .version(packageJson.version)
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--dry-run', 'Preview actions without executing them')
  .addHelpText('after', `
${chalk.bold('Quick Start:')}
  1. ${chalk.cyan('azmp create storage --publisher "My Company" --name "Storage Solution"')}
  2. ${chalk.cyan('azmp validate ./output')}
  3. ${chalk.cyan('azmp package ./output')}

${chalk.bold('Workflow:')}
  ${chalk.green('create')}   → Generate managed application templates
  ${chalk.blue('validate')} → Verify templates meet Azure requirements
  ${chalk.yellow('package')}  → Create ZIP file for marketplace submission

${chalk.bold('Common Options:')}
  ${chalk.gray('--verbose')}  Show detailed debug information
  ${chalk.gray('--help')}     Display help for a specific command

${chalk.bold('Documentation:')}
  GitHub: ${chalk.cyan('https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator')}
  Issues: ${chalk.cyan('https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/issues')}

${chalk.bold('Examples:')}
  ${chalk.gray('# Interactive mode (prompts for missing info)')}
  ${chalk.cyan('$ azmp create storage')}

  ${chalk.gray('# Complete workflow with validation')}
  ${chalk.cyan('$ azmp create storage -p "Acme" -n "MyApp" -o ./myapp')}
  ${chalk.cyan('$ azmp validate ./myapp')}
  ${chalk.cyan('$ azmp package ./myapp -o myapp-v1.0.zip')}

  ${chalk.gray('# Get detailed help for a command')}
  ${chalk.cyan('$ azmp create --help')}
  ${chalk.cyan('$ azmp validate --help')}
`)
  .hook('preAction', (thisCommand) => {
    // Enable verbose mode if flag is set
    const opts = thisCommand.opts();
    if (opts.verbose) {
      logger.setVerbose(true);
      logger.debug('Verbose mode enabled');
    }
    if (opts.dryRun) {
      logger.warn('Dry run mode - no files will be modified');
    }
  });

// Commands
program.addCommand(createCommand);
program.addCommand(validateCommand);
program.addCommand(packageCommand);
program.addCommand(configCommand);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log(chalk.blue.bold('🚀 Azure Marketplace Generator'));
  console.log(chalk.blue('='.repeat(50)));
  console.log(chalk.gray('Generate Azure Storage marketplace solutions\n'));

  console.log(chalk.bold('Commands:'));
  console.log(chalk.green('  create storage             ') + chalk.gray('Create storage managed application'));
  console.log(chalk.blue('  validate <path>            ') + chalk.gray('Validate ARM templates'));
  console.log(chalk.yellow('  package <path>             ') + chalk.gray('Package for marketplace'));
  console.log(chalk.magenta('  config <command>           ') + chalk.gray('Manage configuration file'));

  console.log(chalk.bold('\n📖 Quick Start:'));
  console.log(chalk.gray('  1.'), chalk.cyan('azmp create storage --publisher "My Company" --name "My App"'));
  console.log(chalk.gray('  2.'), chalk.cyan('azmp validate ./output'));
  console.log(chalk.gray('  3.'), chalk.cyan('azmp package ./output'));

  console.log(chalk.bold('\n⚙️  Configuration:'));
  console.log(chalk.gray('  Create:'), chalk.cyan('azmp config init'));
  console.log(chalk.gray('  Use:'), chalk.cyan('azmp create storage --config ./azmp.config.json'));

  console.log(chalk.bold('\n🔧 Options:'));
  console.log(chalk.gray('  -v, --verbose              Show detailed debug information'));
  console.log(chalk.gray('  --version                  Display version number'));
  console.log(chalk.gray('  --help                     Display this help message'));

  console.log(chalk.bold('\n📚 More Information:'));
  console.log(chalk.gray('  Command help:'), chalk.cyan('azmp <command> --help'));
  console.log(chalk.gray('  Documentation:'), chalk.cyan('https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator'));
  
  console.log(chalk.yellow('\n💡 Tip: Use --verbose flag for detailed logging'));
  process.exit(0);
}

// Error handling - moved after the no-args check
program.exitOverride((err) => {
  // Allow version and help commands to exit normally
  if (err.code === 'commander.version' || err.code === 'commander.help' || err.code === 'commander.helpDisplayed') {
    process.exit(0);
  }
  throw err;
});

/**
 * Load plugins from configuration
 * This runs before program.parse() so plugin commands are available
 */
async function loadPlugins(): Promise<void> {
  try {
    // Load configuration
    const configManager = getConfigManager();
    const config = await configManager.loadConfig();
    
    // Skip if no config or no plugins defined
    if (!config || !config.plugins || config.plugins.length === 0) {
      logger.debug('No plugins configured, skipping plugin loading', 'cli');
      return;
    }
    
    // Validate config including plugins section
    const validation = configManager.validateConfig(config);
    if (!validation.valid) {
      logger.warn('Config validation errors found', 'cli', { errors: validation.errors });
      console.warn(chalk.yellow('⚠️  Configuration validation warnings:'));
      validation.errors.forEach(err => {
        console.warn(chalk.yellow(`   • ${err}`));
      });
      // Continue anyway - plugins might still work
    }
    
    // Initialize command registrar with existing commands
    commandRegistrar.initialize(program);
    
    // Load plugins
    const pluginContext = {
      generatorVersion: packageJson.version,
      templatesDir: config.templatesDir || './templates',
      outputDir: config.defaultOutputDir || './output',
      config: config,
      logger: {
        info: (msg: string) => logger.info(msg, 'plugin'),
        warn: (msg: string) => logger.warn(msg, 'plugin'),
        error: (msg: string) => logger.error(msg, 'plugin'),
        debug: (msg: string) => logger.debug(msg, 'plugin')
      }
    };
    
    logger.debug(`Loading ${config.plugins.length} plugin(s) from configuration`, 'cli');
    const loadedPlugins = await pluginLoader.loadPluginsFromConfig(
      config.plugins,
      pluginContext,
      program
    );
    
    if (loadedPlugins.length > 0) {
      logger.info(`Loaded ${loadedPlugins.length} plugin(s): ${loadedPlugins.join(', ')}`, 'cli');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to load plugins: ${message}`, 'cli');
    // Don't fail CLI startup - continue without plugins
    console.warn(chalk.yellow('⚠️  Plugin loading failed, continuing without plugins'));
    logger.debug('Plugin loading error details', 'cli', { error });
  }
}

// Load plugins asynchronously, then parse CLI
(async () => {
  try {
    await loadPlugins();
    program.parse();
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    // Don't show error for version, help, or outputHelp commands
    if (errorMessage.includes('commander.version') || 
        errorMessage.includes('commander.help') || 
        errorMessage.includes('outputHelp')) {
      process.exit(0);
    }

    console.error(chalk.red('❌ Error:'), errorMessage);
    console.log(chalk.blue('\n💡 Troubleshooting:'));
    console.log(chalk.blue('   • Check command syntax: azmp --help'));
    console.log(chalk.blue('   • Verify file paths exist'));
    console.log(chalk.blue('   • Run with --verbose for details'));
    process.exit(1);
  }
})();