#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createCommand } from './commands/create';
import { validateCommand } from './commands/validate';
import { packageCommand } from './commands/package';
import { promoteCommand, listPackagesCommand } from './commands/promote';
import { statusCommand } from './commands/status';
import { authCommand, testCommand } from './commands/auth';
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
  console.log(chalk.blue('🚀 Azure Marketplace Generator CLI'));
  console.log(chalk.blue('='.repeat(40)));
  console.log(chalk.gray('Enterprise tool for marketplace-ready managed applications\n'));
  program.outputHelp();
  console.log(chalk.blue('\n💡 Quick start:'));
  console.log(chalk.blue('   azmp status                        # Show portfolio status'));
  console.log(chalk.blue('   azmp validate azure-deployment/    # Validate templates'));
  console.log(chalk.blue('   azmp list-packages                 # View all packages'));
  console.log(chalk.blue('   azmp promote <path> 1.0.0          # Promote to marketplace'));
  console.log(chalk.blue('   azmp auth --fix-mfa                # Fix Azure MFA issues'));
  console.log(chalk.blue('   azmp test-mcp info@hoiltd.com      # Test MCP servers'));
  console.log(chalk.blue('   azmp graph user --profile          # Get user profile via Graph'));
  console.log(chalk.blue('   azmp graph org --context           # Get organizational context'));
  console.log(chalk.blue('   azmp graph generate --type storage # Generate intelligent templates'));
  console.log(chalk.blue('   azmp graph rag --search "Azure"    # Search organizational knowledge'));
}