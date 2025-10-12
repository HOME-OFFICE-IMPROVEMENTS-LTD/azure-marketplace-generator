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
  .action(async (type: string, options: any) => {
    console.log(chalk.blue('🚀 Creating managed application package...'));

    // Validate input
    const supportedTypes = ['storage', 'vm', 'webapp'];
    if (!supportedTypes.includes(type)) {
      console.error(chalk.red('❌ Unsupported type:'), type);
      console.log(chalk.gray('Supported types:'), supportedTypes.join(', '));
      process.exit(1);
    }

    // Collect missing information
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'publisher',
        message: 'Publisher name:',
        when: !options.publisher,
        validate: (input: string) => input.length > 0 || 'Publisher name is required'
      },
      {
        type: 'input',
        name: 'name',
        message: 'Application name:',
        when: !options.name,
        default: `My${type.charAt(0).toUpperCase() + type.slice(1)}App`,
        validate: (input: string) => input.length > 0 || 'Application name is required'
      }
    ]);

    const config = {
      type,
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