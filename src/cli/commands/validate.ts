import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import { ArmTtkValidator } from '../../core/validator';

export const validateCommand = new Command('validate')
  .description('Validate managed application package using ARM-TTK')
  .argument('<path>', 'Path to managed application directory')
  .option('--skip <tests>', 'Comma-separated list of tests to skip')
  .option('--save-report', 'Save detailed validation report to packages/validated/')
  .option('--package-id <id>', 'Custom package ID for saving reports')
  .option('--promote <version>', 'Promote to marketplace if validation succeeds (e.g., --promote 1.2.0)')
  .action(async (templatePath: string, options: any) => {
    console.log(chalk.blue('🔍 Azure Marketplace Generator - Template Validation'));
    console.log(chalk.blue('='.repeat(60)));
    console.log(chalk.gray('  Template path:'), templatePath);
    console.log(chalk.gray('  ARM-TTK integration:'), chalk.green('Enhanced PowerShell wrapper'));
    
    try {
      const validator = new ArmTtkValidator();
      
      // Parse skip tests if provided
      const skipTests = options.skip ? options.skip.split(',').map((t: string) => t.trim()) : [];
      
      if (skipTests.length > 0) {
        console.log(chalk.gray('  Skipping tests:'), skipTests.join(', '));
      }

      // Run enhanced validation
      console.log('\n' + chalk.blue('🚀 Starting validation process...'));
      const result = await validator.validateTemplate(templatePath, skipTests);

      // Save validation report if requested
      let reportPath = '';
      if (options.saveReport) {
        reportPath = await validator.saveValidationReport(result, templatePath, options.packageId);
      }

      // Display detailed results
      if (result.success) {
        console.log(chalk.green('🎉 Template validation successful!'));
        
        if (result.warnings.length > 0) {
          console.log(chalk.yellow(`⚠️  Note: ${result.warnings.length} warning(s) found:`));
          result.warnings.slice(0, 5).forEach((warning, index) => {
            console.log(chalk.yellow(`   ${index + 1}. ${warning.split('\n')[0]}`));
          });
          if (result.warnings.length > 5) {
            console.log(chalk.gray(`   ... and ${result.warnings.length - 5} more warnings`));
          }
        }
        
        console.log(chalk.blue('\n📈 Validation Statistics:'));
        console.log(chalk.green(`  ✅ Tests passed: ${result.passCount}`));
        console.log(chalk.yellow(`  ⚠️  Warnings: ${result.warnings.length}`));
        console.log(chalk.blue(`  📊 Total tests: ${result.passCount + result.failCount}`));
        
        if (reportPath) {
          console.log(chalk.blue(`  📄 Report saved: ${path.basename(reportPath)}`));
        }

        // Promote to marketplace if requested
        if (options.promote && result.success) {
          console.log(chalk.blue('\n🚀 Promoting to marketplace...'));
          try {
            const marketplacePath = await validator.promoteToMarketplace(templatePath, options.promote);
            console.log(chalk.green(`✅ Successfully promoted to marketplace v${options.promote}`));
            console.log(chalk.gray(`   Location: ${marketplacePath}`));
          } catch (error: any) {
            console.error(chalk.red(`❌ Promotion failed: ${error.message}`));
            process.exit(1);
          }
        }
        
        console.log(chalk.green('\n� Template is ready for marketplace submission!'));
        
      } else {
        console.log(chalk.red(`❌ Template validation failed`));
        console.log(chalk.red(`   Errors found: ${result.errors.length}`));
        
        console.log(chalk.red('\n🔍 Error Summary:'));
        result.errors.slice(0, 10).forEach((error, index) => {
          // Show first line of each error for overview
          const errorPreview = error.split('\n')[0];
          console.log(chalk.red(`   ${index + 1}. ${errorPreview}`));
        });

        if (result.errors.length > 10) {
          console.log(chalk.gray(`   ... and ${result.errors.length - 10} more errors`));
        }

        if (result.warnings.length > 0) {
          console.log(chalk.yellow(`\n⚠️  Additional warnings: ${result.warnings.length}`));
        }

        if (reportPath) {
          console.log(chalk.blue(`\n📄 Detailed report saved: ${path.basename(reportPath)}`));
          console.log(chalk.gray('   Use this report to fix the issues above'));
        }

        console.log(chalk.blue('\n💡 Next steps:'));
        console.log(chalk.blue('   1. Fix the errors listed above'));
        console.log(chalk.blue('   2. Run validation again: azmp validate <path>'));
        console.log(chalk.blue('   3. Use --save-report for detailed analysis'));
        
        process.exit(1);
      }

    } catch (error: any) {
      console.error(chalk.red('\n❌ Validation process failed:'), error.message);
      console.log(chalk.blue('\n🔧 Troubleshooting:'));
      console.log(chalk.blue('   • Ensure ARM-TTK is installed and accessible'));
      console.log(chalk.blue('   • Check template path is correct'));
      console.log(chalk.blue('   • Verify PowerShell is available'));
      console.log(chalk.blue('   • Run with --verbose for more details'));
      process.exit(1);
    }
  });