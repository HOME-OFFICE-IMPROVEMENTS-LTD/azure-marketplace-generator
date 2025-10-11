import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import archiver from 'archiver';
import { PackagingService, PackageOptimization, PackageAnalysis } from '../../services/packaging-service';

export const packageCommand = new Command('package')
  .description('Package managed application for marketplace submission')
  .argument('<path>', 'Path to managed application directory')
  .option('-o, --output <file>', 'Output zip file name', 'managed-app-package.zip')
  .option('--optimize', 'Enable smart packaging with auto-optimization')
  .option('--optimize-output <dir>', 'Directory for optimized source files')
  .option('--analysis-only', 'Run package analysis without creating package')
  .option('--quality-threshold <score>', 'Minimum quality score required (0-100)', '70')
  .action(async (sourcePath: string, _options: any) => {
    console.log(chalk.blue('📦 Smart Packaging for Azure Marketplace...'));
    console.log(chalk.gray('  Source:'), sourcePath);
    console.log(chalk.gray('  Output:'), options.output);

    try {
      // Verify source directory exists
      if (!await fs.pathExists(sourcePath)) {
        throw new Error(`Source directory not found: ${sourcePath}`);
      }

      // Initialize packaging service
      const packagingService = new PackagingService();
      let finalSourcePath = sourcePath;
      let optimization: PackageOptimization | null = null;

      // Smart packaging with optimization
      if (options.optimize) {
        console.log(chalk.blue('\n⚡ PHASE 2: SMART PACKAGING ACTIVE'));

        const optimizeOutput = options.optimizeOutput || path.join(process.cwd(), 'temp', 'optimized-package');

        // Run optimization
        optimization = await packagingService.optimizePackage(sourcePath, optimizeOutput);
        finalSourcePath = optimizeOutput;

        // Display optimization results
        console.log(chalk.green('\n🎯 OPTIMIZATION RESULTS:'));
        console.log(chalk.blue('  Quality Score:'), chalk.bold(`${optimization.qualityScore}/100`));

        if (optimization.templateOptimizations.length > 0) {
          console.log(chalk.blue('\n  📋 Template Optimizations:'));
          optimization.templateOptimizations.forEach(opt =>
            console.log(chalk.gray('    •'), opt)
          );
        }

        if (optimization.uiOptimizations.length > 0) {
          console.log(chalk.blue('\n  🎨 UI Optimizations:'));
          optimization.uiOptimizations.forEach(opt =>
            console.log(chalk.gray('    •'), opt)
          );
        }

        if (optimization.metadataEnhancements.length > 0) {
          console.log(chalk.blue('\n  📝 Metadata Enhancements:'));
          optimization.metadataEnhancements.forEach(opt =>
            console.log(chalk.gray('    •'), opt)
          );
        }

        if (optimization.assetOptimizations.length > 0) {
          console.log(chalk.blue('\n  🗂️  Asset Optimizations:'));
          optimization.assetOptimizations.forEach(opt =>
            console.log(chalk.gray('    •'), opt)
          );
        }

        if (optimization.recommendations.length > 0) {
          console.log(chalk.yellow('\n💡 RECOMMENDATIONS:'));
          optimization.recommendations.forEach(rec =>
            console.log(chalk.gray('    •'), rec)
          );
        }

        // Check quality threshold
        const threshold = parseInt(options.qualityThreshold);
        if (optimization.qualityScore < threshold) {
          console.log(chalk.red(`\n❌ Quality score ${optimization.qualityScore} below threshold ${threshold}`));
          console.log(chalk.yellow('   Consider addressing recommendations before packaging'));
          if (!options.force) {
            process.exit(1);
          }
        }
      } else {
        // Run analysis only for regular packaging
        const analysis = await packagingService.analyzePackage(sourcePath);
        console.log(chalk.blue('\n📊 PACKAGE ANALYSIS:'));
        console.log(chalk.gray('  Marketplace Readiness:'), `${analysis.marketplaceReadiness}/100`);
        console.log(chalk.gray('  Security Score:'), `${analysis.securityScore}/100`);
        console.log(chalk.gray('  Performance Score:'), `${analysis.performanceScore}/100`);
        console.log(chalk.gray('  Total Size:'), `${analysis.totalSizeKB} KB`);
      }

      // Analysis-only mode
      if (options.analysisOnly) {
        console.log(chalk.blue('\n✅ Analysis complete. Package creation skipped.'));
        return;
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
        const filePath = path.join(finalSourcePath, file);
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
        console.log(chalk.green('\n✅ Package created successfully!'));
        console.log(chalk.gray('  Size:'), `${sizeKB} KB`);

        if (optimization) {
          console.log(chalk.blue('  Quality Score:'), `${optimization.qualityScore}/100`);
          console.log(chalk.blue('  Optimizations Applied:'),
            optimization.templateOptimizations.length +
            optimization.uiOptimizations.length +
            optimization.metadataEnhancements.length +
            optimization.assetOptimizations.length
          );
        }

        console.log(chalk.blue('🚀 Ready for Partner Center upload!'));

        if (options.optimize && optimization && optimization.qualityScore >= 90) {
          console.log(chalk.green('🏆 MARKETPLACE EXCELLENCE ACHIEVED!'));
        }
      });

      archive.pipe(output);

      // Add all files from the directory
      archive.directory(finalSourcePath, false);

      await archive.finalize();

      // Clean up temporary files if optimization was used
      if (options.optimize && options.optimizeOutput) {
        console.log(chalk.gray('\n🧹 Cleaning up temporary optimization files...'));
        await fs.remove(options.optimizeOutput);
      }

    } catch (error: any) {
      console.error(chalk.red('❌ Packaging failed:'), error.message);

      // Clean up on error
      if (options.optimize && options.optimizeOutput) {
        try {
          await fs.remove(options.optimizeOutput);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }

      process.exit(1);
    }
  });