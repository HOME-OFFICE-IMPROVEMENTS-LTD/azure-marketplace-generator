import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const statusCommand = new Command('status')
  .description('Show current marketplace portfolio status and session summary')
  .action(async () => {
    console.log(chalk.blue('🏆 Azure Marketplace Portfolio Status'));
    console.log(chalk.blue('='.repeat(50)));
    
    try {
      const statusPath = join(process.cwd(), 'portfolio-status.json');
      
      if (!existsSync(statusPath)) {
        console.log(chalk.yellow('⚠️  No portfolio status found. Run commands to initialize.'));
        return;
      }

      const status = JSON.parse(readFileSync(statusPath, 'utf8'));
      
      // Portfolio Overview
      console.log(chalk.green('\n📊 Portfolio Overview:'));
      console.log(chalk.gray(`   Success Rate: ${status.stats.successRate}`));
      console.log(chalk.gray(`   Total Published: ${status.stats.totalPublished}`));
      console.log(chalk.gray(`   Total Submitted: ${status.stats.totalSubmitted}`));
      
      // Published Listings
      if (status.portfolio.published.length > 0) {
        console.log(chalk.green('\n✅ Published & Live:'));
        status.portfolio.published.forEach((item: any) => {
          console.log(chalk.green(`   • ${item.name} (v${item.version}) - ${item.publishedDate}`));
          console.log(chalk.gray(`     ${item.package}`));
        });
      }
      
      // Submitted/Under Review
      if (status.portfolio.submitted.length > 0) {
        console.log(chalk.yellow('\n⏳ Under Review:'));
        status.portfolio.submitted.forEach((item: any) => {
          console.log(chalk.yellow(`   • ${item.name} (v${item.version}) - ${item.submittedDate}`));
          console.log(chalk.gray(`     ${item.package}`));
        });
      }
      
      // In Development
      if (status.portfolio.inDevelopment.length > 0) {
        console.log(chalk.blue('\n🚧 In Development:'));
        status.portfolio.inDevelopment.forEach((item: any) => {
          console.log(chalk.blue(`   • ${item.name} (v${item.version})`));
        });
      }
      
      // Last Session
      console.log(chalk.blue('\n📝 Last Session Summary:'));
      console.log(chalk.gray(`   Date: ${status.lastSession.date}`));
      console.log(chalk.gray(`   Focus: ${status.lastSession.focus}`));
      
      // Next Actions
      if (status.lastSession.nextActions.length > 0) {
        console.log(chalk.blue('\n🎯 Recommended Next Actions:'));
        status.lastSession.nextActions.forEach((action: string, index: number) => {
          console.log(chalk.gray(`   ${index + 1}. ${action}`));
        });
      }
      
      console.log(chalk.blue('\n' + '='.repeat(50)));
      
    } catch (_error) {
      console.error(chalk.red('❌ Error reading portfolio status:'), error);
    }
  });