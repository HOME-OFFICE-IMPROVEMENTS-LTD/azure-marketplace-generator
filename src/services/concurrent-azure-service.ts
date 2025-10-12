/**
 * Concurrent Azure CLI Service
 * Provides concurrent execution of Azure CLI commands with configurable limits
 */
import { spawn, ChildProcess } from 'child_process';
import { AppConfig } from '../config/app-config';
import * as async from 'async';

export interface AzureCommandOptions {
  timeout?: number;
  retries?: number;
  signal?: AbortSignal;
}

export interface AzureCommandResult {
  stdout: string;
  stderr: string;
  duration: number;
  retryCount: number;
}

interface QueueTask {
  args: string[];
  timeout: number;
  retries: number;
  signal?: AbortSignal;
  resolve: (result: AzureCommandResult) => void;
  reject: (error: Error) => void;
  attempt: number;
}

export class ConcurrentAzureService {
  private static instance: ConcurrentAzureService;
  private queue: async.QueueObject<QueueTask>;
  private runningProcesses: Set<ChildProcess>;
  private config: any;
  private isTestEnvironment: boolean;

  private constructor() {
    this.isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
    this.config = AppConfig.getConfig();

    // Create async queue with concurrency limit
    this.queue = async.queue<QueueTask>(this.executeTask.bind(this), this.config.monitoring.maxConcurrency);
    this.runningProcesses = new Set();
  }

  public static getInstance(): ConcurrentAzureService {
    if (!ConcurrentAzureService.instance) {
      ConcurrentAzureService.instance = new ConcurrentAzureService();
    }
    return ConcurrentAzureService.instance;
  }

  /**
   * Reset the singleton instance (for testing purposes only)
   */
  public static resetInstance(): void {
    ConcurrentAzureService.instance = null as any;
  }

  private getCurrentConfig() {
    // In test environment, always get fresh config to pick up env var changes
    if (this.isTestEnvironment) {
      this.config = AppConfig.getConfig();
      // Update queue concurrency if it changed
      if (this.queue.concurrency !== this.config.monitoring.maxConcurrency) {
        this.queue.concurrency = this.config.monitoring.maxConcurrency;
      }
    }
    return this.config;
  }

  public async executeCommand(
    args: string[],
    options: AzureCommandOptions = {}
  ): Promise<AzureCommandResult> {
    const config = this.getCurrentConfig();
    const {
      timeout = config.azure.timeoutMs,
      retries = config.azure.retryAttempts,
      signal
    } = options;

    return new Promise((resolve, reject) => {
      const task: QueueTask = {
        args,
        timeout,
        retries,
        signal,
        resolve,
        reject,
        attempt: 0
      };

      this.queue.push(task);
    });
  }

  public async executeCommandsBatch(
    commands: Array<{ args: string[]; id: string; options?: AzureCommandOptions }>
  ): Promise<Map<string, AzureCommandResult>> {
    const results = new Map<string, AzureCommandResult>();

    await Promise.all(
      commands.map(async ({ args, id, options = {} }) => {
        try {
          const result = await this.executeCommand(args, options);
          results.set(id, result);
        } catch (error) {
          results.set(id, {
            stdout: '',
            stderr: error instanceof Error ? error.message : 'Unknown error',
            duration: 0,
            retryCount: options.retries || 0
          });
        }
      })
    );

    return results;
  }

  private async executeTask(task: QueueTask): Promise<void> {
    const { args, timeout, retries, signal, resolve, reject } = task;

    try {
      const result = await this.runAzureCommand(args, timeout, signal);
      resolve(result);
    } catch (error) {
      task.attempt++;

      if (task.attempt <= retries) {
        // Retry with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, task.attempt - 1), 10000);
        setTimeout(() => {
          this.executeTask(task);
        }, delay);
      } else {
        reject(new Error(`Azure CLI command failed after ${retries + 1} attempts: ${error}`));
      }
    }
  }

  private async runAzureCommand(
    args: string[],
    timeout: number,
    signal?: AbortSignal
  ): Promise<AzureCommandResult> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(new Error('Operation was cancelled'));
        return;
      }

      const process = spawn('az', args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.runningProcesses.add(process);

      let stdout = '';
      let stderr = '';

      process.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      // Handle timeout
      const timeoutHandle = setTimeout(() => {
        process.kill('SIGTERM');
        this.runningProcesses.delete(process);
        reject(new Error(`Azure CLI command timed out after ${timeout}ms`));
      }, timeout);

      // Handle cancellation
      const abortHandler = () => {
        process.kill('SIGTERM');
        this.runningProcesses.delete(process);
        reject(new Error('Operation was cancelled'));
      };

      signal?.addEventListener('abort', abortHandler);

      process.on('close', (code) => {
        clearTimeout(timeoutHandle);
        signal?.removeEventListener('abort', abortHandler);
        this.runningProcesses.delete(process);

        const duration = Date.now() - startTime;

        if (code === 0) {
          resolve({
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            duration,
            retryCount: 0
          });
        } else {
          reject(new Error(`Azure CLI command failed with exit code ${code}: ${stderr}`));
        }
      });

      process.on('error', (error) => {
        clearTimeout(timeoutHandle);
        signal?.removeEventListener('abort', abortHandler);
        this.runningProcesses.delete(process);
        reject(error);
      });
    });
  }

  public cancelAllOperations(): void {
    this.runningProcesses.forEach(process => {
      if (!process.killed) {
        process.kill('SIGTERM');
      }
    });
    this.runningProcesses.clear();
    this.queue.kill();
  }

  public getStats() {
    const config = this.getCurrentConfig();
    return {
      runningProcesses: this.runningProcesses.size,
      queuedOperations: this.queue.length(),
      maxConcurrency: config.monitoring.maxConcurrency
    };
  }
}

/**
 * Azure Operations Helper Class
 * Provides high-level Azure operations using concurrent service
 */
export class AzureOperations {
  private azureService: ConcurrentAzureService;

  constructor() {
    this.azureService = ConcurrentAzureService.getInstance();
  }

  public async listResources(resourceGroup?: string): Promise<any[]> {
    const args = ['resource', 'list', '--output', 'json'];
    if (resourceGroup) {
      args.push('--resource-group', resourceGroup);
    }

    const result = await this.azureService.executeCommand(args);
    return JSON.parse(result.stdout || '[]');
  }

  public async listResourceGroups(): Promise<any[]> {
    const result = await this.azureService.executeCommand(['group', 'list', '--output', 'json']);
    return JSON.parse(result.stdout || '[]');
  }

  public async getSubscriptionInfo(): Promise<any> {
    const result = await this.azureService.executeCommand(['account', 'show', '--output', 'json']);
    return JSON.parse(result.stdout || '{}');
  }

  public async getResourceHealthBatch(
    resources: Array<{ id: string; type: string }>
  ): Promise<Map<string, any>> {
    const commands = resources.map(resource => ({
      args: ['resource', 'show', '--ids', resource.id, '--output', 'json'],
      id: resource.id
    }));

    const results = await this.azureService.executeCommandsBatch(commands);
    const healthMap = new Map();

    for (const [resourceId, result] of Array.from(results.entries())) {
      try {
        const resourceData = JSON.parse(result.stdout || '{}');
        healthMap.set(resourceId, {
          status: resourceData.properties?.provisioningState === 'Succeeded' ? 'healthy' : 'unhealthy',
          provisioningState: resourceData.properties?.provisioningState,
          location: resourceData.location,
          lastUpdated: new Date().toISOString()
        });
      } catch (error) {
        healthMap.set(resourceId, {
          status: 'unknown',
          error: error instanceof Error ? error.message : 'Parse error'
        });
      }
    }

    return healthMap;
  }

  public async getMetricsBatch(
    resources: Array<{ id: string; metrics: string[] }>,
    timespan = 'PT1H'
  ): Promise<Map<string, any>> {
    const commands: Array<{ args: string[]; id: string }> = [];

    // Create commands for each metric of each resource
    resources.forEach(resource => {
      resource.metrics.forEach(metric => {
        commands.push({
          args: [
            'monitor', 'metrics', 'list',
            '--resource', resource.id,
            '--metric', metric,
            '--timespan', timespan,
            '--output', 'json'
          ],
          id: `${resource.id}:${metric}`
        });
      });
    });

    const results = await this.azureService.executeCommandsBatch(commands);
    const metricsMap = new Map();

    for (const [key, result] of Array.from(results.entries())) {
      try {
        const metricData = JSON.parse(result.stdout || '{}');
        metricsMap.set(key, metricData);
      } catch (error) {
        metricsMap.set(key, {
          error: error instanceof Error ? error.message : 'Parse error'
        });
      }
    }

    return metricsMap;
  }

  public getStats() {
    return this.azureService.getStats();
  }

  public cancelOperations(): void {
    this.azureService.cancelAllOperations();
  }
}