import { Command } from 'commander';
import chalk from 'chalk';
import { ArmTtkValidator } from '../../core/validator';
import { SecurityValidation, ValidationError } from '../../utils/security-validation';
import { ErrorHandler, ArmTtkError } from '../../utils/error-handler';
import { getLogger } from '../../utils/logger';
import { getConfigManager } from '../../utils/config-manager';
import { createProgress } from '../../utils/progress';

const logger = getLogger();

export const validateCommand = new Command('validate')
  .description('🔍 Validate managed application package with ARM-TTK')
  .argument('<path>', 'Path to managed application directory or template file')
  .option('--save-report <file>', 'Save validation report to file')
  .option('-c, --config <path>', 'Path to azmp.config.json file')
  .addHelpText('after', `
Examples:
  ${chalk.cyan('$ azmp validate ./output')}
    Validates the managed application in the ./output directory

  ${chalk.cyan('$ azmp validate ./my-app --save-report ./validation-report.txt')}
    Validates and saves a detailed report to a file

  ${chalk.cyan('$ azmp validate ./output --config ./azmp.config.json')}
    Validates using settings from config file

  ${chalk.cyan('$ azmp validate ./output --verbose')}
    Validates with detailed debug information

What gets validated:
  • ARM template syntax and structure
  • createUiDefinition.json format and controls
  • viewDefinition.json structure
  • Azure Resource Manager best practices
  • Marketplace compliance requirements
  • Template parameters and outputs

Prerequisites:
  • ARM-TTK must be installed: ${chalk.yellow('npm run install-arm-ttk')}
  • PowerShell must be available on the system
  • Template files must exist in the specified directory
`)
  .action(async (templatePath: string, options: { saveReport?: string; config?: string }) => {
    const stopTimer = logger.startTimer('validate command');
    
    console.log(chalk.blue('🔍 Azure Marketplace Generator - Template Validation'));
    console.log(chalk.blue('='.repeat(60)));
    console.log(chalk.gray('  Template path:'), templatePath);
    console.log(chalk.gray('  ARM-TTK integration:'), chalk.green('Enhanced PowerShell wrapper'));
    
    logger.debug('Starting validate command', 'validate', { templatePath, options });

    // Load config file if specified or found
    const configManager = getConfigManager();
    let configDefaults: { saveReport?: boolean; reportPath?: string } = {};
    
    try {
      const config = await configManager.loadConfig(options.config);
      if (config?.validation) {
        logger.debug('Config validation settings loaded', 'validate', config.validation);
        configDefaults = {
          saveReport: config.validation.saveReport,
          reportPath: config.validation.reportPath
        };
      }
    } catch (error) {
      logger.warn('Failed to load config file', 'validate', { error });
      // Continue without config - not a fatal error
    }

    // Merge CLI options with config defaults
    const saveReportPath = options.saveReport || 
      (configDefaults.saveReport ? configDefaults.reportPath : undefined);
    
    logger.debug('Merged validation options', 'validate', { 
      cli: options.saveReport, 
      config: configDefaults,
      final: saveReportPath 
    });

    // Validate input parameters for security
    if (!templatePath || typeof templatePath !== 'string') {
      logger.error('Template path is required', 'validate');
      console.error(chalk.red('❌ Error: Template path is required'));
      console.log(chalk.gray('Usage: azmp validate <path>'));
      process.exit(1);
    }

    // Validate template path for security
    logger.debug('Validating template path', 'validate', { path: templatePath });
    if (!SecurityValidation.validateFilePath(templatePath)) {
      logger.error('Invalid template path', 'validate', { path: templatePath });
      console.error(chalk.red('❌ Error: Invalid template path'));
      console.log(chalk.gray('Path must be a safe relative path'));
      process.exit(1);
    }

    // Validate save report path if provided
    if (saveReportPath) {
      if (typeof saveReportPath !== 'string') {
        logger.error('Save report path must be a string', 'validate');
        console.error(chalk.red('❌ Error: Save report path must be a string'));
        process.exit(1);
      }
      
      logger.debug('Validating save report path', 'validate', { path: saveReportPath });
      if (!SecurityValidation.validateFilePath(saveReportPath)) {
        logger.error('Invalid save report path', 'validate', { path: saveReportPath });
        console.error(chalk.red('❌ Error: Invalid save report path'));
        console.log(chalk.gray('Path must be a safe relative path'));
        process.exit(1);
      }
    }

    await ErrorHandler.handleAsync(
      async () => {
        logger.info('Starting ARM-TTK validation', 'validate');
        const progress = createProgress();
        
        progress.start('Running ARM-TTK validation tests...', 'validate');
        const validator = new ArmTtkValidator();
        const result = await validator.validateTemplate(templatePath);

        logger.debug('Validation completed', 'validate', { 
          success: result.success, 
          errorCount: result.errors.length 
        });

        // Save report if requested
        let reportPath: string | undefined;
        if (saveReportPath) {
          progress.update('Saving validation report...', 'validate');
          logger.debug('Saving validation report', 'validate');
          reportPath = await validator.saveValidationReport(result, templatePath, 'validation-report');
          logger.info(`Report saved to: ${reportPath}`, 'validate');
        }

        // Display results based on success
        if (result.success) {
          progress.succeed('Validation completed - All tests passed!');
          logger.success('Template validation successful', 'validate');
          console.log(chalk.green('\n✅ Template is ready for marketplace submission!'));
        } else {
          progress.fail(`Validation failed - ${result.errors.length} errors found`);
          logger.error('Template validation failed', 'validate', { 
            errorCount: result.errors.length,
            errors: result.errors.slice(0, 5)
          });
          console.log(chalk.red(`   Errors found: ${result.errors.length}`));

          console.log(chalk.red('\n🔍 Error Summary:'));
          result.errors.slice(0, 10).forEach((error: string, index: number) => {
            const errorPreview = error.split('\n')[0];
            console.log(chalk.red(`   ${index + 1}. ${errorPreview}`));
          });

          if (result.errors.length > 10) {
            console.log(chalk.gray(`   ... and ${result.errors.length - 10} more errors`));
          }
        }

        if (reportPath) {
          console.log(chalk.blue(`\n📋 Detailed report saved: ${reportPath}`));
        }

        console.log(chalk.blue('\n💡 Next steps:'));
        if (result.success) {
          console.log(chalk.blue('   1. Package for marketplace: azmp package <path>'));
          console.log(chalk.blue('   2. Upload to Azure Partner Center'));
        } else {
          console.log(chalk.blue('   1. Fix the errors listed above'));
          console.log(chalk.blue('   2. Run validation again: azmp validate <path>'));
          console.log(chalk.blue('   3. Use --save-report for detailed analysis'));
        }

        stopTimer();

        // Exit with error code if validation failed
        if (!result.success) {
          throw new ArmTtkError('Template validation failed', result.errors);
        }
      },
      'template validation',
      undefined
    );
  });