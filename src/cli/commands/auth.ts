import { Command } from 'commander';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

export const authCommand = new Command('auth')
  .description('Manage Azure authentication for MCP integration')
  .option('--check', 'Check current authentication status')
  .option('--fix-mfa', 'Fix MFA authentication issues')
  .option('--clear', 'Clear cached credentials')
  .option('--service-principal', 'Use service principal authentication')
  .option('--test', 'Test Azure connectivity')
  .action(async (options) => {
    console.log(chalk.blue('🔐 Azure Authentication Manager'));
    console.log(chalk.blue('='.repeat(40)));

    const scriptPath = join(process.cwd(), 'scripts', 'azure-auth-helper.sh');
    
    if (!existsSync(scriptPath)) {
      console.error(chalk.red('❌ Authentication helper script not found'));
      console.log(chalk.yellow('💡 Make sure you are in the project root directory'));
      process.exit(1);
    }

    try {
      let command = 'check'; // default
      
      if (options.fixMfa) {
        command = 'fix-mfa';
        console.log(chalk.yellow('🔧 Fixing MFA authentication issues...'));
      } else if (options.clear) {
        command = 'clear';
        console.log(chalk.yellow('🧹 Clearing cached credentials...'));
      } else if (options.servicePrincipal) {
        command = 'service-principal';
        console.log(chalk.yellow('🔑 Using service principal authentication...'));
      } else if (options.test) {
        command = 'test';
        console.log(chalk.yellow('🧪 Testing Azure connectivity...'));
      } else if (options.check) {
        command = 'check';
        console.log(chalk.yellow('🔍 Checking authentication status...'));
      }

      // Execute the authentication helper script
      const result = execSync(`bash "${scriptPath}" ${command}`, {
        encoding: 'utf8',
        stdio: 'inherit'
      });

      console.log(chalk.green('\n✅ Authentication operation completed'));
      
    } catch (error: any) {
      console.error(chalk.red('❌ Authentication operation failed'));
      console.error(chalk.red(error.message));
      
      console.log(chalk.blue('\n💡 Troubleshooting tips:'));
      console.log(chalk.blue('   • Check if Azure CLI is installed: az --version'));
      console.log(chalk.blue('   • Verify environment variables are set'));
      console.log(chalk.blue('   • Try clearing cache: azmp auth --clear'));
      console.log(chalk.blue('   • Use MFA fix: azmp auth --fix-mfa'));
      
      process.exit(1);
    }
  });

export const testCommand = new Command('test-mcp')
  .description('Test Azure DevOps and Lighthouse MCP servers')
  .argument('[email]', 'Email address to test for', 'info@hoiltd.com')
  .option('--devops-only', 'Test only Azure DevOps connectivity')
  .option('--lighthouse-only', 'Test only Lighthouse performance capabilities')
  .option('--create-workitem', 'Create a test work item in Azure DevOps')
  .action(async (email, options) => {
    console.log(chalk.blue('🧪 MCP Server Testing'));
    console.log(chalk.blue('='.repeat(30)));
    console.log(chalk.yellow(`Testing for: ${email}`));

    const scriptPath = join(process.cwd(), 'scripts', 'test-devops-lighthouse.sh');
    
    if (!existsSync(scriptPath)) {
      console.error(chalk.red('❌ MCP testing script not found'));
      console.log(chalk.yellow('💡 Make sure you are in the project root directory'));
      process.exit(1);
    }

    try {
      let command = 'all'; // default
      
      if (options.devopsOnly) {
        command = 'devops';
      } else if (options.lighthouseOnly) {
        command = 'lighthouse';
      } else if (options.createWorkitem) {
        command = 'workitem';
      }

      // Execute the MCP testing script
      const result = execSync(`bash "${scriptPath}" ${command} ${email}`, {
        encoding: 'utf8',
        stdio: 'inherit'
      });

      console.log(chalk.green('\n✅ MCP testing completed'));
      
    } catch (error: any) {
      console.error(chalk.red('❌ MCP testing failed'));
      console.error(chalk.red(error.message));
      
      console.log(chalk.blue('\n💡 Troubleshooting tips:'));
      console.log(chalk.blue('   • Check Azure DevOps environment variables'));
      console.log(chalk.blue('   • Verify PAT token permissions'));
      console.log(chalk.blue('   • Test authentication first: azmp auth --check'));
      console.log(chalk.blue('   • Install Lighthouse: npm install -g lighthouse'));
      
      process.exit(1);
    }
  });