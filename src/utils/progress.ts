import ora, { Ora } from 'ora';
import chalk from 'chalk';
import { getLogger } from './logger';

const logger = getLogger();

/**
 * Progress indicator utility for long-running operations
 */
export class ProgressIndicator {
  private spinner: Ora | null = null;
  private startTime: number = 0;

  /**
   * Start a progress spinner
   */
  start(text: string, context?: string): void {
    logger.debug(`Starting progress: ${text}`, context || 'progress');
    this.startTime = Date.now();
    this.spinner = ora({
      text: chalk.blue(text),
      color: 'blue',
      spinner: 'dots'
    }).start();
  }

  /**
   * Update spinner text
   */
  update(text: string, context?: string): void {
    if (this.spinner) {
      logger.debug(`Updating progress: ${text}`, context || 'progress');
      this.spinner.text = chalk.blue(text);
    }
  }

  /**
   * Mark as successful and stop
   */
  succeed(text?: string, context?: string): void {
    if (this.spinner) {
      const elapsed = Date.now() - this.startTime;
      const message = text || this.spinner.text;
      logger.debug(`Progress succeeded: ${message} (${elapsed}ms)`, context || 'progress');
      this.spinner.succeed(chalk.green(message));
      this.spinner = null;
    }
  }

  /**
   * Mark as failed and stop
   */
  fail(text?: string, context?: string): void {
    if (this.spinner) {
      const elapsed = Date.now() - this.startTime;
      const message = text || this.spinner.text;
      logger.debug(`Progress failed: ${message} (${elapsed}ms)`, context || 'progress');
      this.spinner.fail(chalk.red(message));
      this.spinner = null;
    }
  }

  /**
   * Mark as warning and stop
   */
  warn(text?: string, context?: string): void {
    if (this.spinner) {
      const elapsed = Date.now() - this.startTime;
      const message = text || this.spinner.text;
      logger.debug(`Progress warning: ${message} (${elapsed}ms)`, context || 'progress');
      this.spinner.warn(chalk.yellow(message));
      this.spinner = null;
    }
  }

  /**
   * Stop without marking status
   */
  stop(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  /**
   * Check if spinner is active
   */
  isActive(): boolean {
    return this.spinner !== null;
  }

  /**
   * Get elapsed time in milliseconds
   */
  getElapsedTime(): number {
    return Date.now() - this.startTime;
  }
}

/**
 * Convenience function to create a new progress indicator
 */
export function createProgress(): ProgressIndicator {
  return new ProgressIndicator();
}

/**
 * Execute async operation with progress indicator
 */
export async function withProgress<T>(
  text: string,
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  const progress = new ProgressIndicator();
  
  try {
    progress.start(text, context);
    const result = await operation();
    progress.succeed(undefined, context);
    return result;
  } catch (error) {
    progress.fail(undefined, context);
    throw error;
  }
}
