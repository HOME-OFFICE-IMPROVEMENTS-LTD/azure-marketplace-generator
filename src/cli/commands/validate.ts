import { Command } from 'commander';
import chalk from 'chalk';
import { ArmTtkValidator } from '../../core/validator';

export const validateCommand = new Command('validate')
  .description('Validate managed application package using ARM-TTK')
  .argument('<path>', 'Path to managed application directory')
  .option('--skip <tests>', 'Comma-separated list of tests to skip')
  .action(async (path: string, options: any) => {
    console.log(chalk.blue('🔍 Validating managed application package...'));
    console.log(chalk.gray('  Path:'), path);
    
    try {
      const validator = new ArmTtkValidator();
      
      // Parse skip tests if provided
      const skipTests = options.skip ? options.skip.split(',').map((t: string) => t.trim()) : [];
      
      if (skipTests.length > 0) {
        console.log(chalk.gray('  Skipping tests:'), skipTests.join(', '));
      }

      // Run validation
      const result = await validator.validateTemplate(path, skipTests);

      // Display results
      if (result.success) {
        console.log(chalk.green('✅ Validation successful!'));
        
        if (result.warnings.length > 0) {
          console.log(chalk.yellow(`⚠️  ${result.warnings.length} warning(s):`));
          result.warnings.forEach(warning => {
            console.log(chalk.yellow(`   ${warning}`));
          });
        }
        
        console.log(chalk.blue('🎉 Template is ready for marketplace submission!'));
      } else {
        console.log(chalk.red(`❌ Validation failed with ${result.errors.length} error(s):`));
        result.errors.forEach(error => {
          console.log(chalk.red(`   ${error}`));
        });

        if (result.warnings.length > 0) {
          console.log(chalk.yellow(`⚠️  ${result.warnings.length} warning(s):`));
          result.warnings.forEach(warning => {
            console.log(chalk.yellow(`   ${warning}`));
          });
        }

        console.log(chalk.blue('💡 Fix the errors above and run validation again.'));
        process.exit(1);
      }

    } catch (error: any) {
      console.error(chalk.red('❌ Validation failed:'), error.message);
      process.exit(1);
    }
  });