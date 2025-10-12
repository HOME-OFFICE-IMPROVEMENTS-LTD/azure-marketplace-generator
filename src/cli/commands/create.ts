import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { TemplateGenerator } from '../../core/generator';

export const createCommand = new Command('create')
  .description('Create a new managed application package')
  .argument('<type>', 'Application type (storage, vm, webapp)')
  .option('-p, --publisher <name>', 'Publisher name for the marketplace')
  .option('-n, --name <name>', 'Application name')
  .option('-o, --output <dir>', 'Output directory', './output')
  .action(async (type: string, options: { publisher?: string; name?: string; output: string }) => {
    console.log(chalk.blue('🚀 Creating managed application package...'));

    // Enhanced input validation
    if (!type || typeof type !== 'string') {
      console.error(chalk.red('❌ Error: Application type is required'));
      console.log(chalk.gray('Usage: azmp create <type> [options]'));
      console.log(chalk.blue('Available types: storage, vm, webapp'));
      process.exit(1);
    }

    // Validate and normalize type
    const normalizedType = type.toLowerCase().trim();
    const supportedTypes = ['storage', 'vm', 'webapp'];

    if (!supportedTypes.includes(normalizedType)) {
      console.error(chalk.red('❌ Unsupported application type:'), type);
      console.log(chalk.gray('Supported types:'), supportedTypes.join(', '));
      console.log(chalk.blue('\n💡 Examples:'));
      console.log(chalk.blue('   azmp create storage my-storage-app'));
      console.log(chalk.blue('   azmp create vm my-vm-solution'));
      console.log(chalk.blue('   azmp create webapp my-web-app'));
      process.exit(1);
    }

    // Validate output directory
    if (options.output && typeof options.output !== 'string') {
      console.error(chalk.red('❌ Error: Output directory must be a string'));
      process.exit(1);
    }

    // Validate publisher name format
    if (options.publisher) {
      if (typeof options.publisher !== 'string' || options.publisher.trim().length === 0) {
        console.error(chalk.red('❌ Error: Publisher name must be a non-empty string'));
        process.exit(1);
      }
      if (!/^[a-zA-Z0-9\s\-_.]+$/.test(options.publisher)) {
        console.error(chalk.red('❌ Error: Publisher name contains invalid characters'));
        console.log(chalk.gray('Allowed: letters, numbers, spaces, hyphens, underscores, dots'));
        process.exit(1);
      }
    }

    // Validate application name format
    if (options.name) {
      if (typeof options.name !== 'string' || options.name.trim().length === 0) {
        console.error(chalk.red('❌ Error: Application name must be a non-empty string'));
        process.exit(1);
      }
      if (!/^[a-zA-Z0-9\s\-_]+$/.test(options.name)) {
        console.error(chalk.red('❌ Error: Application name contains invalid characters'));
        console.log(chalk.gray('Allowed: letters, numbers, spaces, hyphens, underscores'));
        process.exit(1);
      }
    }

    // Collect missing information
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'publisher',
        message: 'Publisher name:',
        when: !options.publisher,
        validate: (input: string) => {
          if (!input || input.trim().length === 0) return 'Publisher name is required';
          if (!/^[a-zA-Z0-9\s\-_.]+$/.test(input)) return 'Invalid characters in publisher name';
          return true;
        }
      },
      {
        type: 'input',
        name: 'name',
        message: 'Application name:',
        when: !options.name,
        default: `My${normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1)}App`,
        validate: (input: string) => {
          if (!input || input.trim().length === 0) return 'Application name is required';
          if (!/^[a-zA-Z0-9\s\-_]+$/.test(input)) return 'Invalid characters in application name';
          return true;
        }
      }
    ]);

    const config = {
      type: normalizedType,
      publisher: options.publisher || answers.publisher,
      name: options.name || answers.name,
      output: options.output
    };

    console.log(chalk.green('✅ Configuration:'));
    console.log(chalk.gray('  Type:'), config.type);
    console.log(chalk.gray('  Publisher:'), config.publisher);
    console.log(chalk.gray('  Name:'), config.name);
    console.log(chalk.gray('  Output:'), config.output);

    // Generate templates using the template engine
    try {
      const generator = new TemplateGenerator();
      await generator.generateTemplate(config);

      console.log(chalk.green('🎉 Success! Managed application package created.'));
      console.log(chalk.blue('📁 Generated files:'));
      console.log(chalk.gray('  • mainTemplate.json'));
      console.log(chalk.gray('  • createUiDefinition.json'));
      console.log(chalk.gray('  • viewDefinition.json'));
      console.log(chalk.gray('  • nestedtemplates/storageAccount.json'));
      console.log(chalk.yellow('💡 Next: Run'), chalk.cyan(`azmp validate ${config.output}`));

    } catch (_error) {
      console.error(chalk.red('❌ Template generation failed:'), (_error as Error).message);
      process.exit(1);
    }
  });