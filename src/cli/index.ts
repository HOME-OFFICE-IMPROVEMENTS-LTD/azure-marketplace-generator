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
import { registerGraphCommands } from './commands/graph';

const program = new Command();

// Global configuration
program
  .name('azmp')
  .description('Azure Marketplace Generator - Create marketplace-ready managed applications')
  .version('0.1.0')
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
program.addCommand(promoteCommand);
program.addCommand(listPackagesCommand);
program.addCommand(statusCommand);
program.addCommand(authCommand);
program.addCommand(testCommand);
program.addCommand(helpCommand);

// Register Graph MCP commands
registerGraphCommands(program);

// Error handling
program.exitOverride();

try {
  program.parse();
} catch (err: any) {
  console.error(chalk.red('❌ Error:'), err.message);
  console.log(chalk.blue('\n💡 Troubleshooting:'));
  console.log(chalk.blue('   • Check command syntax: azmp --help'));
  console.log(chalk.blue('   • Verify file paths exist'));
  console.log(chalk.blue('   • Run with --verbose for details'));
  process.exit(1);
}

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log(chalk.blue.bold('🚀 Azure Marketplace Generator CLI v2.0'));
  console.log(chalk.blue('='.repeat(50)));
  console.log(chalk.gray('Enterprise tool for marketplace-ready managed applications\n'));
  
  console.log(chalk.yellow('🎯 INTELLIGENT FEATURES (Phase 1):'));
  console.log(chalk.gray('   AI-powered validation, auto-fix, marketplace insights\n'));
  
  console.log(chalk.yellow('⚡ SMART PACKAGING (Phase 2):'));
  console.log(chalk.gray('   Auto-optimization, quality scoring, excellence tracking\n'));
  
  program.outputHelp();
  
  console.log(chalk.blue('\n💡 Quick start:'));
  console.log(chalk.blue('   azmp help --phase2                 # Learn about smart packaging'));
  console.log(chalk.blue('   azmp validate ./app --intelligent  # AI-powered validation'));
  console.log(chalk.blue('   azmp package ./app --optimize      # Smart packaging'));
  console.log(chalk.blue('   azmp status                        # Show portfolio status'));
  console.log(chalk.blue('   azmp list-packages                 # View all packages'));
  console.log(chalk.blue('   azmp promote <path> 1.0.0          # Promote to marketplace'));
}