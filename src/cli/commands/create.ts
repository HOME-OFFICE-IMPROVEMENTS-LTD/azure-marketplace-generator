import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { TemplateGenerator } from '../../core/generator';
import { SecurityValidation, ValidationError } from '../../utils/security-validation';
import { ErrorHandler, TemplateGenerationError, ValidationError as CliValidationError } from '../../utils/error-handler';
import { getLogger } from '../../utils/logger';
import { getConfigManager } from '../../utils/config-manager';
import { createProgress } from '../../utils/progress';

const logger = getLogger();

export const createCommand = new Command('create')
  .description('Create a new managed application package')
  .argument('<type>', 'Application type (currently only "storage" is supported)')
  .option('-p, --publisher <name>', 'Publisher name for the marketplace')
  .option('-n, --name <name>', 'Application name')
  .option('-o, --output <dir>', 'Output directory', './output')
  .option('-c, --config <path>', 'Path to azmp.config.json file')
  .addHelpText('after', `
Examples:
  ${chalk.cyan('$ azmp create storage --publisher "My Company Inc." --name "Storage Solution"')}
    Creates a storage managed application with the specified publisher and name

  ${chalk.cyan('$ azmp create storage -p "Acme Corp" -n "Enterprise Storage" -o ./my-app')}
    Creates a storage app in a custom output directory

  ${chalk.cyan('$ azmp create storage --config ./azmp.config.json')}
    Creates a storage app using settings from a config file

  ${chalk.cyan('$ azmp create storage')}
    Creates a storage app and prompts for missing information

Notes:
  • Publisher name: 1-100 characters, alphanumeric with spaces, dots, hyphens, underscores
  • Application name: 1-64 characters, alphanumeric with spaces, dots, hyphens, underscores
  • Output directory will be created if it doesn't exist
  • Generated files: mainTemplate.json, createUiDefinition.json, viewDefinition.json
  • Config file settings can be overridden by CLI options
`)
  .action(async (type: string, options: { publisher?: string; name?: string; output: string; config?: string }) => {
    const stopTimer = logger.startTimer('create command');
    
    console.log(chalk.blue('🚀 Creating managed application package...'));
    logger.debug('Starting create command', 'create', { type, options });

    // Load config file if specified or found
    const configManager = getConfigManager();
    let configDefaults: { publisher?: string; name?: string; output?: string } = {};
    
    try {
      const config = await configManager.loadConfig(options.config);
      if (config) {
        logger.debug('Config file loaded', 'create', config);
        
        // Validate config structure
        const validation = configManager.validateConfig(config);
        if (!validation.valid) {
          logger.warn('Config file has validation errors', 'create', { errors: validation.errors });
          console.warn(chalk.yellow('⚠️  Config file validation warnings:'));
          validation.errors.forEach(err => console.warn(chalk.yellow(`   • ${err}`)));
          console.log(chalk.gray('   Continuing with valid settings...\n'));
        }
        
        // Extract defaults from config
        configDefaults = {
          publisher: config.publisher,
          name: config.templates?.storage?.name,
          output: config.defaultOutputDir || options.output
        };
        
        logger.debug('Config defaults extracted', 'create', configDefaults);
      }
    } catch (error) {
      logger.warn('Failed to load config file', 'create', { error });
      // Continue without config - not a fatal error
    }

    // Merge CLI options with config defaults (CLI options take precedence)
    const mergedOptions = {
      publisher: options.publisher || configDefaults.publisher,
      name: options.name || configDefaults.name,
      output: options.output
    };
    
    logger.debug('Merged options', 'create', { cli: options, config: configDefaults, merged: mergedOptions });

    // Enhanced input validation
    if (!type || typeof type !== 'string') {
      logger.error('Application type is required', 'create');
      console.error(chalk.red('❌ Error: Application type is required'));
      console.log(chalk.gray('Usage: azmp create <type> [options]'));
      console.log(chalk.blue('Available types: storage, vm, webapp'));
      process.exit(1);
    }

    // Validate and normalize type
    const normalizedType = type.toLowerCase().trim();
    logger.debug(`Normalized type: ${normalizedType}`, 'create');
    
    if (normalizedType !== 'storage') {
      logger.error(`Unsupported application type: ${type}`, 'create');
      console.error(chalk.red('❌ Unsupported application type:'), type);
      console.log(chalk.gray('Currently only "storage" is supported'));
      console.log(chalk.blue('\n💡 Example:'));
      console.log(chalk.blue('   azmp create storage my-storage-app'));
      process.exit(1);
    }

    // Validate output directory path for security
    logger.debug('Validating output path', 'create', { outputPath: mergedOptions.output });
    if (!SecurityValidation.validateFilePath(mergedOptions.output)) {
      logger.error('Invalid output directory path', 'create', { path: mergedOptions.output });
      console.error(chalk.red('❌ Error: Invalid output directory path'));
      console.log(chalk.gray('Output path must be a safe relative path'));
      process.exit(1);
    }

    // Validate publisher name using specific marketplace validation
    if (mergedOptions.publisher) {
      logger.debug('Validating publisher name', 'create', { publisher: mergedOptions.publisher });
      if (!SecurityValidation.validatePublisherName(mergedOptions.publisher)) {
        logger.error('Invalid publisher name', 'create', { publisher: mergedOptions.publisher });
        console.error(chalk.red('❌ Error: Invalid publisher name'));
        console.log(chalk.gray('Publisher name must be 1-100 characters, alphanumeric with spaces, dots, hyphens, underscores'));
        console.log(chalk.gray('Must start and end with alphanumeric characters'));
        process.exit(1);
      }
    }

    // Validate application name using specific marketplace validation
    if (mergedOptions.name) {
      logger.debug('Validating application name', 'create', { name: mergedOptions.name });
      if (!SecurityValidation.validateApplicationName(mergedOptions.name)) {
        logger.error('Invalid application name', 'create', { name: mergedOptions.name });
        console.error(chalk.red('❌ Error: Invalid application name'));
        console.log(chalk.gray('Application name must be 1-64 characters, alphanumeric with spaces, dots, hyphens, underscores'));
        console.log(chalk.gray('Must start and end with alphanumeric characters'));
        process.exit(1);
      }
    }

    // Collect missing information with enhanced validation
    logger.debug('Collecting missing configuration', 'create');
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'publisher',
        message: 'Publisher name:',
        when: !mergedOptions.publisher,
        validate: (input: string) => {
          if (!input || input.trim().length === 0) return 'Publisher name is required';
          if (!SecurityValidation.validatePublisherName(input)) {
            return 'Publisher name must be 1-100 characters, alphanumeric with spaces, dots, hyphens, underscores. Must start and end with alphanumeric characters.';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'name',
        message: 'Application name:',
        when: !mergedOptions.name,
        default: `My${normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1)}App`,
        validate: (input: string) => {
          if (!input || input.trim().length === 0) return 'Application name is required';
          if (!SecurityValidation.validateApplicationName(input)) {
            return 'Application name must be 1-64 characters, alphanumeric with spaces, dots, hyphens, underscores. Must start and end with alphanumeric characters.';
          }
          return true;
        }
      }
    ]);

    const config = {
      type: normalizedType,
      publisher: mergedOptions.publisher || answers.publisher,
      name: mergedOptions.name || answers.name,
      output: mergedOptions.output
    };

    logger.debug('Final configuration', 'create', config);
    console.log(chalk.green('✅ Configuration:'));
    console.log(chalk.gray('  Type:'), config.type);
    console.log(chalk.gray('  Publisher:'), config.publisher);
    console.log(chalk.gray('  Name:'), config.name);
    console.log(chalk.gray('  Output:'), config.output);

    // Generate templates using the template engine
    logger.info('Starting template generation', 'create');
    const progress = createProgress();
    
    await ErrorHandler.handleAsync(
      async () => {
        progress.start('Generating templates from Handlebars...', 'create');
        const generator = new TemplateGenerator();
        
        progress.update('Creating mainTemplate.json...', 'create');
        await generator.generateTemplate(config);

        progress.succeed('Templates generated successfully!');
        logger.success('Templates generated successfully', 'create');
        console.log(chalk.green('🎉 Success! Managed application package created.'));
        console.log(chalk.blue('📁 Generated files:'));
        console.log(chalk.gray('  • mainTemplate.json'));
        console.log(chalk.gray('  • createUiDefinition.json'));
        console.log(chalk.gray('  • viewDefinition.json'));
        console.log(chalk.yellow('💡 Next: Run'), chalk.cyan(`azmp validate ${config.output}`));
        
        stopTimer();
      },
      'template generation',
      undefined
    );
  });