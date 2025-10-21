import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Log levels for structured logging
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

/**
 * Log entry structure
 */
interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: string;
  data?: unknown;
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  level: LogLevel;
  verbose: boolean;
  writeToFile: boolean;
  logFilePath?: string;
}

/**
 * Structured logger for production-ready CLI applications
 */
export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private readonly MAX_BUFFER_SIZE = 100;

  private constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: config.level ?? LogLevel.INFO,
      verbose: config.verbose ?? false,
      writeToFile: config.writeToFile ?? false,
      logFilePath: config.logFilePath ?? path.join(process.cwd(), '.azmp', 'logs', 'azmp.log')
    };
  }

  /**
   * Get or create logger instance (singleton)
   */
  static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    } else if (config) {
      Logger.instance.configure(config);
    }
    return Logger.instance;
  }

  /**
   * Configure logger settings
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Enable verbose mode
   */
  setVerbose(verbose: boolean): void {
    this.config.verbose = verbose;
    this.config.level = verbose ? LogLevel.TRACE : LogLevel.INFO;
  }

  /**
   * Log error message
   */
  error(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.ERROR, message, context, data);
    console.error(chalk.red('❌'), chalk.red(message));
    if (this.config.verbose && data) {
      console.error(chalk.gray(JSON.stringify(data, null, 2)));
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, context, data);
    console.warn(chalk.yellow('⚠️ '), chalk.yellow(message));
    if (this.config.verbose && data) {
      console.warn(chalk.gray(JSON.stringify(data, null, 2)));
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, context, data);
    console.log(chalk.blue('ℹ️ '), message);
    if (this.config.verbose && data) {
      console.log(chalk.gray(JSON.stringify(data, null, 2)));
    }
  }

  /**
   * Log success message
   */
  success(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, context, data);
    console.log(chalk.green('✅'), chalk.green(message));
    if (this.config.verbose && data) {
      console.log(chalk.gray(JSON.stringify(data, null, 2)));
    }
  }

  /**
   * Log debug message (only in verbose mode)
   */
  debug(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, context, data);
    if (this.config.verbose) {
      console.log(chalk.gray('🔍'), chalk.gray(message));
      if (data) {
        console.log(chalk.gray(JSON.stringify(data, null, 2)));
      }
    }
  }

  /**
   * Log trace message (only in verbose mode)
   */
  trace(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.TRACE, message, context, data);
    if (this.config.verbose) {
      console.log(chalk.gray('🔬'), chalk.gray(message));
      if (data) {
        console.log(chalk.gray(JSON.stringify(data, null, 2)));
      }
    }
  }

  /**
   * Log a step in a process
   */
  step(stepNumber: number, totalSteps: number, message: string): void {
    const prefix = `[${stepNumber}/${totalSteps}]`;
    console.log(chalk.cyan(prefix), message);
    this.log(LogLevel.INFO, `${prefix} ${message}`);
  }

  /**
   * Log a section header
   */
  section(title: string): void {
    console.log();
    console.log(chalk.blue.bold(`━━━ ${title} ━━━`));
    this.log(LogLevel.INFO, `Section: ${title}`);
  }

  /**
   * Log a subsection
   */
  subsection(title: string): void {
    console.log();
    console.log(chalk.cyan(`▸ ${title}`));
    this.log(LogLevel.INFO, `Subsection: ${title}`);
  }

  /**
   * Log key-value pair
   */
  keyValue(key: string, value: string, indent: number = 2): void {
    const spaces = ' '.repeat(indent);
    console.log(chalk.gray(`${spaces}${key}:`), value);
    if (this.config.verbose) {
      this.log(LogLevel.DEBUG, `${key}: ${value}`);
    }
  }

  /**
   * Log a list item
   */
  listItem(item: string, indent: number = 2): void {
    const spaces = ' '.repeat(indent);
    console.log(chalk.gray(`${spaces}•`), item);
  }

  /**
   * Start a timer for performance measurement
   */
  startTimer(label: string): () => void {
    const start = Date.now();
    this.debug(`Timer started: ${label}`);
    
    return () => {
      const duration = Date.now() - start;
      this.debug(`Timer finished: ${label}`, undefined, { duration: `${duration}ms` });
      if (this.config.verbose) {
        console.log(chalk.gray(`⏱️  ${label}: ${duration}ms`));
      }
    };
  }

  /**
   * Log raw message without formatting (for special cases)
   */
  raw(message: string): void {
    console.log(message);
  }

  /**
   * Add blank line for spacing
   */
  blank(): void {
    console.log();
  }

  /**
   * Internal log method that writes to buffer and file
   */
  private log(level: LogLevel, message: string, context?: string, data?: unknown): void {
    if (level > this.config.level) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      context,
      data
    };

    // Add to buffer
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.MAX_BUFFER_SIZE) {
      this.logBuffer.shift();
    }

    // Write to file if enabled
    if (this.config.writeToFile && this.config.logFilePath) {
      this.writeToFile(entry);
    }
  }

  /**
   * Write log entry to file
   */
  private async writeToFile(entry: LogEntry): Promise<void> {
    if (!this.config.logFilePath) return;

    try {
      const logDir = path.dirname(this.config.logFilePath);
      await fs.ensureDir(logDir);

      const logLine = JSON.stringify(entry) + '\n';
      await fs.appendFile(this.config.logFilePath, logLine);
    } catch {
      // Silent fail to avoid infinite loops
      console.error(chalk.gray('Failed to write to log file'));
    }
  }

  /**
   * Get recent log entries
   */
  getRecentLogs(count: number = 10): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  /**
   * Clear log buffer
   */
  clearBuffer(): void {
    this.logBuffer = [];
  }

  /**
   * Save current buffer to file
   */
  async flushToFile(): Promise<void> {
    if (!this.config.writeToFile || !this.config.logFilePath) return;

    for (const entry of this.logBuffer) {
      await this.writeToFile(entry);
    }
  }

  /**
   * Get log file path
   */
  getLogFilePath(): string | undefined {
    return this.config.logFilePath;
  }
}

/**
 * Convenience function to get logger instance
 */
export function getLogger(config?: Partial<LoggerConfig>): Logger {
  return Logger.getInstance(config);
}

/**
 * Create a child logger with a specific context
 */
export class ContextLogger {
  constructor(private logger: Logger, private context: string) {}

  error(message: string, data?: unknown): void {
    this.logger.error(message, this.context, data);
  }

  warn(message: string, data?: unknown): void {
    this.logger.warn(message, this.context, data);
  }

  info(message: string, data?: unknown): void {
    this.logger.info(message, this.context, data);
  }

  success(message: string, data?: unknown): void {
    this.logger.success(message, this.context, data);
  }

  debug(message: string, data?: unknown): void {
    this.logger.debug(message, this.context, data);
  }

  trace(message: string, data?: unknown): void {
    this.logger.trace(message, this.context, data);
  }

  step(stepNumber: number, totalSteps: number, message: string): void {
    this.logger.step(stepNumber, totalSteps, message);
  }

  startTimer(label: string): () => void {
    return this.logger.startTimer(`${this.context}: ${label}`);
  }
}
