import axios from 'axios';
import { spawn } from 'child_process';
import chalk from 'chalk';
import { AzureOperations } from './concurrent-azure-service';
import { AppConfig } from '../config/app-config';

// Secure Azure CLI execution helper
async function runAzureCommand(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const process = spawn('az', args, { stdio: ['pipe', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Azure CLI failed with exit code ${code}`));
      } else {
        resolve(stdout.trim());
      }
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
}

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

export interface ApplicationStatus {
  application: ApplicationMonitoring;
  status: 'healthy' | 'warning' | 'critical';
  lastChecked: Date;
  healthChecks: HealthCheckResult[];
  metrics: MetricResult[];
  uptime: number;
  alerts: AlertStatus[];
}

export interface HealthCheckResult {
  check: HealthCheck;
  status: 'success' | 'failure';
  responseTime: number;
  statusCode?: number;
  error?: string;
  timestamp: Date;
}

export interface MetricResult {
  name: string;
  value: number;
  unit: string;
  threshold: MetricThreshold;
  status: 'normal' | 'warning' | 'critical';
  timestamp: Date;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface AlertStatus {
  id: string;
  application: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  source: 'health-check' | 'metric' | 'system';
}

export interface MonitoringConfig {
  pollingInterval: number;
  retryAttempts: number;
  enableMetrics: boolean;
  enableHealthChecks: boolean;
  alertingEnabled: boolean;
  timeoutMs: number;
}

/**
 * Application Monitoring Service
 *
 * Responsible for active monitoring of discovered applications:
 * - Health check execution
 * - Metrics collection from Azure and custom sources
 * - Uptime calculations
 * - Alert generation
 *
 * Provides real-time status monitoring with configurable polling.
 */
export class ApplicationMonitoringService {
  private cache: Map<string, { data: any; timestamp: Date }>;
  private cacheTimeoutMs: number;
  private azureOps: AzureOperations;
  private monitoringCache: Map<string, ApplicationStatus>;
  private config: MonitoringConfig;

  constructor() {
    this.cache = new Map();
    this.cacheTimeoutMs = AppConfig.getConfig().monitoring.healthCheckTimeoutMs;
    this.azureOps = new AzureOperations();
    this.monitoringCache = new Map();
    this.config = {
      enableHealthChecks: true,
      enableMetrics: true,
      alertingEnabled: true,
      pollingInterval: 30000,
      retryAttempts: 3,
      timeoutMs: AppConfig.getConfig().monitoring.healthCheckTimeoutMs
    };
  }

  /**
   * Monitor all applications and return their status
   */
  async monitorApplications(applications: ApplicationMonitoring[]): Promise<ApplicationStatus[]> {
    console.log(chalk.blue(`🔍 Monitoring ${applications.length} applications...`));

    const statuses: ApplicationStatus[] = [];

    for (const app of applications) {
      try {
        const status = await this.monitorSingleApplication(app);
        statuses.push(status);
        this.monitoringCache.set(app.name, status);

        const statusIcon = status.status === 'healthy' ? '✅' :
                          status.status === 'warning' ? '⚠️' : '❌';
        console.log(chalk.gray(`   ${statusIcon} ${app.name}: ${status.status}`));
      } catch (error) {
        console.warn(`Failed to monitor ${app.name}:`, error);
      }
    }

    return statuses;
  }

  /**
   * Monitor a single application
   */
  async monitorSingleApplication(app: ApplicationMonitoring): Promise<ApplicationStatus> {
    const startTime = Date.now();

    // Run health checks
    const healthChecks: HealthCheckResult[] = [];
    if (this.config.enableHealthChecks) {
      for (const check of app.healthChecks) {
        const result = await this.executeHealthCheck(check);
        healthChecks.push(result);
      }
    }

    // Collect metrics
    const metrics: MetricResult[] = [];
    if (this.config.enableMetrics) {
      const azureMetrics = await this.collectAzureMetrics(app);
      metrics.push(...azureMetrics);

      if (app.customMetrics) {
        const customMetrics = await this.collectCustomMetrics(app.customMetrics);
        metrics.push(...customMetrics);
      }
    }

    // Calculate uptime
    const uptime = await this.calculateUptime(app.name);

    // Generate alerts
    const alerts: AlertStatus[] = [];
    if (this.config.alertingEnabled) {
      const healthAlerts = this.generateHealthCheckAlerts(app, healthChecks);
      const metricAlerts = this.generateMetricAlerts(app, metrics);
      alerts.push(...healthAlerts, ...metricAlerts);
    }

    // Determine overall status
    const status = this.calculateOverallStatus(healthChecks, metrics);

    const monitoringTime = Date.now() - startTime;
    console.log(chalk.gray(`     Monitoring completed in ${monitoringTime}ms`));

    return {
      application: app,
      status,
      lastChecked: new Date(),
      healthChecks,
      metrics,
      uptime,
      alerts
    };
  }

  /**
   * Execute a health check
   */
  async executeHealthCheck(check: HealthCheck): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const response = await axios({
        method: check.method,
        url: check.endpoint,
        timeout: check.timeout,
        headers: check.headers,
        data: check.body,
        validateStatus: () => true // Don't throw for any status codes
      });

      const responseTime = Date.now() - startTime;
      const success = response.status === check.expectedStatus;

      return {
        check,
        status: success ? 'success' : 'failure',
        responseTime,
        statusCode: response.status,
        timestamp: new Date(),
        error: success ? undefined : `Expected ${check.expectedStatus}, got ${response.status}`
      };
    } catch (error) {
      return {
        check,
        status: 'failure',
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
        error: (error as Error).message
      };
    }
  }

  /**
   * Collect Azure metrics for an application using concurrent service
   */
  async collectAzureMetrics(app: ApplicationMonitoring): Promise<MetricResult[]> {
    const metrics: MetricResult[] = [];

    try {
      // Get resource ID for the application
      const resourceId = await this.getResourceId(app);

      // Define metrics to collect based on application type
      const metricQueries = this.getMetricQueries(app.type);

      // Use concurrent Azure service for parallel metric collection
      const resourceMetrics = {
        id: resourceId,
        metrics: metricQueries.map(q => q.name)
      };

      const metricsData = await this.azureOps.getMetricsBatch([resourceMetrics], 'PT1H');

      for (const query of metricQueries) {
        const metricKey = `${resourceId}:${query.name}`;
        const metricResult = metricsData.get(metricKey);

        if (metricResult && !('error' in metricResult)) {
          const latestValue = metricResult.value?.[0]?.timeseries?.[0]?.data?.slice(-1)?.[0]?.average || 0;

          metrics.push({
            name: query.name,
            value: latestValue,
            unit: query.unit,
            threshold: query.threshold,
            status: this.evaluateMetricStatus(latestValue, query.threshold),
            timestamp: new Date(),
            trend: 'stable' // Would need historical data for trend analysis
          });
        } else {
          console.warn(`Failed to collect metric ${query.name} for ${app.name}:`,
            metricResult && 'error' in metricResult ? metricResult.error : 'Unknown error');
        }
      }
    } catch (error) {
      console.warn(`Failed to collect Azure metrics for ${app.name}:`, error);
    }

    return metrics;
  }

  /**
   * Collect custom metrics
   */
  async collectCustomMetrics(customMetrics: CustomMetric[]): Promise<MetricResult[]> {
    const metrics: MetricResult[] = [];

    for (const customMetric of customMetrics) {
      try {
        // This would be implemented based on the specific metric collection system
        // For now, returning mock data
        const value = Math.random() * 100;

        metrics.push({
          name: customMetric.name,
          value,
          unit: customMetric.unit,
          threshold: customMetric.threshold,
          status: this.evaluateMetricStatus(value, customMetric.threshold),
          timestamp: new Date(),
          trend: 'stable'
        });
      } catch (error) {
        console.warn(`Failed to collect custom metric ${customMetric.name}:`, error);
      }
    }

    return metrics;
  }

  /**
   * Calculate application uptime
   */
  async calculateUptime(appName: string): Promise<number> {
    // This would integrate with your uptime tracking system
    // For now, returning a mock value
    return 99.5 + Math.random() * 0.5;
  }

  /**
   * Get resource ID for an application
   */
  private async getResourceId(app: ApplicationMonitoring): Promise<string> {
    const resourceType = app.type === 'managed-app' ? 'Microsoft.Solutions/applications' :
                        app.type === 'function-app' ? 'Microsoft.Web/sites' : 'Microsoft.Web/sites';

    return `/subscriptions/{subscription-id}/resourceGroups/${app.resourceGroup}/providers/${resourceType}/${app.name}`;
  }

  /**
   * Get metric queries based on application type
   */
  private getMetricQueries(appType: string): Array<{name: string, unit: string, threshold: MetricThreshold}> {
    const baseMetrics = [
      { name: 'CpuPercentage', unit: '%', threshold: { warning: 70, critical: 90, unit: '%' } },
      { name: 'MemoryPercentage', unit: '%', threshold: { warning: 80, critical: 95, unit: '%' } }
    ];

    if (appType === 'function-app') {
      baseMetrics.push(
        { name: 'FunctionExecutionCount', unit: 'count', threshold: { warning: 1000, critical: 5000, unit: 'count' } },
        { name: 'FunctionExecutionUnits', unit: 'MB-ms', threshold: { warning: 50000, critical: 100000, unit: 'MB-ms' } }
      );
    }

    return baseMetrics;
  }

  /**
   * Evaluate metric status against thresholds
   */
  private evaluateMetricStatus(value: number, threshold: MetricThreshold): 'normal' | 'warning' | 'critical' {
    if (value >= threshold.critical) return 'critical';
    if (value >= threshold.warning) return 'warning';
    return 'normal';
  }

  /**
   * Calculate overall application status
   */
  private calculateOverallStatus(healthChecks: HealthCheckResult[], metrics: MetricResult[]): 'healthy' | 'warning' | 'critical' {
    // Check for critical failures
    const criticalHealthChecks = healthChecks.filter(check => check.status === 'failure');
    const criticalMetrics = metrics.filter(metric => metric.status === 'critical');

    if (criticalHealthChecks.length > 0 || criticalMetrics.length > 0) {
      return 'critical';
    }

    // Check for warnings
    const warningMetrics = metrics.filter(metric => metric.status === 'warning');

    if (warningMetrics.length > 0) {
      return 'warning';
    }

    return 'healthy';
  }

  /**
   * Generate health check alerts
   */
  private generateHealthCheckAlerts(app: ApplicationMonitoring, healthChecks: HealthCheckResult[]): AlertStatus[] {
    const alerts: AlertStatus[] = [];

    for (const check of healthChecks) {
      if (check.status === 'failure') {
        alerts.push({
          id: `health-${app.name}-${check.check.name}-${Date.now()}`,
          application: app.name,
          severity: 'critical',
          title: `Health check failed: ${check.check.name}`,
          description: `Health check "${check.check.name}" failed for ${app.name}. ${check.error || 'Unknown error'}`,
          timestamp: new Date(),
          resolved: false,
          source: 'health-check'
        });
      }
    }

    return alerts;
  }

  /**
   * Generate metric alerts
   */
  private generateMetricAlerts(app: ApplicationMonitoring, metrics: MetricResult[]): AlertStatus[] {
    const alerts: AlertStatus[] = [];

    for (const metric of metrics) {
      if (metric.status === 'critical' || metric.status === 'warning') {
        alerts.push({
          id: `metric-${app.name}-${metric.name}-${Date.now()}`,
          application: app.name,
          severity: metric.status === 'critical' ? 'critical' : 'medium',
          title: `Metric threshold exceeded: ${metric.name}`,
          description: `Metric "${metric.name}" for ${app.name} is ${metric.value} ${metric.unit}, exceeding ${metric.status} threshold of ${metric.threshold[metric.status]} ${metric.unit}`,
          timestamp: new Date(),
          resolved: false,
          source: 'metric'
        });
      }
    }

    return alerts;
  }

  /**
   * Get cached monitoring status
   */
  getCachedStatus(applicationName: string): ApplicationStatus | undefined {
    return this.monitoringCache.get(applicationName);
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(config: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current monitoring configuration
   */
  getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  /**
   * Clear monitoring cache
   */
  clearCache(): void {
    this.monitoringCache.clear();
  }
}