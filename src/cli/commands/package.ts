import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import archiver from 'archiver';

export const packageCommand = new Command('package')
  .description('Package managed application for marketplace submission')
  .argument('<path>', 'Path to managed application directory')
  .option('-o, --output <file>', 'Output zip file name', 'managed-app-package.zip')
  .action(async (path: string, options: any) => {
    console.log(chalk.blue('📦 Packaging managed application...'));
    console.log(chalk.gray('  Source:'), path);
    console.log(chalk.gray('  Output:'), options.output);

    try {
      // Verify source directory exists
      if (!await fs.pathExists(path)) {
        throw new Error(`Source directory not found: ${path}`);
      }

      // Required files for marketplace
      const requiredFiles = [
        'mainTemplate.json',
        'createUiDefinition.json'
      ];

      // Optional but recommended files
      const optionalFiles = [
        'viewDefinition.json'
      ];

      // Check for required files
      for (const file of requiredFiles) {
        const filePath = `${path}/${file}`;
        if (!await fs.pathExists(filePath)) {
          throw new Error(`Required file missing: ${file}`);
        }
      }

      console.log(chalk.green('✅ All required files found'));

      // Create zip package
      const output = fs.createWriteStream(options.output);
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.on('error', (err) => {
        throw err;
      });

      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          console.log(chalk.yellow('⚠️ Warning:'), err.message);
        } else {
          throw err;
        }
      });

      output.on('close', () => {
        const sizeKB = Math.round(archive.pointer() / 1024);
        console.log(chalk.green('✅ Package created successfully!'));
        console.log(chalk.gray('  Size:'), `${sizeKB} KB`);
        console.log(chalk.blue('🚀 Ready for Partner Center upload!'));
      });

      archive.pipe(output);

      // Add all files from the directory
      archive.directory(path, false);

      await archive.finalize();

    } catch (error: any) {
      console.error(chalk.red('❌ Packaging failed:'), error.message);
      process.exit(1);
    }
  });