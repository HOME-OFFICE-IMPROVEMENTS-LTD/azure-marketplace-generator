import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

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
    // Path to ARM-TTK in the workspace
    this.armTtkPath = '/home/msalsouri/tools/arm-ttk/arm-ttk/Test-AzTemplate.ps1';
    this.packagesDir = path.join(process.cwd(), 'packages');
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
      // Build enhanced PowerShell command with better output formatting
      let command = `pwsh -Command "Import-Module '${path.dirname(this.armTtkPath)}'; Test-AzTemplate -TemplatePath '${templatePath}'"`;
      
      if (skipTests && skipTests.length > 0) {
        const skipList = skipTests.join("','");
        command += ` -Skip @('${skipList}')`;
        console.log(chalk.gray(`  Skipping tests: ${skipTests.join(', ')}`));
      }

      console.log(chalk.gray(`  Executing ARM-TTK validation...`));

      // Execute ARM-TTK with enhanced error handling
      const { stdout, stderr } = await execAsync(command, { 
        timeout: 120000, // 2 minutes timeout
        maxBuffer: 2 * 1024 * 1024, // 2MB buffer for large outputs
        cwd: process.cwd()
      });

      const result = this.parseEnhancedArmTtkOutput(stdout, stderr, timestamp);
      
      // Display summary
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

      // Generate package ID if not provided
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const finalPackageId = packageId || `validation-${timestamp}`;
      
      // Create validation report
      const report = {
        packageId: finalPackageId,
        templatePath,
        validationResult: result,
        armTtkPath: this.armTtkPath,
        generatedAt: new Date().toISOString(),
        cliVersion: '0.1.0'
      };

      // Save report
      const reportPath = path.join(this.packagesDir, 'validated', `${finalPackageId}-report.json`);
      await fs.writeJSON(reportPath, report, { spaces: 2 });
      
      console.log(chalk.blue(`📄 Validation report saved: ${reportPath}`));
      return reportPath;
      
    } catch (error: any) {
      console.warn(chalk.yellow(`⚠️  Could not save validation report: ${error.message}`));
      return '';
    }
  }

  async promoteToMarketplace(validatedPackagePath: string, version: string): Promise<string> {
    try {
      await fs.ensureDir(path.join(this.packagesDir, 'marketplace'));
      
      const marketplacePath = path.join(this.packagesDir, 'marketplace', `v${version}`);
      
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
        packageId: `marketplace-v${version}`,
        version,
        generated: new Date().toISOString(),
        validated: new Date().toISOString(),
        armTtkVersion: 'latest',
        templatePath: validatedPackagePath
      };
      
      await fs.writeJSON(path.join(marketplacePath, 'marketplace-metadata.json'), metadata, { spaces: 2 });
      
      console.log(chalk.green(`🚀 Package promoted to marketplace: ${marketplacePath}`));
      return marketplacePath;
      
    } catch (error: any) {
      throw new Error(`Failed to promote package to marketplace: ${error.message}`);
    }
  }

  async getAvailableTests(): Promise<string[]> {
    try {
      const command = `pwsh -File "${this.armTtkPath}" -ListAvailable`;
      const { stdout } = await execAsync(command);
      
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
      return [];
    }
  }
}