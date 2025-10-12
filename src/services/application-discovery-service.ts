import * as chalk from 'chalk';
import { AzureOperations, ConcurrentAzureService } from './concurrent-azure-service';

export interface ApplicationMonitoring {
  name: string;
  resourceGroup: string;
  type: 'managed-app' | 'function-app' | 'web-app';
  endpoints: string[];
  healthChecks: HealthCheck[];
  customMetrics?: CustomMetric[];
  performanceMetrics: PerformanceMetrics;
}

export interface HealthCheck {
  name: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  expectedStatus: number;
  timeout: number;
  interval: number;
  headers?: Record<string, string>;
  body?: string;
}

export interface CustomMetric {
  name: string;
  query: string;
  unit: string;
  type: 'gauge' | 'counter' | 'histogram';
  threshold: MetricThreshold;
}

export interface PerformanceMetrics {
  responseTime: MetricThreshold;
  errorRate: MetricThreshold;
  throughput: MetricThreshold;
  availability: MetricThreshold;
}

export interface MetricThreshold {
  warning: number;
  critical: number;
  unit: string;
}

export interface DiscoveryConfig {
  subscriptionId?: string;
  resourceGroups?: string[];
  applicationTypes: ('managed-app' | 'function-app' | 'web-app')[];
  includeHealthChecks: boolean;
  autoConfigureMetrics: boolean;
}

/**
 * Application Discovery Service
 *
 * Responsible for discovering Azure applications across different types:
 * - Managed Applications
 * - Function Apps
 * - Web Apps
 *
 * Provides auto-configuration of health checks and performance metrics.
 * Uses concurrent Azure operations for improved performance.
 */
export class ApplicationDiscoveryService {
  private config: DiscoveryConfig;
  private azureService: ConcurrentAzureService;

  constructor(config: DiscoveryConfig) {
    this.config = config;
    this.azureService = ConcurrentAzureService.getInstance();
  }

  /**
   * Discover all applications based on configuration
   */
  async discoverAllApplications(): Promise<ApplicationMonitoring[]> {
    console.log(chalk.blue('🔍 Discovering Azure applications...'));

    const discoveryTasks: Promise<ApplicationMonitoring[]>[] = [];

    if (this.config.applicationTypes.includes('managed-app')) {
      discoveryTasks.push(this.discoverManagedApplications());
    }

    if (this.config.applicationTypes.includes('function-app')) {
      discoveryTasks.push(this.discoverFunctionApps());
    }

    if (this.config.applicationTypes.includes('web-app')) {
      discoveryTasks.push(this.discoverWebApps());
    }

    // Run all discovery tasks concurrently
    const results = await Promise.all(discoveryTasks);
    const applications = results.flat();

    // Log results
    const typeCounts = {
      'managed-app': applications.filter(app => app.type === 'managed-app').length,
      'function-app': applications.filter(app => app.type === 'function-app').length,
      'web-app': applications.filter(app => app.type === 'web-app').length
    };

    if (typeCounts['managed-app'] > 0) {
      console.log(chalk.green(`   ✅ Found ${typeCounts['managed-app']} managed applications`));
    }
    if (typeCounts['function-app'] > 0) {
      console.log(chalk.green(`   ✅ Found ${typeCounts['function-app']} function apps`));
    }
    if (typeCounts['web-app'] > 0) {
      console.log(chalk.green(`   ✅ Found ${typeCounts['web-app']} web apps`));
    }

    console.log(chalk.blue(`🎯 Total applications discovered: ${applications.length}`));
    return applications;
  }

  /**
   * Discover managed applications in subscription using concurrent operations
   */
  async discoverManagedApplications(): Promise<ApplicationMonitoring[]> {
    try {
      const result = await this.azureService.executeCommand([
        'managedapp',
        'list',
        '--output',
        'json'
      ]);

      const managedApps = JSON.parse(result.stdout || '[]');
      return managedApps.map((app: any) => ({
        name: app.name,
        resourceGroup: app.resourceGroup,
        type: 'managed-app' as const,
        endpoints: [],
        healthChecks: this.config.includeHealthChecks ? [
          {
            name: 'Application Health',
            endpoint: '', // Will be determined later
            method: 'GET' as const,
            expectedStatus: 200,
            timeout: 30000,
            interval: 300000 // 5 minutes
          }
        ] : [],
        performanceMetrics: this.getDefaultPerformanceMetrics()
      }));
    } catch (error) {
      console.warn('Failed to discover managed applications:', error);
      return [];
    }
  }

  /**
   * Discover function apps in subscription using concurrent operations
   */
  async discoverFunctionApps(): Promise<ApplicationMonitoring[]> {
    try {
      const result = await this.azureService.executeCommand([
        'functionapp',
        'list',
        '--output',
        'json'
      ]);

      const functionApps = JSON.parse(result.stdout || '[]');
      return functionApps.map((app: any) => ({
        name: app.name,
        resourceGroup: app.resourceGroup,
        type: 'function-app' as const,
        endpoints: [`https://${app.defaultHostName}`],
        healthChecks: this.config.includeHealthChecks ? [
          {
            name: 'Function App Health',
            endpoint: `https://${app.defaultHostName}/api/health`,
            method: 'GET' as const,
            expectedStatus: 200,
            timeout: 30000,
            interval: 300000
          }
        ] : [],
        performanceMetrics: this.getDefaultPerformanceMetrics()
      }));
    } catch (error) {
      console.warn('Failed to discover function apps:', error);
      return [];
    }
  }

  /**
   * Discover web apps in subscription using concurrent operations
   */
  async discoverWebApps(): Promise<ApplicationMonitoring[]> {
    try {
      const result = await this.azureService.executeCommand([
        'webapp',
        'list',
        '--output',
        'json'
      ]);

      const webApps = JSON.parse(result.stdout || '[]');
      return webApps.map((app: any) => ({
        name: app.name,
        resourceGroup: app.resourceGroup,
        type: 'web-app' as const,
        endpoints: [`https://${app.defaultHostName}`],
        healthChecks: this.config.includeHealthChecks ? [
          {
            name: 'Web App Health',
            endpoint: `https://${app.defaultHostName}/health`,
            method: 'GET' as const,
            expectedStatus: 200,
            timeout: 30000,
            interval: 300000
          }
        ] : [],
        performanceMetrics: this.getDefaultPerformanceMetrics()
      }));
    } catch (error) {
      console.warn('Failed to discover web apps:', error);
      return [];
    }
  }

  /**
   * Discover applications by resource groups using batch operations
   */
  async discoverApplicationsByResourceGroups(resourceGroups: string[]): Promise<ApplicationMonitoring[]> {
    const commands = resourceGroups.flatMap(rg => [
      {
        args: ['functionapp', 'list', '--resource-group', rg, '--output', 'json'],
        id: `functionapp-${rg}`
      },
      {
        args: ['webapp', 'list', '--resource-group', rg, '--output', 'json'],
        id: `webapp-${rg}`
      }
    ]);

    const results = await this.azureService.executeCommandsBatch(commands);
    const applications: ApplicationMonitoring[] = [];

    results.forEach((result: any, commandId: string) => {
      try {
        const apps = JSON.parse(result.stdout || '[]');
        const [appType, resourceGroup] = commandId.split('-');

        for (const app of apps) {
          applications.push({
            name: app.name,
            resourceGroup: app.resourceGroup || resourceGroup,
            type: appType === 'functionapp' ? 'function-app' : 'web-app',
            endpoints: [`https://${app.defaultHostName}`],
            healthChecks: this.config.includeHealthChecks ? [
              {
                name: `${appType === 'functionapp' ? 'Function' : 'Web'} App Health`,
                endpoint: `https://${app.defaultHostName}${appType === 'functionapp' ? '/api' : ''}/health`,
                method: 'GET' as const,
                expectedStatus: 200,
                timeout: 30000,
                interval: 300000
              }
            ] : [],
            performanceMetrics: this.getDefaultPerformanceMetrics()
          });
        }
      } catch (error) {
        console.warn(`Failed to parse discovery results for ${commandId}:`, error);
      }
    });

    return applications;
  }

  /**
   * Get detailed application information with health and metrics
   */
  async getApplicationDetails(applications: ApplicationMonitoring[]): Promise<ApplicationMonitoring[]> {
    if (applications.length === 0) {
      return applications;
    }

    // Use batch operations to get detailed information
    const commands = applications.map(app => ({
      args: ['resource', 'show', '--resource-group', app.resourceGroup, '--name', app.name, '--output', 'json'],
      id: `${app.type}-${app.name}`
    }));

    const results = await this.azureService.executeCommandsBatch(commands);

    // Enhance applications with detailed information
    return applications.map(app => {
      const detailKey = `${app.type}-${app.name}`;
      const detail = results.get(detailKey);

      if (detail && !detail.stderr) {
        try {
          const resourceDetail = JSON.parse(detail.stdout || '{}');
          // Add any additional details from resource information
          app.customMetrics = this.config.autoConfigureMetrics ?
            this.generateCustomMetrics(app.type) : undefined;
        } catch (error) {
          console.warn(`Failed to parse resource details for ${app.name}:`, error);
        }
      }

      return app;
    });
  }

  /**
   * Generate custom metrics based on application type
   */
  private generateCustomMetrics(appType: string): CustomMetric[] {
    const baseMetrics: CustomMetric[] = [
      {
        name: 'CPU Usage',
        query: 'Percentage CPU',
        unit: '%',
        type: 'gauge',
        threshold: { warning: 70, critical: 90, unit: '%' }
      },
      {
        name: 'Memory Usage',
        query: 'Memory Percentage',
        unit: '%',
        type: 'gauge',
        threshold: { warning: 80, critical: 95, unit: '%' }
      }
    ];

    if (appType === 'function-app') {
      baseMetrics.push({
        name: 'Function Executions',
        query: 'FunctionExecutionCount',
        unit: 'count',
        type: 'counter',
        threshold: { warning: 1000, critical: 5000, unit: 'count/min' }
      });
    }

    if (appType === 'web-app') {
      baseMetrics.push({
        name: 'HTTP Requests',
        query: 'Requests',
        unit: 'count',
        type: 'counter',
        threshold: { warning: 100, critical: 500, unit: 'req/min' }
      });
    }

    return baseMetrics;
  }

  /**
   * Get default performance metrics configuration
   */
  private getDefaultPerformanceMetrics(): PerformanceMetrics {
    return {
      responseTime: { warning: 1000, critical: 5000, unit: 'ms' },
      errorRate: { warning: 5, critical: 10, unit: '%' },
      throughput: { warning: 10, critical: 5, unit: 'req/sec' },
      availability: { warning: 99, critical: 95, unit: '%' }
    };
  }

  /**
   * Update discovery configuration
   */
  updateConfig(config: Partial<DiscoveryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current discovery configuration
   */
  getConfig(): DiscoveryConfig {
    return { ...this.config };
  }

  /**
   * Get operation statistics
   */
  getStats() {
    return this.azureService.getStats();
  }

  /**
   * Cancel all running discovery operations
   */
  cancelDiscovery(): void {
    this.azureService.cancelAllOperations();
  }
}