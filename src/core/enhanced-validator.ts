import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import { spawn } from 'child_process';
import chalk from 'chalk';
import pLimit, { LimitFunction } from 'p-limit';
import PQueue from 'p-queue';
import { performance } from 'perf_hooks';
import { SecurityValidation, ValidationError } from '../utils/security-validation';
import { AppConfig } from '../config/app-config';

export interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  details: string;
  passCount: number;
  failCount: number;
  testResults: TestResult[];
  timestamp: string;
  cached?: boolean;
  duration?: number;
}

export interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  file?: string;
  line?: number;
}

export interface ValidationCache {
  hash: string;
  result: ValidationResult;
  timestamp: number;
  ttl: number;
}

export interface WorkerStats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageDuration: number;
  queueSize: number;
  activeWorkers: number;
}

export class EnhancedArmTtkValidator {
  private armTtkPath: string;
  private cacheDir: string;
  private workerLimit: LimitFunction;
  private queue: PQueue;
  private cache: Map<string, ValidationCache> = new Map();
  private stats: WorkerStats = {
    totalJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    averageDuration: 0,
    queueSize: 0,
    activeWorkers: 0
  };

  constructor(options: {
    armTtkPath?: string;
    maxConcurrency?: number;
    cacheDir?: string;
    cacheTtl?: number;
  } = {}) {
    this.armTtkPath = options.armTtkPath || AppConfig.getArmTtkPath();
    this.cacheDir = options.cacheDir || AppConfig.getCacheDir();

    // Create worker pool with limited concurrency
    const maxConcurrency = options.maxConcurrency || 5;
    this.workerLimit = pLimit(maxConcurrency);

    // Create queue for job management
    this.queue = new PQueue({
      concurrency: maxConcurrency,
      interval: 100, // Rate limiting: max 10 jobs per second
      intervalCap: 10
    });

    // Ensure cache directory exists
    this.initializeCache();
  }

  private async initializeCache(): Promise<void> {
    try {
      await fs.ensureDir(this.cacheDir);
      await this.loadCacheFromDisk();
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Could not initialize cache: ${error}`));
    }
  }

  /**
   * Calculate hash for template content to enable caching
   */
  private calculateTemplateHash(templatePath: string, skipTests?: string[]): string {
    const hasher = crypto.createHash('sha256');
    hasher.update(templatePath);

    if (skipTests && skipTests.length > 0) {
      hasher.update(JSON.stringify(skipTests.sort()));
    }

    return hasher.digest('hex');
  }

  /**
   * Check if validation result is cached and valid
   */
  private async getCachedResult(hash: string): Promise<ValidationResult | null> {
    const cached = this.cache.get(hash);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(chalk.green('📋 Using cached validation result'));
      return { ...cached.result, cached: true };
    }

    return null;
  }

  /**
   * Store validation result in cache
   */
  private async setCachedResult(hash: string, result: ValidationResult, ttl: number = 3600000): Promise<void> {
    const cacheEntry: ValidationCache = {
      hash,
      result: { ...result, cached: false },
      timestamp: Date.now(),
      ttl
    };

    this.cache.set(hash, cacheEntry);

    // Persist to disk
    try {
      const cachePath = path.join(this.cacheDir, `${hash}.json`);
      await fs.writeJSON(cachePath, cacheEntry);
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Could not persist cache: ${error}`));
    }
  }

  /**
   * Load cache from disk on startup
   */
  private async loadCacheFromDisk(): Promise<void> {
    try {
      const cacheFiles = await fs.readdir(this.cacheDir);

      for (const file of cacheFiles) {
        if (file.endsWith('.json')) {
          try {
            const cachePath = path.join(this.cacheDir, file);
            const cacheEntry: ValidationCache = await fs.readJSON(cachePath);

            // Check if cache entry is still valid
            if (Date.now() - cacheEntry.timestamp < cacheEntry.ttl) {
              this.cache.set(cacheEntry.hash, cacheEntry);
            } else {
              // Remove expired cache file
              await fs.remove(cachePath);
            }
          } catch (error) {
            console.warn(chalk.yellow(`⚠️  Invalid cache file ${file}: ${error}`));
          }
        }
      }

      console.log(chalk.blue(`📋 Loaded ${this.cache.size} cached validation results`));
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Could not load cache from disk: ${error}`));
    }
  }

  /**
   * Validate template with worker pool and caching
   */
  async validateTemplate(
    templatePath: string,
    skipTests?: string[],
    useCache: boolean = true
  ): Promise<ValidationResult> {
    console.log(chalk.blue('🔍 Starting enhanced ARM-TTK validation...'));
    console.log(chalk.gray(`  Template path: ${templatePath}`));

    const startTime = performance.now();
    this.stats.totalJobs++;
    this.stats.queueSize = this.queue.size;

    // Calculate hash for caching
    const templateHash = this.calculateTemplateHash(templatePath, skipTests);

    // Check cache first
    if (useCache) {
      const cachedResult = await this.getCachedResult(templateHash);
      if (cachedResult) {
        this.stats.completedJobs++;
        return cachedResult;
      }
    }

    // Add to queue for processing
    return this.queue.add(async () => {
      return this.workerLimit(async () => {
        this.stats.activeWorkers++;

        try {
          const result = await this.executeValidation(templatePath, skipTests);
          const duration = performance.now() - startTime;

          result.duration = duration;
          this.updateStats(duration, true);

          // Cache the result
          if (useCache) {
            await this.setCachedResult(templateHash, result);
          }

          return result;
        } catch (error) {
          this.updateStats(performance.now() - startTime, false);
          throw error;
        } finally {
          this.stats.activeWorkers--;
        }
      });
    });
  }

  /**
   * Execute validation with enhanced error handling and timeouts
   */
  private async executeValidation(templatePath: string, skipTests?: string[]): Promise<ValidationResult> {
    // Verify ARM-TTK exists
    if (!await fs.pathExists(this.armTtkPath)) {
      throw new Error(`ARM-TTK not found at: ${this.armTtkPath}. Please ensure ARM-TTK is installed.`);
    }

    // Verify template directory exists
    if (!await fs.pathExists(templatePath)) {
      throw new Error(`Template path not found: ${templatePath}`);
    }

    // Check template size before processing
    const stats = await fs.stat(templatePath);
    const sizeMB = stats.size / (1024 * 1024);

    if (sizeMB > 100) {
      console.warn(chalk.yellow(`⚠️  Large template detected: ${sizeMB.toFixed(2)}MB`));
      console.warn(chalk.yellow(`   This may take longer to validate...`));
    }

    const timestamp = new Date().toISOString();

    try {
      // Validate template path to prevent injection
      if (!SecurityValidation.validateFilePath(templatePath)) {
        throw new ValidationError(`Invalid template path: ${templatePath}`, 'templatePath');
      }

      // Build secure PowerShell command using escaped strings to prevent injection
      const moduleDir = path.dirname(this.armTtkPath);
      const escapedModuleDir = SecurityValidation.escapePowerShellString(moduleDir);
      const escapedTemplatePath = SecurityValidation.escapePowerShellString(templatePath);

      // Build PowerShell command with properly escaped paths
      let command = `Import-Module '${escapedModuleDir}'; Test-AzTemplate -TemplatePath '${escapedTemplatePath}'`;

      if (skipTests && skipTests.length > 0) {
        // Validate skip test names to prevent injection
        const validatedSkipTests = skipTests.filter(test =>
          SecurityValidation.validateTestName(test)
        );

        if (validatedSkipTests.length > 0) {
          const escapedSkipList = validatedSkipTests
            .map(test => SecurityValidation.escapePowerShellString(test))
            .join("','");
          command += ` -Skip @('${escapedSkipList}')`;
          console.log(chalk.gray(`  Skipping tests: ${validatedSkipTests.join(', ')}`));
        }
      }

      const psArgs = ['-Command', command];

      console.log(chalk.gray(`  Executing ARM-TTK validation with worker pool...`));

      // Execute with timeout and enhanced error handling
      const { stdout, stderr } = await this.runSecurePowerShellWithTimeout(psArgs, 300000); // 5 minute timeout

      const result = this.parseEnhancedArmTtkOutput(stdout, stderr, timestamp);
      this.displayValidationSummary(result);

      return result;

    } catch (error: any) {
      console.error(chalk.red('❌ ARM-TTK execution failed:'), error.message);

      return {
        success: false,
        errors: [`ARM-TTK execution failed: ${error.message}`],
        warnings: [],
        details: error.stdout || error.stderr || 'No output available',
        passCount: 0,
        failCount: 1,
        testResults: [{
          name: 'ARM-TTK Execution',
          status: 'fail',
          message: error.message
        }],
        timestamp
      };
    }
  }

  /**
   * Enhanced PowerShell execution with timeout and memory monitoring
   */
  private async runSecurePowerShellWithTimeout(
    args: string[],
    timeout: number = 120000
  ): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const startMemory = process.memoryUsage();

      const childProcess = spawn('pwsh', args, {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      let timedOut = false;

      childProcess.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      childProcess.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      childProcess.on('close', (code: number | null) => {
        if (timedOut) return;

        const endMemory = process.memoryUsage();
        const memoryDelta = endMemory.rss - startMemory.rss;

        if (memoryDelta > 50 * 1024 * 1024) { // 50MB threshold
          console.warn(chalk.yellow(`⚠️  High memory usage: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`));
        }

        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`PowerShell process exited with code ${code}: ${stderr}`));
        }
      });

      childProcess.on('error', (error: Error) => {
        if (timedOut) return;
        reject(new Error(`Failed to spawn PowerShell process: ${error.message}`));
      });

      // Enhanced timeout with cleanup
      const timeoutId = setTimeout(() => {
        timedOut = true;
        childProcess.kill('SIGTERM');

        // Force kill if SIGTERM doesn't work
        setTimeout(() => {
          if (!childProcess.killed) {
            childProcess.kill('SIGKILL');
          }
        }, 5000);

        reject(new Error(`PowerShell execution timed out after ${timeout}ms`));
      }, timeout);

      childProcess.on('close', () => {
        clearTimeout(timeoutId);
      });
    });
  }

  /**
   * Parse ARM-TTK output with enhanced error detection
   */
  private parseEnhancedArmTtkOutput(stdout: string, stderr: string, timestamp: string): ValidationResult {
    const result: ValidationResult = {
      success: true,
      errors: [],
      warnings: [],
      details: stdout,
      passCount: 0,
      failCount: 0,
      testResults: [],
      timestamp
    };

    // Enhanced parsing logic
    const lines = stdout.split('\n');
    let currentFile = '';
    let currentTest = '';

    for (const line of lines) {
      const trimmed = line.trim();

      // File validation headers
      if (trimmed.includes('Validating ') && (trimmed.includes('.json') || trimmed.includes('.template'))) {
        currentFile = trimmed.replace('Validating ', '').trim();
        continue;
      }

      // Test name patterns
      if (trimmed.match(/^\s*[A-Z][a-zA-Z\s]+$/)) {
        currentTest = trimmed;
        continue;
      }

      // Success patterns
      if (trimmed.includes('[+]') || trimmed.includes('✓') || trimmed.includes('PASS')) {
        const testName = this.extractTestName(trimmed, currentTest);
        result.testResults.push({
          name: testName,
          status: 'pass',
          message: 'Test passed',
          file: currentFile
        });
        result.passCount++;
      }

      // Failure patterns
      if (trimmed.includes('[-]') || trimmed.includes('✗') || trimmed.includes('FAIL')) {
        const testName = this.extractTestName(trimmed, currentTest);
        result.testResults.push({
          name: testName,
          status: 'fail',
          message: trimmed,
          file: currentFile
        });
        result.errors.push(`${currentFile}: ${trimmed}`);
        result.failCount++;
        result.success = false;
      }

      // Warning patterns
      if (trimmed.includes('[?]') || trimmed.includes('⚠') || trimmed.includes('WARN')) {
        const testName = this.extractTestName(trimmed, currentTest);
        result.testResults.push({
          name: testName,
          status: 'warning',
          message: trimmed,
          file: currentFile
        });
        result.warnings.push(`${currentFile}: ${trimmed}`);
      }
    }

    // Enhanced stderr processing
    if (stderr && stderr.trim()) {
      const stderrLines = stderr.split('\n').filter(line => line.trim());
      for (const errorLine of stderrLines) {
        if (!errorLine.includes('WARNING') &&
            !errorLine.includes('ProgressPreference') &&
            !errorLine.includes('Information')) {
          result.errors.push(`PowerShell Error: ${errorLine.trim()}`);
          result.success = false;
          result.failCount++;
        }
      }
    }

    return result;
  }

  /**
   * Extract test name from various output formats
   */
  private extractTestName(line: string, fallback: string): string {
    // Remove status indicators
    let testName = line.replace(/\[[\+\-\?]\]|\s*✓\s*|\s*✗\s*|\s*⚠\s*/g, '').trim();

    // Remove timing information
    testName = testName.replace(/\(\d+\s*ms\)/g, '').trim();

    return testName || fallback || 'Unknown Test';
  }

  /**
   * Update performance statistics
   */
  private updateStats(duration: number, success: boolean): void {
    if (success) {
      this.stats.completedJobs++;
    } else {
      this.stats.failedJobs++;
    }

    // Update average duration
    const totalCompleted = this.stats.completedJobs + this.stats.failedJobs;
    this.stats.averageDuration = (this.stats.averageDuration * (totalCompleted - 1) + duration) / totalCompleted;
  }

  /**
   * Display enhanced validation summary with statistics
   */
  private displayValidationSummary(result: ValidationResult): void {
    console.log('\n' + chalk.blue('📊 Enhanced ARM-TTK Validation Summary'));
    console.log(chalk.gray('─'.repeat(60)));

    if (result.success) {
      console.log(chalk.green(`✅ Validation successful!`));
    } else {
      console.log(chalk.red(`❌ Validation failed`));
    }

    console.log(chalk.blue(`📈 Tests passed: ${chalk.green(result.passCount)}`));
    console.log(chalk.blue(`📉 Tests failed: ${chalk.red(result.failCount)}`));

    if (result.warnings.length > 0) {
      console.log(chalk.blue(`⚠️  Warnings: ${chalk.yellow(result.warnings.length)}`));
    }

    if (result.duration) {
      console.log(chalk.blue(`⏱️  Duration: ${chalk.cyan(result.duration.toFixed(0))}ms`));
    }

    if (result.cached) {
      console.log(chalk.blue(`📋 Result: ${chalk.green('Cached')}`));
    }

    console.log(chalk.blue(`📅 Timestamp: ${chalk.gray(result.timestamp)}`));

    // Show worker statistics
    console.log('\n' + chalk.blue('🔧 Worker Pool Statistics'));
    console.log(chalk.gray('─'.repeat(40)));
    console.log(chalk.blue(`Total jobs: ${this.stats.totalJobs}`));
    console.log(chalk.blue(`Completed: ${chalk.green(this.stats.completedJobs)}`));
    console.log(chalk.blue(`Failed: ${chalk.red(this.stats.failedJobs)}`));
    console.log(chalk.blue(`Queue size: ${this.stats.queueSize}`));
    console.log(chalk.blue(`Active workers: ${this.stats.activeWorkers}`));

    if (this.stats.averageDuration > 0) {
      console.log(chalk.blue(`Avg duration: ${chalk.cyan(this.stats.averageDuration.toFixed(0))}ms`));
    }

    // Show first few errors for quick reference
    if (result.errors.length > 0) {
      console.log('\n' + chalk.red('🔍 First 3 errors:'));
      result.errors.slice(0, 3).forEach((error, index) => {
        console.log(chalk.red(`   ${index + 1}. ${error.split('\n')[0]}`));
      });

      if (result.errors.length > 3) {
        console.log(chalk.gray(`   ... and ${result.errors.length - 3} more errors`));
      }
    }

    console.log(chalk.gray('─'.repeat(60)) + '\n');
  }

  /**
   * Get current worker pool statistics
   */
  getStats(): WorkerStats {
    return {
      ...this.stats,
      queueSize: this.queue.size,
      activeWorkers: this.queue.pending
    };
  }

  /**
   * Clear cache (both memory and disk)
   */
  async clearCache(): Promise<void> {
    this.cache.clear();

    try {
      const cacheFiles = await fs.readdir(this.cacheDir);
      for (const file of cacheFiles) {
        if (file.endsWith('.json')) {
          await fs.remove(path.join(this.cacheDir, file));
        }
      }
      console.log(chalk.green('✅ Cache cleared successfully'));
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Could not clear cache: ${error}`));
    }
  }

  /**
   * Validate multiple templates concurrently
   */
  async validateBatch(
    templatePaths: string[],
    options: {
      skipTests?: string[];
      useCache?: boolean;
      maxConcurrency?: number;
    } = {}
  ): Promise<ValidationResult[]> {
    console.log(chalk.blue(`🚀 Starting batch validation of ${templatePaths.length} templates...`));

    const startTime = performance.now();

    // Update concurrency if specified
    if (options.maxConcurrency && options.maxConcurrency !== this.queue.concurrency) {
      this.queue = new PQueue({
        concurrency: options.maxConcurrency,
        interval: 100,
        intervalCap: 10
      });
    }

    const promises = templatePaths.map(templatePath =>
      this.validateTemplate(templatePath, options.skipTests, options.useCache)
    );

    const results = await Promise.allSettled(promises);
    const duration = performance.now() - startTime;

    const successfulResults: ValidationResult[] = [];
    const failedResults: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successfulResults.push(result.value);
      } else {
        failedResults.push(`${templatePaths[index]}: ${result.reason}`);
      }
    });

    console.log(chalk.blue('\n📊 Batch Validation Summary'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.blue(`Total templates: ${templatePaths.length}`));
    console.log(chalk.blue(`Successful: ${chalk.green(successfulResults.length)}`));
    console.log(chalk.blue(`Failed: ${chalk.red(failedResults.length)}`));
    console.log(chalk.blue(`Total duration: ${chalk.cyan(duration.toFixed(0))}ms`));
    console.log(chalk.blue(`Average per template: ${chalk.cyan((duration / templatePaths.length).toFixed(0))}ms`));

    if (failedResults.length > 0) {
      console.log(chalk.red('\n❌ Failed validations:'));
      failedResults.forEach(failure => console.log(chalk.red(`  ${failure}`)));
    }

    return successfulResults;
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    await this.queue.onIdle();
    this.cache.clear();
    console.log(chalk.blue('🧹 Enhanced validator cleanup completed'));
  }
}