import { performance, PerformanceObserver } from 'perf_hooks';
import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { EnhancedArmTtkValidator } from '../core/enhanced-validator';

export interface BenchmarkMetrics {
  name: string;
  duration: number;
  memoryStart: NodeJS.MemoryUsage;
  memoryEnd: NodeJS.MemoryUsage;
  memoryDelta: number;
  cpuStart: number;
  cpuEnd: number;
  cpuUsage: number;
  success: boolean;
  error?: string;
  timestamp: string;
}

export interface LoadTestConfig {
  templatePaths: string[];
  concurrency: number;
  iterations: number;
  warmupIterations: number;
  timeout: number;
  enableCache: boolean;
  outputFile?: string;
}

export interface LoadTestResults {
  config: LoadTestConfig;
  metrics: BenchmarkMetrics[];
  summary: {
    totalDuration: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    successRate: number;
    throughput: number;
    memoryEfficiency: number;
    cpuEfficiency: number;
  };
  errors: string[];
}

export class ValidationBenchmark {
  private validator: EnhancedArmTtkValidator;
  private observer: PerformanceObserver | undefined;
  private measurements: Map<string, BenchmarkMetrics> = new Map();

  constructor(validator?: EnhancedArmTtkValidator) {
    this.validator = validator || new EnhancedArmTtkValidator();
    this.setupPerformanceObserver();
  }

  private setupPerformanceObserver(): void {
    this.observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name.startsWith('arm-validation-')) {
          const id = entry.name.replace('arm-validation-', '');
          const metrics = this.measurements.get(id);
          if (metrics) {
            metrics.duration = entry.duration;
          }
        }
      });
    });

    this.observer.observe({ type: 'measure' });
  }

  /**
   * Benchmark single template validation
   */
  async benchmarkSingleValidation(
    templatePath: string,
    name: string = 'single-validation',
    useCache: boolean = false
  ): Promise<BenchmarkMetrics> {
    console.log(chalk.blue(`🔬 Benchmarking: ${name}`));

    const id = `${name}-${Date.now()}`;
    const startMark = `start-${id}`;
    const endMark = `end-${id}`;
    const measureName = `arm-validation-${id}`;

    // Start measurements
    const memoryStart = process.memoryUsage();
    const cpuStart = process.cpuUsage();

    performance.mark(startMark);

    let success = false;
    let error: string | undefined;

    try {
      await this.validator.validateTemplate(templatePath, [], useCache);
      success = true;
    } catch (err: any) {
      error = err.message;
      success = false;
    }

    // End measurements
    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);

    const memoryEnd = process.memoryUsage();
    const cpuEnd = process.cpuUsage(cpuStart);

    const metrics: BenchmarkMetrics = {
      name,
      duration: 0, // Will be set by performance observer
      memoryStart,
      memoryEnd,
      memoryDelta: memoryEnd.rss - memoryStart.rss,
      cpuStart: cpuStart.user + cpuStart.system,
      cpuEnd: cpuEnd.user + cpuEnd.system,
      cpuUsage: cpuEnd.user + cpuEnd.system,
      success,
      error,
      timestamp: new Date().toISOString()
    };

    this.measurements.set(id, metrics);

    // Wait for performance observer to populate duration
    await new Promise(resolve => setTimeout(resolve, 100));

    const finalMetrics = this.measurements.get(id) || metrics;
    this.displayMetrics(finalMetrics);

    return finalMetrics;
  }

  /**
   * Run comprehensive load test
   */
  async runLoadTest(config: LoadTestConfig): Promise<LoadTestResults> {
    console.log(chalk.blue('🚀 Starting ARM Template Validation Load Test'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.blue(`Templates: ${config.templatePaths.length}`));
    console.log(chalk.blue(`Concurrency: ${config.concurrency}`));
    console.log(chalk.blue(`Iterations: ${config.iterations}`));
    console.log(chalk.blue(`Cache enabled: ${config.enableCache}`));
    console.log(chalk.gray('─'.repeat(60)));

    const results: LoadTestResults = {
      config,
      metrics: [],
      summary: {
        totalDuration: 0,
        averageDuration: 0,
        minDuration: Number.MAX_VALUE,
        maxDuration: 0,
        successRate: 0,
        throughput: 0,
        memoryEfficiency: 0,
        cpuEfficiency: 0
      },
      errors: []
    };

    const testStartTime = performance.now();

    try {
      // Warmup phase
      if (config.warmupIterations > 0) {
        console.log(chalk.yellow(`🔥 Warmup phase: ${config.warmupIterations} iterations`));

        for (let i = 0; i < config.warmupIterations; i++) {
          const templatePath = config.templatePaths[i % config.templatePaths.length];
          try {
            await this.validator.validateTemplate(templatePath, [], config.enableCache);
          } catch (error) {
            // Ignore warmup errors
          }
        }

        console.log(chalk.green('✅ Warmup completed'));
      }

      // Main load test
      console.log(chalk.blue('📊 Starting main load test...'));

      const batches = this.createBatches(config.templatePaths, config.iterations, config.concurrency);

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(chalk.gray(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} templates)`));

        const batchPromises = batch.map(async (templatePath, index) => {
          const testName = `load-test-batch-${batchIndex}-item-${index}`;
          return this.benchmarkSingleValidation(templatePath, testName, config.enableCache);
        });

        try {
          const batchResults = await Promise.allSettled(batchPromises);

          batchResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              results.metrics.push(result.value);
            } else {
              results.errors.push(`Batch ${batchIndex}, Item ${index}: ${result.reason}`);
            }
          });

        } catch (error: any) {
          results.errors.push(`Batch ${batchIndex} failed: ${error.message}`);
        }

        // Progress indicator
        const progress = ((batchIndex + 1) / batches.length * 100).toFixed(1);
        console.log(chalk.blue(`Progress: ${progress}% complete`));
      }

      // Calculate summary statistics
      results.summary = this.calculateSummary(results.metrics, performance.now() - testStartTime);

      // Display results
      this.displayLoadTestResults(results);

      // Save results if output file specified
      if (config.outputFile) {
        await this.saveResults(results, config.outputFile);
      }

    } catch (error: any) {
      console.error(chalk.red('❌ Load test failed:'), error.message);
      results.errors.push(`Load test execution failed: ${error.message}`);
    }

    return results;
  }

  /**
   * Create batches for concurrent execution
   */
  private createBatches(templatePaths: string[], iterations: number, concurrency: number): string[][] {
    const allTemplates: string[] = [];

    // Repeat templates for iterations
    for (let i = 0; i < iterations; i++) {
      allTemplates.push(...templatePaths);
    }

    // Create batches
    const batches: string[][] = [];
    for (let i = 0; i < allTemplates.length; i += concurrency) {
      batches.push(allTemplates.slice(i, i + concurrency));
    }

    return batches;
  }

  /**
   * Calculate comprehensive summary statistics
   */
  private calculateSummary(metrics: BenchmarkMetrics[], totalDuration: number): LoadTestResults['summary'] {
    if (metrics.length === 0) {
      return {
        totalDuration,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        successRate: 0,
        throughput: 0,
        memoryEfficiency: 0,
        cpuEfficiency: 0
      };
    }

    const durations = metrics.map(m => m.duration);
    const successCount = metrics.filter(m => m.success).length;
    const totalMemoryUsed = metrics.reduce((sum, m) => sum + Math.max(0, m.memoryDelta), 0);
    const totalCpuUsed = metrics.reduce((sum, m) => sum + m.cpuUsage, 0);

    return {
      totalDuration,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      successRate: (successCount / metrics.length) * 100,
      throughput: metrics.length / (totalDuration / 1000), // operations per second
      memoryEfficiency: totalMemoryUsed / metrics.length / 1024 / 1024, // MB per operation
      cpuEfficiency: totalCpuUsed / metrics.length / 1000 // ms CPU per operation
    };
  }

  /**
   * Display individual metrics
   */
  private displayMetrics(metrics: BenchmarkMetrics): void {
    const memoryMB = (metrics.memoryDelta / 1024 / 1024).toFixed(2);
    const cpuMs = (metrics.cpuUsage / 1000).toFixed(2);

    console.log(chalk.gray(`  ${metrics.name}:`));
    console.log(chalk.gray(`    Duration: ${metrics.duration.toFixed(0)}ms`));
    console.log(chalk.gray(`    Memory: ${memoryMB}MB`));
    console.log(chalk.gray(`    CPU: ${cpuMs}ms`));
    console.log(chalk.gray(`    Status: ${metrics.success ? chalk.green('✅') : chalk.red('❌')}`));

    if (metrics.error) {
      console.log(chalk.red(`    Error: ${metrics.error}`));
    }
  }

  /**
   * Display comprehensive load test results
   */
  private displayLoadTestResults(results: LoadTestResults): void {
    console.log('\n' + chalk.blue('📊 Load Test Results Summary'));
    console.log(chalk.gray('═'.repeat(80)));

    const summary = results.summary;

    console.log(chalk.blue('🎯 Performance Metrics:'));
    console.log(chalk.blue(`  Total Duration: ${chalk.cyan((summary.totalDuration / 1000).toFixed(2))}s`));
    console.log(chalk.blue(`  Average Duration: ${chalk.cyan(summary.averageDuration.toFixed(0))}ms`));
    console.log(chalk.blue(`  Min Duration: ${chalk.green(summary.minDuration.toFixed(0))}ms`));
    console.log(chalk.blue(`  Max Duration: ${chalk.red(summary.maxDuration.toFixed(0))}ms`));
    console.log(chalk.blue(`  Success Rate: ${chalk.green(summary.successRate.toFixed(1))}%`));
    console.log(chalk.blue(`  Throughput: ${chalk.cyan(summary.throughput.toFixed(2))} ops/sec`));

    console.log(chalk.blue('\n💾 Resource Usage:'));
    console.log(chalk.blue(`  Memory per Operation: ${chalk.cyan(summary.memoryEfficiency.toFixed(2))}MB`));
    console.log(chalk.blue(`  CPU per Operation: ${chalk.cyan(summary.cpuEfficiency.toFixed(2))}ms`));

    console.log(chalk.blue('\n📈 Test Statistics:'));
    console.log(chalk.blue(`  Total Operations: ${results.metrics.length}`));
    console.log(chalk.blue(`  Successful: ${chalk.green(results.metrics.filter(m => m.success).length)}`));
    console.log(chalk.blue(`  Failed: ${chalk.red(results.errors.length)}`));

    if (results.errors.length > 0) {
      console.log(chalk.red('\n❌ Errors Encountered:'));
      results.errors.slice(0, 5).forEach((error, index) => {
        console.log(chalk.red(`  ${index + 1}. ${error}`));
      });

      if (results.errors.length > 5) {
        console.log(chalk.gray(`  ... and ${results.errors.length - 5} more errors`));
      }
    }

    // Performance analysis
    console.log(chalk.blue('\n🔍 Performance Analysis:'));

    if (summary.throughput < 1) {
      console.log(chalk.red('  ⚠️  Low throughput detected - consider optimizing validation logic'));
    } else {
      console.log(chalk.green('  ✅ Good throughput performance'));
    }

    if (summary.memoryEfficiency > 100) {
      console.log(chalk.red('  ⚠️  High memory usage per operation - check for memory leaks'));
    } else {
      console.log(chalk.green('  ✅ Efficient memory usage'));
    }

    if (summary.successRate < 90) {
      console.log(chalk.red('  ⚠️  Low success rate - investigate common failure patterns'));
    } else {
      console.log(chalk.green('  ✅ High success rate'));
    }

    console.log(chalk.gray('═'.repeat(80)));
  }

  /**
   * Save results to file
   */
  private async saveResults(results: LoadTestResults, outputFile: string): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(outputFile));
      await fs.writeJSON(outputFile, results, { spaces: 2 });
      console.log(chalk.green(`📁 Results saved to: ${outputFile}`));
    } catch (error: any) {
      console.error(chalk.red(`❌ Failed to save results: ${error.message}`));
    }
  }

  /**
   * Generate synthetic load test configuration
   */
  static generateLoadTestConfig(options: {
    templateFixturePath: string;
    concurrency?: number;
    iterations?: number;
    enableCache?: boolean;
  }): LoadTestConfig {
    return {
      templatePaths: [
        path.join(options.templateFixturePath, 'malformed-json.json'),
        path.join(options.templateFixturePath, 'circular-dependency.json'),
        path.join(options.templateFixturePath, 'oversized', 'large-template.json')
      ],
      concurrency: options.concurrency || 5,
      iterations: options.iterations || 3,
      warmupIterations: 2,
      timeout: 300000, // 5 minutes
      enableCache: options.enableCache || false,
      outputFile: path.join(process.cwd(), 'benchmark-results.json')
    };
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    this.observer?.disconnect();
    await this.validator.destroy();
    this.measurements.clear();
    console.log(chalk.blue('🧹 Benchmark cleanup completed'));
  }
}