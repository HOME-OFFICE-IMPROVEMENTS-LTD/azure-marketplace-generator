/**
 * Streaming Package Service Demo
 *
 * This script demonstrates the enhanced streaming capabilities for large ARM template processing.
 * It showcases memory-efficient template analysis, compression, and optimization.
 */

import * as path from 'path';
import chalk from 'chalk';
import { StreamingPackagingService } from '../src/services/streaming-packaging-service';
import { runStreamingPerformanceTests } from '../src/testing/streaming-performance-test';

async function runStreamingDemo(): Promise<void> {
  console.log(chalk.blue('🚀 Azure Marketplace Generator - Streaming Package Service Demo'));
  console.log(chalk.blue('================================================================'));
  console.log();

  try {
    // Initialize streaming service with custom configuration
    const streamingService = new StreamingPackagingService({
      maxMemoryUsage: 150 * 1024 * 1024, // 150MB
      chunkSize: 1024 * 1024, // 1MB chunks
      enableMemoryMonitoring: true,
      tempDir: path.join(process.cwd(), '.temp', 'streaming-demo')
    });

    console.log(chalk.yellow('📊 Configuration:'));
    console.log(chalk.blue('   Max Memory Usage: 150MB'));
    console.log(chalk.blue('   Chunk Size: 1MB'));
    console.log(chalk.blue('   Memory Monitoring: Enabled'));
    console.log();

    // Check if we have test templates
    const exampleTemplatePath = path.join(process.cwd(), 'examples', 'test-template', 'mainTemplate.json');
    const azureDeploymentPath = path.join(process.cwd(), 'azure-deployment', 'mainTemplate.json');

    let templatePath: string | null = null;

    // Try to find an existing template
    try {
      const fs = require('fs-extra');

      if (await fs.pathExists(exampleTemplatePath)) {
        templatePath = exampleTemplatePath;
        console.log(chalk.green(`✅ Using example template: ${templatePath}`));
      } else if (await fs.pathExists(azureDeploymentPath)) {
        templatePath = azureDeploymentPath;
        console.log(chalk.green(`✅ Using deployment template: ${templatePath}`));
      }
    } catch (error) {
      // Template not found, we'll run synthetic tests instead
    }

    if (templatePath) {
      console.log(chalk.yellow('\n🔍 Running streaming analysis on existing template...'));

      try {
        const analysisResult = await streamingService.analyzeTemplateStreaming(templatePath);

        console.log(chalk.green('\n✅ Streaming Analysis Results:'));
        console.log(chalk.blue(`   Resources: ${analysisResult.resourceCount}`));
        console.log(chalk.blue(`   Parameters: ${analysisResult.parameterCount}`));
        console.log(chalk.blue(`   Outputs: ${analysisResult.outputCount}`));
        console.log(chalk.blue(`   Template Size: ${(analysisResult.templateSize / 1024 / 1024).toFixed(2)}MB`));
        console.log(chalk.blue(`   Complexity Score: ${analysisResult.complexity}`));
        console.log(chalk.blue(`   Processing Duration: ${analysisResult.metrics.duration}ms`));
        console.log(chalk.blue(`   Peak Memory Usage: ${(analysisResult.metrics.peakMemoryUsage / 1024 / 1024).toFixed(2)}MB`));
        console.log(chalk.blue(`   Average Memory Usage: ${(analysisResult.metrics.averageMemoryUsage / 1024 / 1024).toFixed(2)}MB`));

        // Generate memory report
        const memoryReport = streamingService.generateMemoryReport();
        console.log(chalk.blue(`   Memory Trend: ${memoryReport.trend}`));
        console.log(chalk.blue(`   Memory Snapshots: ${memoryReport.snapshots.length}`));

        // Try compression if template is reasonable size
        if (analysisResult.templateSize < 50 * 1024 * 1024) { // < 50MB
          console.log(chalk.yellow('\n📦 Running streaming compression...'));

          const outputPath = path.join(process.cwd(), '.temp', 'demo-package.zip');
          const compressionResult = await streamingService.createPackageArchive(
            path.dirname(templatePath),
            outputPath
          );

          console.log(chalk.green('✅ Streaming Compression Results:'));
          console.log(chalk.blue(`   Original Size: ${(compressionResult.fileSize / 1024 / 1024).toFixed(2)}MB`));
          console.log(chalk.blue(`   Compression Ratio: ${(compressionResult.compressionRatio || 1).toFixed(2)}x`));
          console.log(chalk.blue(`   Processing Duration: ${compressionResult.duration}ms`));
          console.log(chalk.blue(`   Peak Memory Usage: ${(compressionResult.peakMemoryUsage / 1024 / 1024).toFixed(2)}MB`));
        }

        // Try optimization
        console.log(chalk.yellow('\n⚡ Running streaming optimization...'));

        const optimizedPath = path.join(process.cwd(), '.temp', 'optimized-template.json');
        const optimizationResult = await streamingService.optimizeTemplateStreaming(
          templatePath,
          optimizedPath
        );

        console.log(chalk.green('✅ Streaming Optimization Results:'));
        console.log(chalk.blue(`   Size Reduction: ${((1 - (optimizationResult.compressionRatio || 1)) * 100).toFixed(1)}%`));
        console.log(chalk.blue(`   Processing Duration: ${optimizationResult.duration}ms`));
        console.log(chalk.blue(`   Peak Memory Usage: ${(optimizationResult.peakMemoryUsage / 1024 / 1024).toFixed(2)}MB`));

      } catch (error: any) {
        console.error(chalk.red('❌ Demo failed:'), error.message);
      }
    }

    // Run comprehensive performance tests
    console.log(chalk.yellow('\n🧪 Running comprehensive streaming performance tests...'));
    console.log(chalk.gray('   This will test small, medium, large, and enterprise-scale templates'));

    try {
      await runStreamingPerformanceTests();
      console.log(chalk.green('\n✅ Performance tests completed successfully!'));
    } catch (error: any) {
      console.error(chalk.red('❌ Performance tests failed:'), error.message);
    }

    // Cleanup
    await streamingService.cleanup();

    console.log(chalk.green('\n🎉 Streaming Package Service Demo Completed!'));
    console.log(chalk.blue('\nKey Benefits Demonstrated:'));
    console.log(chalk.blue('• Memory-efficient processing of large ARM templates'));
    console.log(chalk.blue('• Chunked file processing prevents memory exhaustion'));
    console.log(chalk.blue('• Real-time memory monitoring and reporting'));
    console.log(chalk.blue('• Streaming compression for large package archives'));
    console.log(chalk.blue('• Template optimization with size reduction'));
    console.log(chalk.blue('• Comprehensive performance benchmarking'));
    console.log();
    console.log(chalk.yellow('📄 Check streaming-performance-report.json and .md for detailed results'));

  } catch (error: any) {
    console.error(chalk.red('💥 Demo crashed:'), error.message);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  runStreamingDemo().catch(console.error);
}

export { runStreamingDemo };