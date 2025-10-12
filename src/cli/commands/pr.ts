import { Command } from 'commander';
import chalk from 'chalk';
import { spawn, spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * GitHub PR Management Commands for AZMP CLI
 * Integrated GitHub workflow management for Azure Marketplace development
 */

export const prCommand = new Command('pr')
  .description('🔧 GitHub Pull Request management for Azure Marketplace development')
  .option('--list', 'List all open PRs')
  .option('--status [number]', 'Show PR status (current branch or specific PR number)')
  .option('--create <title>', 'Create new PR with title')
  .option('--approve <number>', 'Approve specific PR number')
  .option('--merge <number>', 'Merge specific PR number')
  .option('--checks [number]', 'Show CI/CD checks for PR')
  .option('--review <number>', 'Interactive review for PR')
  .option('--base <branch>', 'Base branch for operations (default: develop)', 'develop')
  .option('--body <text>', 'PR description/body text')
  .option('--draft', 'Create as draft PR')
  .option('--method <type>', 'Merge method: merge|squash|rebase', 'squash')
  .action(async (options) => {
    console.log(chalk.blue('🔧 AZMP GitHub PR Manager'));
    console.log(chalk.blue('='.repeat(40)));

    const prManagerPath = join(process.cwd(), 'scripts', 'pr-manager.sh');

    if (!existsSync(prManagerPath)) {
      console.error(chalk.red('❌ PR manager script not found'));
      console.log(chalk.yellow('💡 Run from project root directory'));
      process.exit(1);
    }

    try {
      // Handle different PR operations
      if (options.list) {
        await executePRCommand(['list']);
      } else if (options.status !== undefined) {
        if (options.status === true) {
          // Current branch status
          await executePRCommand(['status']);
        } else {
          // Specific PR status
          await executePRCommand(['status', '--pr', options.status]);
        }
      } else if (options.create) {
        const args = ['create', '--title', options.create, '--base', options.base];
        if (options.body) args.push('--body', options.body);
        if (options.draft) args.push('--draft');
        await executePRCommand(args);
      } else if (options.approve) {
        const body = options.body || 'Approved via AZMP CLI';
        await executePRCommand(['review', '--pr', options.approve, '--approve', '--body', body]);
      } else if (options.merge) {
        await executePRCommand(['merge', '--pr', options.merge, '--method', options.method]);
      } else if (options.checks !== undefined) {
        if (options.checks === true) {
          // Current branch checks
          await executePRCommand(['checks']);
        } else {
          // Specific PR checks
          await executePRCommand(['checks', '--pr', options.checks]);
        }
      } else if (options.review) {
        await executePRCommand(['review', '--pr', options.review]);
      } else {
        // Show PR command help
        showPRHelp();
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('❌ PR operation failed:'), errorMessage);
      console.log(chalk.blue('\n💡 Troubleshooting:'));
      console.log(chalk.blue('   • Ensure you have GitHub CLI (gh) installed'));
      console.log(chalk.blue('   • Check you are authenticated: gh auth status'));
      console.log(chalk.blue('   • Verify you are in a git repository'));
      process.exit(1);
    }
  });

/**
 * Execute PR manager script with given arguments
 */
async function executePRCommand(args: string[]): Promise<void> {
  const prManagerPath = join(process.cwd(), 'scripts', 'pr-manager.sh');

  return new Promise((resolve, reject) => {
    const child = spawn(prManagerPath, args, {
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`PR command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Show comprehensive PR help
 */
function showPRHelp(): void {
  console.log(chalk.yellow('\n🔧 AZMP PR Commands:\n'));

  console.log(chalk.blue.bold('📋 List & Status:'));
  console.log(chalk.green('  azmp pr --list') + chalk.gray('                    # List all open PRs'));
  console.log(chalk.green('  azmp pr --status') + chalk.gray('                   # Current branch PR status'));
  console.log(chalk.green('  azmp pr --status 37') + chalk.gray('                # Specific PR status'));
  console.log(chalk.green('  azmp pr --checks') + chalk.gray('                   # Current branch CI checks'));
  console.log(chalk.green('  azmp pr --checks 37') + chalk.gray('                # Specific PR CI checks'));

  console.log(chalk.blue.bold('\n✅ Review & Approval:'));
  console.log(chalk.green('  azmp pr --review 37') + chalk.gray('                # Interactive PR review'));
  console.log(chalk.green('  azmp pr --approve 37') + chalk.gray('               # Quick approve PR'));
  console.log(chalk.green('  azmp pr --approve 37 --body "LGTM!"') + chalk.gray(' # Approve with comment'));

  console.log(chalk.blue.bold('\n🚀 Create & Merge:'));
  console.log(chalk.green('  azmp pr --create "Fix security alerts"') + chalk.gray(' # Create PR'));
  console.log(chalk.green('  azmp pr --create "Add feature" --base main') + chalk.gray(' # Custom base'));
  console.log(chalk.green('  azmp pr --create "WIP" --draft') + chalk.gray('           # Draft PR'));
  console.log(chalk.green('  azmp pr --merge 37') + chalk.gray('                   # Merge PR (squash)'));
  console.log(chalk.green('  azmp pr --merge 37 --method rebase') + chalk.gray('     # Rebase merge'));

  console.log(chalk.blue.bold('\n🌊 GitFlow Integration:'));
  console.log(chalk.green('  # Complete Azure Marketplace workflow:'));
  console.log(chalk.green('  git checkout develop'));
  console.log(chalk.green('  git checkout -b feature/new-template'));
  console.log(chalk.green('  # ... make changes ...'));
  console.log(chalk.green('  azmp pr --create "Add new Azure template"'));
  console.log(chalk.green('  azmp pr --status  # Monitor CI'));
  console.log(chalk.green('  azmp pr --merge <number>  # Merge when ready'));

  console.log(chalk.blue.bold('\n💡 Pro Tips:'));
  console.log(chalk.gray('  • Use --base develop for feature branches'));
  console.log(chalk.gray('  • Use --method squash for clean history'));
  console.log(chalk.gray('  • Monitor --checks before merging'));
  console.log(chalk.gray('  • Use --draft for work-in-progress'));

  console.log(chalk.cyan('\n🔗 Integration with AZMP:'));
  console.log(chalk.gray('  • Create PR after: azmp validate --intelligent'));
  console.log(chalk.gray('  • Test in PR: azmp deploy --test-mode'));
  console.log(chalk.gray('  • Monitor quality: azmp package --analysis-only'));
}

// Add workflow automation commands
export const workflowCommand = new Command('workflow')
  .description('🌊 Complete GitFlow workflow automation for Azure Marketplace development')
  .argument('<branch-name>', 'Feature branch name (e.g., feature/new-template)')
  .argument('<pr-title>', 'Pull request title')
  .option('--base <branch>', 'Base branch', 'develop')
  .option('--template <type>', 'Azure template type (storage|compute|networking)')
  .option('--validate', 'Run validation before creating PR')
  .action(async (branchName, prTitle, options) => {
    console.log(chalk.blue('🌊 AZMP GitFlow Workflow'));
    console.log(chalk.blue('='.repeat(40)));

    try {
      // 1. Create and switch to feature branch
      console.log(chalk.yellow('📝 Creating feature branch...'));
      spawnSync('git', ['checkout', options.base], { stdio: 'inherit' });
      spawnSync('git', ['pull', 'origin', options.base], { stdio: 'inherit' });
      spawnSync('git', ['checkout', '-b', branchName], { stdio: 'inherit' });

      // 2. Optional: Generate template
      if (options.template) {
        console.log(chalk.yellow(`🏗️  Generating ${options.template} template...`));
        spawnSync('azmp', ['create', options.template], { stdio: 'inherit' });
      }

      console.log(chalk.green('✅ Feature branch ready!'));
      console.log(chalk.yellow('\n📋 Next steps:'));
      console.log(chalk.blue('  1. Make your changes'));
      console.log(chalk.blue('  2. git add . && git commit -m "feat: your changes"'));
      console.log(chalk.blue('  3. git push origin ' + branchName));
      if (options.validate) {
        console.log(chalk.blue('  4. azmp validate --intelligent'));
      }
      console.log(chalk.blue(`  ${options.validate ? '5' : '4'}. azmp pr --create "${prTitle}"`));

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('❌ Workflow failed:'), errorMessage);
      process.exit(1);
    }
  });