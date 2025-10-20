#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createCommand } from './commands/create';
import { validateCommand } from './commands/validate';
import { packageCommand } from './commands/package';
import * as packageJson from '../../package.json';

const program = new Command();

// Global configuration
program
  .name('azmp')
  .description('Azure Marketplace Generator - Create marketplace-ready managed applications')
  .version(packageJson.version)
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--dry-run', 'Preview actions without executing them')
  .hook('preAction', (thisCommand) => {
    // Global setup logic
    if (thisCommand.opts().verbose) {
      console.log(chalk.blue('🔧 Verbose mode enabled'));
    }
    if (thisCommand.opts().dryRun) {
      console.log(chalk.yellow('👀 Dry run mode - no files will be modified'));
    }
  });

// Commands
program.addCommand(createCommand);
program.addCommand(validateCommand);
program.addCommand(packageCommand);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log(chalk.blue.bold('🚀 Azure Marketplace Generator - Storage Edition'));
  console.log(chalk.blue('='.repeat(50)));
  console.log(chalk.gray('Generate marketplace-ready Azure Storage solutions\n'));

  console.log(chalk.blue('📋 Available Commands:'));
  console.log(chalk.blue('  create <type>              ') + chalk.gray('Create Azure Storage managed application'));
  console.log(chalk.blue('  validate <path>            ') + chalk.gray('Validate ARM templates'));
  console.log(chalk.blue('  package <path>             ') + chalk.gray('Package for Azure Marketplace'));

  console.log(chalk.cyan('\n💡 Quick Start:'));
  console.log(chalk.blue('   azmp create storage my-storage-app  ') + chalk.gray('# Create storage solution'));
  console.log(chalk.blue('   azmp validate ./output              ') + chalk.gray('# Validate templates'));
  console.log(chalk.blue('   azmp package ./output               ') + chalk.gray('# Create app.zip for marketplace'));
  
  console.log(chalk.yellow('\n📚 More info: azmp --help'));
  process.exit(0);
}

// Error handling - moved after the no-args check
program.exitOverride((err) => {
  // Allow version and help commands to exit normally
  if (err.code === 'commander.version' || err.code === 'commander.help') {
    process.exit(0);
  }
  throw err;
});

try {
  program.parse();
} catch (err: unknown) {
  const errorMessage = err instanceof Error ? err.message : String(err);

  // Don't show error for version or help commands
  if (errorMessage.includes('commander.version') || errorMessage.includes('commander.help')) {
    process.exit(0);
  }

  console.error(chalk.red('❌ Error:'), errorMessage);
  console.log(chalk.blue('\n💡 Troubleshooting:'));
  console.log(chalk.blue('   • Check command syntax: azmp --help'));
  console.log(chalk.blue('   • Verify file paths exist'));
  console.log(chalk.blue('   • Run with --verbose for details'));
  process.exit(1);
}