import * as fs from 'fs-extra';
import * as path from 'path';
import { spawn } from 'child_process';
import chalk from 'chalk';
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
}

export interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  file?: string;
  line?: number;
}

export interface PackageMetadata {
  packageId: string;
  version: string;
  generated: string;
  validated?: string;
  armTtkVersion: string;
  templatePath: string;
}

export class ArmTtkValidator {
  private armTtkPath: string;
  private packagesDir: string;

  constructor() {
    // Use configurable paths
    this.armTtkPath = AppConfig.getArmTtkPath();
    this.packagesDir = AppConfig.getPackagesDir();
  }

  /**
   * Sanitize and validate package identifiers to prevent path traversal attacks
   */
  private sanitizePackageId(packageId: string): string {
    // Allow only alphanumeric characters, hyphens, underscores, and dots
    const sanitized = packageId.replace(/[^a-zA-Z0-9\-_.]/g, '');

    // Prevent directory traversal and ensure reasonable length
    if (!sanitized || sanitized.includes('..') || sanitized.startsWith('/') || sanitized.length > 50) {
      throw new Error(`Invalid package ID: ${packageId}. Must be alphanumeric with hyphens/underscores only.`);
    }

    return sanitized;
  }

  /**
   * Sanitize and validate version strings to prevent path traversal attacks
   */
  private sanitizeVersion(version: string): string {
    // Allow semantic versioning format only (e.g., 1.2.3, 1.2.3-beta)
    const versionRegex = /^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9\-_.]+)?$/;

    if (!versionRegex.test(version) || version.includes('..') || version.includes('/')) {
      throw new Error(`Invalid version format: ${version}. Use semantic versioning (e.g., 1.2.3).`);
    }

    return version;
  }

  async validateTemplate(templatePath: string, skipTests?: string[]): Promise<ValidationResult> {
    console.log(chalk.blue('🔍 Starting ARM-TTK validation...'));
    console.log(chalk.gray(`  Template path: ${templatePath}`));

    // Verify ARM-TTK exists
    if (!await fs.pathExists(this.armTtkPath)) {
      throw new Error(`ARM-TTK not found at: ${this.armTtkPath}. Please ensure ARM-TTK is installed.`);
    }

    // Verify template directory exists
    if (!await fs.pathExists(templatePath)) {
      throw new Error(`Template path not found: ${templatePath}`);
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

      console.log(chalk.gray(`  Executing ARM-TTK validation...`));

      // Execute ARM-TTK securely using spawn to prevent command injection
      const { stdout, stderr } = await this.runSecurePowerShell(psArgs);

      const result = this.parseEnhancedArmTtkOutput(stdout, stderr, timestamp);

      // Display summary
      this.displayValidationSummary(result);

      return result;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('❌ ARM-TTK execution failed:'), errorMessage);

      return {
        success: false,
        errors: [`ARM-TTK execution failed: ${errorMessage}`],
        warnings: [],
        details: (error as any)?.stdout || (error as any)?.stderr || 'No output available',
        passCount: 0,
        failCount: 1,
        testResults: [{
          name: 'ARM-TTK Execution',
          status: 'fail',
          message: errorMessage
        }],
        timestamp
      };
    }
  }

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

    // Parse stdout for test results with enhanced pattern matching
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

      // Success patterns - [+] indicates pass
      if (trimmed.includes('[+]')) {
        const testName = trimmed.replace('[+]', '').trim();
        result.testResults.push({
          name: testName || currentTest,
          status: 'pass',
          message: 'Test passed',
          file: currentFile
        });
        result.passCount++;
      }

      // Failure patterns - [-] indicates fail
      if (trimmed.includes('[-]')) {
        const testName = trimmed.replace('[-]', '').trim();
        const errorMatch = trimmed.match(/\((\d+)\s*ms\)/);

        result.testResults.push({
          name: testName || currentTest,
          status: 'fail',
          message: trimmed,
          file: currentFile,
          line: errorMatch ? parseInt(errorMatch[1]) : undefined
        });
        result.errors.push(`${currentFile}: ${trimmed}`);
        result.failCount++;
        result.success = false;
      }

      // Warning patterns - [?] indicates warning
      if (trimmed.includes('[?]')) {
        const testName = trimmed.replace('[?]', '').trim();

        result.testResults.push({
          name: testName || currentTest,
          status: 'warning',
          message: trimmed,
          file: currentFile
        });
        result.warnings.push(`${currentFile}: ${trimmed}`);
      }

      // Additional error details (indented lines after failures)
      if (trimmed && trimmed.startsWith('   ') && result.testResults.length > 0) {
        const lastResult = result.testResults[result.testResults.length - 1];
        if (lastResult.status === 'fail') {
          lastResult.message += '\n' + trimmed;
          // Update corresponding error message
          if (result.errors.length > 0) {
            result.errors[result.errors.length - 1] += '\n' + trimmed;
          }
        }
      }
    }

    // Check stderr for critical PowerShell errors
    if (stderr && stderr.trim()) {
      const stderrLines = stderr.split('\n').filter(line => line.trim());
      for (const errorLine of stderrLines) {
        if (!errorLine.includes('WARNING') && !errorLine.includes('ProgressPreference')) {
          result.errors.push(`PowerShell Error: ${errorLine.trim()}`);
          result.success = false;
          result.failCount++;
        }
      }
    }

    // Parse summary line if present (Pass: X, Fail: Y, Total: Z)
    const summaryMatch = stdout.match(/Pass\s*:\s*(\d+).*?Fail\s*:\s*(\d+).*?Total\s*:\s*(\d+)/i);
    if (summaryMatch) {
      result.passCount = parseInt(summaryMatch[1]);
      result.failCount = parseInt(summaryMatch[2]);
      // Total = passCount + failCount + warnings
    }

    return result;
  }

  private displayValidationSummary(result: ValidationResult): void {
    console.log('\n' + chalk.blue('📊 ARM-TTK Validation Summary'));
    console.log(chalk.gray('─'.repeat(50)));

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

    console.log(chalk.blue(`📅 Validation time: ${chalk.gray(result.timestamp)}`));

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

    console.log(chalk.gray('─'.repeat(50)) + '\n');
  }

  async saveValidationReport(result: ValidationResult, templatePath: string, packageId?: string): Promise<string> {
    try {
      // Ensure packages directory exists
      await fs.ensureDir(this.packagesDir);
      await fs.ensureDir(path.join(this.packagesDir, 'validated'));

      // Generate package ID if not provided and sanitize it
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const rawPackageId = packageId || `validation-${timestamp}`;
      const finalPackageId = this.sanitizePackageId(rawPackageId);

      // Create validation report
      const report = {
        packageId: finalPackageId,
        templatePath,
        validationResult: result,
        armTtkPath: this.armTtkPath,
        generatedAt: new Date().toISOString(),
        cliVersion: '0.1.0'
      };

      // Save report using sanitized package ID to prevent path traversal
      const reportPath = path.join(this.packagesDir, 'validated', `${finalPackageId}-report.json`);
      await fs.writeJSON(reportPath, report, { spaces: 2 });

      console.log(chalk.blue(`📄 Validation report saved: ${reportPath}`));
      return reportPath;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(chalk.yellow(`⚠️  Could not save validation report: ${errorMessage}`));
      return '';
    }
  }

  async promoteToMarketplace(validatedPackagePath: string, version: string): Promise<string> {
    try {
      // Sanitize version to prevent path traversal attacks
      const sanitizedVersion = this.sanitizeVersion(version);

      await fs.ensureDir(path.join(this.packagesDir, 'marketplace'));

      const marketplacePath = path.join(this.packagesDir, 'marketplace', `v${sanitizedVersion}`);

      // Validate that the source path is within expected boundaries
      const resolvedSourcePath = path.resolve(validatedPackagePath);
      const expectedBasePath = path.resolve(this.packagesDir);

      if (!resolvedSourcePath.startsWith(expectedBasePath)) {
        throw new Error(`Invalid source path: ${validatedPackagePath}. Must be within packages directory.`);
      }

      // Copy validated package to marketplace directory with filtering
      await fs.copy(validatedPackagePath, marketplacePath, {
        filter: (src) => {
          const filename = path.basename(src);
          const excludePatterns = [
            /^index\.html$/,     // Demo pages
            /.*\.test\..*/,      // Test files
            /.*\.spec\..*/,      // Spec files
            /^demo\..*/,         // Demo files
            /^\.DS_Store$/,      // macOS files
            /^Thumbs\.db$/,      // Windows files
            /^.*\.tmp$/,         // Temporary files
            /^.*\.log$/,         // Log files
          ];

          return !excludePatterns.some(pattern => pattern.test(filename));
        }
      });

      // Create marketplace metadata
      const metadata: PackageMetadata = {
        packageId: `marketplace-v${sanitizedVersion}`,
        version: sanitizedVersion,
        generated: new Date().toISOString(),
        validated: new Date().toISOString(),
        armTtkVersion: 'latest',
        templatePath: validatedPackagePath
      };

      await fs.writeJSON(path.join(marketplacePath, 'marketplace-metadata.json'), metadata, { spaces: 2 });

      console.log(chalk.green(`🚀 Package promoted to marketplace: ${marketplacePath}`));
      return marketplacePath;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to promote package to marketplace: ${errorMessage}`);
    }
  }

  async getAvailableTests(): Promise<string[]> {
    try {
      const { stdout } = await this.runSecurePowerShell(['-File', this.armTtkPath, '-ListAvailable']);

      // Parse available tests from output
      const tests: string[] = [];
      const lines = stdout.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.includes('Testing:') && !trimmed.includes('Test:')) {
          tests.push(trimmed);
        }
      }

      return tests;
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Could not retrieve available tests'));
      console.debug('Error details:', error);
      return [];
    }
  }

  /**
   * Securely execute PowerShell commands using spawn to prevent command injection
   */
  private async runSecurePowerShell(args: string[]): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const childProcess = spawn('pwsh', args, {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      childProcess.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      childProcess.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      childProcess.on('close', (code: number | null) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`PowerShell process exited with code ${code}: ${stderr}`));
        }
      });

      childProcess.on('error', (error: Error) => {
        reject(new Error(`Failed to spawn PowerShell process: ${error.message}`));
      });

      // Set timeout
      setTimeout(() => {
        childProcess.kill('SIGTERM');
        reject(new Error('PowerShell execution timed out after 2 minutes'));
      }, 120000);
    });
  }
}