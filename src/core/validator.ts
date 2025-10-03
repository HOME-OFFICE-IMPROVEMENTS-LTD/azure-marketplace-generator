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
}

export class ArmTtkValidator {
  private armTtkPath: string;

  constructor() {
    // Path to ARM-TTK in the workspace
    this.armTtkPath = '/home/msalsouri/tools/arm-ttk/arm-ttk/Test-AzTemplate.ps1';
  }

  async validateTemplate(templatePath: string, skipTests?: string[]): Promise<ValidationResult> {
    console.log(chalk.blue('🔍 Starting ARM-TTK validation...'));

    // Verify ARM-TTK exists
    if (!await fs.pathExists(this.armTtkPath)) {
      throw new Error(`ARM-TTK not found at: ${this.armTtkPath}`);
    }

    // Verify template directory exists
    if (!await fs.pathExists(templatePath)) {
      throw new Error(`Template path not found: ${templatePath}`);
    }

    try {
      // Build PowerShell command
      let command = `pwsh -File "${this.armTtkPath}" -TemplatePath "${templatePath}"`;
      
      if (skipTests && skipTests.length > 0) {
        const skipList = skipTests.join(',');
        command += ` -Skip "${skipList}"`;
        console.log(chalk.gray(`  Skipping tests: ${skipList}`));
      }

      console.log(chalk.gray(`  Running: ${command}`));

      // Execute ARM-TTK
      const { stdout, stderr } = await execAsync(command, { 
        timeout: 60000,
        maxBuffer: 1024 * 1024 // 1MB buffer for output
      });

      return this.parseArmTtkOutput(stdout, stderr);

    } catch (error: any) {
      console.error(chalk.red('❌ ARM-TTK execution failed:'), error.message);
      
      return {
        success: false,
        errors: [`ARM-TTK execution failed: ${error.message}`],
        warnings: [],
        details: error.stdout || error.stderr || 'No output available'
      };
    }
  }

  private parseArmTtkOutput(stdout: string, stderr: string): ValidationResult {
    const result: ValidationResult = {
      success: true,
      errors: [],
      warnings: [],
      details: stdout
    };

    // Parse stdout for test results
    const lines = stdout.split('\n');
    let currentTest = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Test name lines
      if (trimmed.includes('Testing:') || trimmed.includes('Test:')) {
        currentTest = trimmed;
        continue;
      }

      // Error patterns
      if (trimmed.includes('[-]') || trimmed.includes('FAIL') || trimmed.includes('ERROR')) {
        result.errors.push(`${currentTest}: ${trimmed}`);
        result.success = false;
      }

      // Warning patterns  
      if (trimmed.includes('[!]') || trimmed.includes('WARN') || trimmed.includes('WARNING')) {
        result.warnings.push(`${currentTest}: ${trimmed}`);
      }

      // Success patterns
      if (trimmed.includes('[+]') || trimmed.includes('PASS')) {
        // Test passed - no action needed
      }
    }

    // Check stderr for critical errors
    if (stderr && stderr.trim()) {
      result.errors.push(`PowerShell Error: ${stderr.trim()}`);
      result.success = false;
    }

    // If no specific errors found but command failed, check for common issues
    if (!result.success && result.errors.length === 0) {
      if (stdout.includes('No tests found') || stdout.includes('No templates found')) {
        result.errors.push('No valid ARM templates found in the specified path');
      } else {
        result.errors.push('ARM-TTK validation failed with unknown error');
      }
    }

    return result;
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