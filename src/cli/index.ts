#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createCommand } from './commands/create';
import { validateCommand } from './commands/validate';
import { packageCommand } from './commands/package';
import { promoteCommand, listPackagesCommand } from './commands/promote';
import { statusCommand } from './commands/status';
import { authCommand, testCommand } from './commands/auth';
import { helpCommand } from './commands/help';
import { deployCommand } from './commands/deploy';
import { monitorCommand } from './commands/monitor';
import { insightsCommand } from './commands/insights';
import { configCommand } from './commands/config';
import { prCommand, workflowCommand } from './commands/pr';
import { registerGraphCommands } from './commands/graph';
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
program.addCommand(deployCommand);
program.addCommand(monitorCommand);
program.addCommand(insightsCommand);
program.addCommand(promoteCommand);
program.addCommand(listPackagesCommand);
program.addCommand(statusCommand);
program.addCommand(authCommand);
program.addCommand(testCommand);
program.addCommand(configCommand);
program.addCommand(helpCommand);
program.addCommand(prCommand);
program.addCommand(workflowCommand);

// Register Graph MCP commands
registerGraphCommands(program);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log(chalk.blue.bold('🚀 Azure Marketplace Generator CLI v1.0.0'));
  console.log(chalk.blue('='.repeat(50)));
  console.log(chalk.gray('Enterprise tool for marketplace-ready managed applications\n'));

  console.log(chalk.yellow('🎯 INTELLIGENT FEATURES (Phase 1):'));
  console.log(chalk.gray('   AI-powered validation, auto-fix, marketplace insights\n'));

  console.log(chalk.yellow('⚡ SMART PACKAGING (Phase 2):'));
  console.log(chalk.gray('   Auto-optimization, quality scoring, excellence tracking\n'));

  console.log(chalk.yellow('🎯 AUTO-DEPLOYMENT (Phase 3):'));
  console.log(chalk.gray('   Automated Azure deployment, testing, monitoring\n'));

  console.log(chalk.yellow('🧠 AI ANALYTICS (Phase 4):'));
  console.log(chalk.gray('   Enterprise monitoring, AI insights, market intelligence\n'));

  // Show commands list with consistent formatting
  console.log(chalk.blue('📋 Available Commands:'));
  console.log(chalk.blue('  create <type>              ') + chalk.gray('Create a new managed application package'));
  console.log(chalk.blue('  validate <path>            ') + chalk.gray('Validate ARM templates with AI analysis'));
  console.log(chalk.blue('  package <path>             ') + chalk.gray('Package for marketplace submission'));
  console.log(chalk.blue('  deploy <package>           ') + chalk.gray('Auto-deploy to Azure for testing'));
  console.log(chalk.blue('  monitor                    ') + chalk.gray('Enterprise monitoring dashboard'));
  console.log(chalk.blue('  insights                   ') + chalk.gray('AI-powered analytics and optimization'));
  console.log(chalk.blue('  status                     ') + chalk.gray('Show portfolio status'));
  console.log(chalk.blue('  promote <path> <version>   ') + chalk.gray('Promote to marketplace version'));
  console.log(chalk.blue('  pr                         ') + chalk.gray('GitHub PR management'));
  console.log(chalk.blue('  workflow                   ') + chalk.gray('GitFlow automation'));
  console.log(chalk.blue('  help                       ') + chalk.gray('Comprehensive help system'));

  console.log(chalk.cyan('\n💡 Quick Start Examples:'));
  console.log(chalk.blue('   azmp create storage my-app         ') + chalk.gray('# Create storage solution'));
  console.log(chalk.blue('   azmp validate ./app --intelligent  ') + chalk.gray('# AI-powered validation'));
  console.log(chalk.blue('   azmp package ./app --optimize      ') + chalk.gray('# Smart packaging'));
  console.log(chalk.blue('   azmp deploy ./app                  ') + chalk.gray('# Auto-deploy to Azure'));
  console.log(chalk.blue('   azmp monitor --init                ') + chalk.gray('# Initialize monitoring'));
  console.log(chalk.blue('   azmp help --examples               ') + chalk.gray('# Show detailed examples'));
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