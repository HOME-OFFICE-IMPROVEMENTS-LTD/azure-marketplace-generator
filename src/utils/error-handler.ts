import chalk from 'chalk';

/**
 * Custom error types for better error classification
 */
export class CliError extends Error {
  constructor(message: string, public readonly code: string = 'CLI_ERROR') {
    super(message);
    this.name = 'CliError';
    Object.setPrototypeOf(this, CliError.prototype);
    // code is stored for programmatic error handling
    void this.code;
  }
}

export class ValidationError extends Error {
  constructor(message: string, public readonly details?: string[]) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
    // details is stored for additional context
    void this.details;
  }
}

export class FileSystemError extends Error {
  constructor(message: string, public readonly path?: string) {
    super(message);
    this.name = 'FileSystemError';
    Object.setPrototypeOf(this, FileSystemError.prototype);
    // path is stored for debugging
    void this.path;
  }
}

export class TemplateGenerationError extends Error {
  constructor(message: string, public readonly templateName?: string) {
    super(message);
    this.name = 'TemplateGenerationError';
    Object.setPrototypeOf(this, TemplateGenerationError.prototype);
    // templateName is stored for context
    void this.templateName;
  }
}

export class ArmTtkError extends Error {
  constructor(message: string, public readonly validationErrors?: string[]) {
    super(message);
    this.name = 'ArmTtkError';
    Object.setPrototypeOf(this, ArmTtkError.prototype);
    // validationErrors is stored for detailed reporting
    void this.validationErrors;
  }
}

/**
 * Centralized error handler for CLI commands
 */
export class ErrorHandler {
  /**
   * Handle errors gracefully with contextual information
   */
  static handle(error: unknown, context: string): never {
    console.log(); // Add spacing

    if (error instanceof ValidationError) {
      console.error(chalk.red('❌ Validation Error:'), error.message);
      if (error.details && error.details.length > 0) {
        console.log(chalk.red('\n📋 Validation Details:'));
        error.details.forEach((detail, index) => {
          console.log(chalk.red(`   ${index + 1}. ${detail}`));
        });
      }
    } else if (error instanceof FileSystemError) {
      console.error(chalk.red('❌ File System Error:'), error.message);
      if (error.path) {
        console.log(chalk.gray('   Path:'), error.path);
      }
      console.log(chalk.blue('\n💡 Troubleshooting:'));
      console.log(chalk.blue('   • Check if the path exists'));
      console.log(chalk.blue('   • Verify file permissions'));
      console.log(chalk.blue('   • Ensure the directory is accessible'));
    } else if (error instanceof TemplateGenerationError) {
      console.error(chalk.red('❌ Template Generation Error:'), error.message);
      if (error.templateName) {
        console.log(chalk.gray('   Template:'), error.templateName);
      }
      console.log(chalk.blue('\n💡 Troubleshooting:'));
      console.log(chalk.blue('   • Verify template syntax is correct'));
      console.log(chalk.blue('   • Check Handlebars template files'));
      console.log(chalk.blue('   • Ensure all required data is provided'));
    } else if (error instanceof ArmTtkError) {
      console.error(chalk.red('❌ ARM-TTK Validation Error:'), error.message);
      if (error.validationErrors && error.validationErrors.length > 0) {
        console.log(chalk.red('\n🔍 ARM-TTK Errors:'));
        error.validationErrors.slice(0, 10).forEach((err, index) => {
          console.log(chalk.red(`   ${index + 1}. ${err.split('\n')[0]}`));
        });
        if (error.validationErrors.length > 10) {
          console.log(chalk.gray(`   ... and ${error.validationErrors.length - 10} more errors`));
        }
      }
      console.log(chalk.blue('\n💡 Troubleshooting:'));
      console.log(chalk.blue('   • Ensure ARM-TTK is installed: npm run install-arm-ttk'));
      console.log(chalk.blue('   • Verify PowerShell is available'));
      console.log(chalk.blue('   • Check template syntax and structure'));
    } else if (error instanceof CliError) {
      console.error(chalk.red('❌ CLI Error:'), error.message);
      console.log(chalk.gray('   Error Code:'), error.code);
    } else if (error instanceof Error) {
      console.error(chalk.red(`❌ Error in ${context}:`), error.message);
      if (error.stack) {
        console.log(chalk.gray('\n📋 Stack Trace:'));
        console.log(chalk.gray(error.stack));
      }
    } else {
      console.error(chalk.red(`❌ Unknown error in ${context}:`), String(error));
    }

    console.log(chalk.blue('\n💡 General Troubleshooting:'));
    console.log(chalk.blue('   • Run with --help for usage information'));
    console.log(chalk.blue('   • Check the documentation for examples'));
    console.log(chalk.blue('   • Verify all prerequisites are installed'));
    console.log(chalk.blue('   • Report issues at: https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator'));

    process.exit(1);
  }

  /**
   * Handle async errors with proper cleanup
   */
  static async handleAsync<T>(
    operation: () => Promise<T>,
    context: string,
    cleanup?: () => Promise<void>
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (cleanup) {
        try {
          await cleanup();
        } catch (cleanupError) {
          console.warn(chalk.yellow('⚠️  Cleanup failed:'), cleanupError);
        }
      }
      this.handle(error, context);
    }
  }

  /**
   * Validate required parameters
   */
  static validateRequired(params: Record<string, unknown>, required: string[]): void {
    const missing = required.filter(param => !params[param]);
    if (missing.length > 0) {
      throw new ValidationError(
        'Missing required parameters',
        missing.map(param => `${param} is required`)
      );
    }
  }

  /**
   * Safe JSON parsing with error handling
   */
  static parseJson<T>(json: string, context: string): T {
    try {
      return JSON.parse(json);
    } catch (error) {
      throw new ValidationError(
        `Failed to parse JSON in ${context}`,
        [(error as Error).message]
      );
    }
  }

  /**
   * Safe file operation wrapper
   */
  static async safeFileOperation<T>(
    operation: () => Promise<T>,
    filePath: string,
    operationType: 'read' | 'write' | 'delete' | 'create'
  ): Promise<T> {
    try {
      return await operation();
    } catch {
      const message = `Failed to ${operationType} file`;
      throw new FileSystemError(message, filePath);
    }
  }
}

/**
 * Wrapper for graceful process exit
 */
export function gracefulExit(code: number = 0): never {
  if (code === 0) {
    console.log(); // Add spacing before exit
  }
  process.exit(code);
}

/**
 * Handle uncaught exceptions and rejections
 */
export function setupGlobalErrorHandlers(): void {
  process.on('uncaughtException', (error: Error) => {
    console.error(chalk.red('\n❌ Uncaught Exception:'), error.message);
    console.error(chalk.gray(error.stack));
    gracefulExit(1);
  });

  process.on('unhandledRejection', (reason: unknown) => {
    console.error(chalk.red('\n❌ Unhandled Promise Rejection:'), reason);
    gracefulExit(1);
  });

  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\n⚠️  Operation cancelled by user'));
    gracefulExit(130); // Standard exit code for SIGINT
  });

  process.on('SIGTERM', () => {
    console.log(chalk.yellow('\n\n⚠️  Process terminated'));
    gracefulExit(143); // Standard exit code for SIGTERM
  });
}
