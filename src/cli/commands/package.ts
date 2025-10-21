import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import archiver from 'archiver';
import { SecurityValidation, ValidationError } from '../../utils/security-validation';
import { ErrorHandler, FileSystemError } from '../../utils/error-handler';
import { getLogger } from '../../utils/logger';
import { getConfigManager } from '../../utils/config-manager';
import { createProgress } from '../../utils/progress';

const logger = getLogger();

export const packageCommand = new Command('package')
  .description('Package managed application for marketplace submission')
  .argument('<path>', 'Path to managed application directory')
  .option('-o, --output <file>', 'Output zip file name', 'managed-app-package.zip')
  .option('-c, --config <path>', 'Path to azmp.config.json file')
  .addHelpText('after', `
Examples:
  ${chalk.cyan('$ azmp package ./output')}
    Creates managed-app-package.zip from the ./output directory

  ${chalk.cyan('$ azmp package ./my-app --output my-solution-v1.0.zip')}
    Creates a custom-named package

  ${chalk.cyan('$ azmp package ./output --config ./azmp.config.json')}
    Packages using settings from config file

  ${chalk.cyan('$ azmp package ./output --verbose')}
    Packages with detailed debug information

Package contents:
  The generated ZIP file will contain:
  • mainTemplate.json - Main ARM template
  • createUiDefinition.json - UI definition for Azure Portal
  • viewDefinition.json - View definition for managed app
  • Any nested templates (if applicable)

Requirements:
  • Source directory must exist
  • mainTemplate.json must be present
  • createUiDefinition.json must be present
  • Templates should be validated before packaging

Next steps after packaging:
  1. Upload the ZIP file to Azure Partner Center
  2. Create or update your marketplace offer
  3. Submit for certification and publish
`)
  .action(async (sourcePath: string, options: { output: string; config?: string }) => {
    const stopTimer = logger.startTimer('package command');
    
    console.log(chalk.blue('📦 Packaging for Azure Marketplace...'));
    logger.debug('Starting package command', 'package', { sourcePath, output: options.output });

    // Load config file if specified or found
    const configManager = getConfigManager();
    let packageFileName = options.output;
    
    try {
      const config = await configManager.loadConfig(options.config);
      if (config?.packaging?.defaultFileName && !options.output) {
        logger.debug('Using package file name from config', 'package', { 
          fileName: config.packaging.defaultFileName 
        });
        packageFileName = config.packaging.defaultFileName;
      }
    } catch (error) {
      logger.warn('Failed to load config file', 'package', { error });
      // Continue without config - not a fatal error
    }
    
    console.log(chalk.gray('  Source:'), sourcePath);
    console.log(chalk.gray('  Output:'), packageFileName);

    // Validate input parameters for security
    if (!sourcePath || typeof sourcePath !== 'string') {
      logger.error('Source path is required', 'package');
      console.error(chalk.red('❌ Error: Source path is required'));
      console.log(chalk.gray('Usage: azmp package <path>'));
      process.exit(1);
    }

    // Validate source path for security
    logger.debug('Validating source path', 'package', { path: sourcePath });
    if (!SecurityValidation.validateFilePath(sourcePath)) {
      logger.error('Invalid source path', 'package', { path: sourcePath });
      console.error(chalk.red('❌ Error: Invalid source path'));
      console.log(chalk.gray('Path must be a safe relative path'));
      process.exit(1);
    }

    // Validate output file path for security and format
    logger.debug('Validating output file name', 'package', { fileName: packageFileName });
    if (!SecurityValidation.validatePackageFileName(packageFileName)) {
      logger.error('Invalid package file name', 'package', { fileName: packageFileName });
      console.error(chalk.red('❌ Error: Invalid package file name'));
      console.log(chalk.gray('Package file name must end with .zip and contain only valid filename characters'));
      process.exit(1);
    }

    await ErrorHandler.handleAsync(
      async () => {
        const progress = createProgress();
        
        // Validate source directory exists
        progress.start('Validating source directory...', 'package');
        logger.debug('Checking source directory exists', 'package');
        if (!await fs.pathExists(sourcePath)) {
          progress.fail('Source directory not found');
          throw new FileSystemError('Source directory not found', sourcePath);
        }

        // Check for required files
        progress.update('Checking required files...', 'package');
        logger.debug('Checking for required files', 'package');
        const requiredFiles = ['mainTemplate.json', 'createUiDefinition.json'];
        for (const file of requiredFiles) {
          const filePath = path.join(sourcePath, file);
          if (!await fs.pathExists(filePath)) {
            progress.fail(`Required file missing: ${file}`);
            logger.error(`Required file missing: ${file}`, 'package', { filePath });
            throw new FileSystemError(`Required file missing: ${file}`, filePath);
          }
          logger.debug(`Found required file: ${file}`, 'package');
        }

        // Create zip package
        progress.update('Creating ZIP archive...', 'package');
        logger.info('Creating archive', 'package');
        
        // Ensure output directory exists
        const outputDir = path.dirname(packageFileName);
        if (outputDir && outputDir !== '.' && outputDir !== packageFileName) {
          await fs.ensureDir(outputDir);
          logger.debug('Created output directory', 'package', { outputDir });
        }
        
        const output = fs.createWriteStream(packageFileName);
        const archive = archiver('zip', { zlib: { level: 9 } });

        // Handle archiver errors
        archive.on('error', (err) => {
          progress.fail('Archive creation failed');
          logger.error('Archiver error', 'package', { error: err.message });
          throw new FileSystemError(`Archiver error: ${err.message}`, packageFileName);
        });

        archive.pipe(output);
        archive.directory(sourcePath, false);
        
        progress.update('Compressing files...', 'package');
        logger.debug('Finalizing archive', 'package');
        await archive.finalize();

        // Wait for the output stream to finish
        await new Promise<void>((resolve, reject) => {
          output.on('close', () => {
            logger.debug('Archive stream closed', 'package');
            resolve();
          });
          output.on('error', reject);
        });

        progress.succeed('Package created successfully!');
        logger.success('Package created successfully', 'package');
        console.log(chalk.blue('📄 File:'), packageFileName);
        
        // Show package size
        const stats = await fs.stat(packageFileName);
        const sizeKB = Math.round(stats.size / 1024);
        logger.debug('Package size', 'package', { sizeKB });
        console.log(chalk.gray('📊 Size:'), `${sizeKB} KB`);

        console.log(chalk.yellow('💡 Next: Upload to Azure Partner Center'));
        
        stopTimer();
      },
      'packaging',
      undefined
    );
  });
