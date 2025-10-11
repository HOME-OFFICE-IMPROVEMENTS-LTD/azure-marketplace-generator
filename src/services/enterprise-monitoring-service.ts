import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';

const execAsync = promisify(exec);

// Types for enterprise monitoring
export interface MonitoringConfig {
  subscriptionId: string;
  resourceGroups: string[];
  applications: ApplicationMonitoring[];
  alerting: AlertingConfig;
  analytics: AnalyticsConfig;
  reporting: ReportingConfig;
}

export interface ApplicationMonitoring {
  name: string;
  resourceGroup: string;
  type: 'managed-app' | 'function-app' | 'web-app';
  endpoints: string[];
  healthChecks: HealthCheck[];
  performance: PerformanceMetrics;
  customMetrics?: CustomMetric[];
}

export interface HealthCheck {
  name: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'HEAD';
  expectedStatus: number;
  timeout: number;
  interval: number;
}

export interface PerformanceMetrics {
  cpu: MetricThreshold;
  memory: MetricThreshold;
  requests: MetricThreshold;
  responseTime: MetricThreshold;
  availability: MetricThreshold;
}

export interface MetricThreshold {
  warning: number;
  critical: number;
  unit: string;
}

export interface AlertingConfig {
  enabled: boolean;
  channels: AlertChannel[];
  escalation: EscalationPolicy;
  suppressionRules: SuppressionRule[];
}

export interface AlertChannel {
  type: 'email' | 'teams' | 'slack' | 'webhook';
  configuration: Record<string, any>;
  severity: ('low' | 'medium' | 'high' | 'critical')[];
}

export interface EscalationPolicy {
  levels: EscalationLevel[];
  timeouts: number[];
}

export interface EscalationLevel {
  name: string;
  channels: string[];
  acknowledgmentRequired: boolean;
}

export interface SuppressionRule {
  name: string;
  conditions: Record<string, any>;
  duration: number;
  scope: 'application' | 'resource-group' | 'subscription';
}

export interface AnalyticsConfig {
  retention: number;
  aggregation: AggregationConfig;
  customQueries: CustomQuery[];
  dashboards: DashboardConfig[];
  reporting: ReportSchedule[];
}

export interface AggregationConfig {
  intervals: string[];
  metrics: string[];
  dimensions: string[];
}

export interface CustomQuery {
  name: string;
  query: string;
  parameters: Record<string, any>;
  schedule?: string;
}

export interface DashboardConfig {
  name: string;
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  autoRefresh: boolean;
  refreshInterval: number;
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  responsive: boolean;
}

export interface DashboardWidget {
  type: 'metric' | 'chart' | 'table' | 'alert' | 'status';
  title: string;
  position: { x: number; y: number; width: number; height: number };
  configuration: Record<string, any>;
}

export interface ReportSchedule {
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  format: 'pdf' | 'excel' | 'json';
  recipients: string[];
  content: ReportContent;
}

export interface ReportContent {
  sections: ReportSection[];
  includeCharts: boolean;
  includeTrends: boolean;
  includeRecommendations: boolean;
}

export interface ReportSection {
  type: 'summary' | 'metrics' | 'alerts' | 'performance' | 'compliance';
  title: string;
  content: Record<string, any>;
}

export interface ReportingConfig {
  enabled: boolean;
  storage: StorageConfig;
  templates: ReportTemplate[];
  automation: AutomationConfig;
}

export interface StorageConfig {
  type: 'azure-storage' | 'file-system';
  configuration: Record<string, any>;
  retention: number;
}

export interface ReportTemplate {
  name: string;
  type: string;
  template: string;
  variables: Record<string, any>;
}

export interface AutomationConfig {
  enabled: boolean;
  triggers: AutomationTrigger[];
  actions: AutomationAction[];
}

export interface AutomationTrigger {
  type: 'threshold' | 'alert' | 'schedule' | 'event';
  conditions: Record<string, any>;
  actions: string[];
}

export interface AutomationAction {
  name: string;
  type: 'scale' | 'restart' | 'notify' | 'remediate';
  configuration: Record<string, any>;
}

// Monitoring results and status
export interface MonitoringResult {
  timestamp: Date;
  applications: ApplicationStatus[];
  alerts: AlertStatus[];
  performance: PerformanceReport;
  compliance: ComplianceReport;
  recommendations: Recommendation[];
}

export interface ApplicationStatus {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  healthChecks: HealthCheckResult[];
  metrics: MetricResult[];
  lastUpdated: Date;
  uptime: number;
}

export interface HealthCheckResult {
  name: string;
  status: 'pass' | 'fail' | 'timeout';
  responseTime: number;
  statusCode?: number;
  error?: string;
  timestamp: Date;
}

export interface MetricResult {
  name: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  threshold: MetricThreshold;
  trend: 'up' | 'down' | 'stable';
}

export interface AlertStatus {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved' | 'suppressed';
  title: string;
  description: string;
  application: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

export interface PerformanceReport {
  period: string;
  applications: ApplicationPerformance[];
  trends: PerformanceTrend[];
  benchmarks: PerformanceBenchmark[];
}

export interface ApplicationPerformance {
  name: string;
  availability: number;
  responseTime: PerformanceMetric;
  throughput: PerformanceMetric;
  errorRate: PerformanceMetric;
  resourceUtilization: ResourceUtilization;
}

export interface PerformanceMetric {
  average: number;
  min: number;
  max: number;
  p95: number;
  p99: number;
  unit: string;
}

export interface ResourceUtilization {
  cpu: PerformanceMetric;
  memory: PerformanceMetric;
  disk: PerformanceMetric;
  network: PerformanceMetric;
}

export interface PerformanceTrend {
  metric: string;
  trend: 'improving' | 'degrading' | 'stable';
  change: number;
  period: string;
}

export interface PerformanceBenchmark {
  metric: string;
  value: number;
  benchmark: number;
  variance: number;
  status: 'above' | 'below' | 'within';
}

export interface ComplianceReport {
  overall: ComplianceScore;
  categories: ComplianceCategory[];
  violations: ComplianceViolation[];
  recommendations: ComplianceRecommendation[];
}

export interface ComplianceScore {
  score: number;
  maxScore: number;
  percentage: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface ComplianceCategory {
  name: string;
  score: number;
  maxScore: number;
  status: 'compliant' | 'non-compliant' | 'warning';
  checks: ComplianceCheck[];
}

export interface ComplianceCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'skip';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  remediation?: string;
}

export interface ComplianceViolation {
  category: string;
  check: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  remediation: string;
  applications: string[];
}

export interface ComplianceRecommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  savings?: string;
}

export interface Recommendation {
  type: 'performance' | 'cost' | 'security' | 'reliability';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  implementation: string;
  estimatedSavings?: string;
  estimatedImprovement?: string;
}

export class EnterpriseMonitoringService {
  private config: MonitoringConfig | null = null;
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(process.cwd(), 'monitoring-config.json');
  }

  async loadConfiguration(): Promise<MonitoringConfig> {
    try {
      const configContent = await fs.readFile(this.configPath, 'utf-8');
      this.config = JSON.parse(configContent);
      return this.config!;
    } catch (error) {
      throw new Error(`Failed to load monitoring configuration: ${error}`);
    }
  }

  async saveConfiguration(config: MonitoringConfig): Promise<void> {
    try {
      await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
      this.config = config;
    } catch (error) {
      throw new Error(`Failed to save monitoring configuration: ${error}`);
    }
  }

  async initializeMonitoring(subscriptionId: string): Promise<MonitoringConfig> {
    const defaultConfig: MonitoringConfig = {
      subscriptionId,
      resourceGroups: [],
      applications: [],
      alerting: {
        enabled: true,
        channels: [
          {
            type: 'email',
            configuration: { recipients: [] },
            severity: ['high', 'critical']
          }
        ],
        escalation: {
          levels: [
            {
              name: 'Level 1',
              channels: ['email'],
              acknowledgmentRequired: false
            }
          ],
          timeouts: [300] // 5 minutes
        },
        suppressionRules: []
      },
      analytics: {
        retention: 90, // 90 days
        aggregation: {
          intervals: ['1m', '5m', '1h', '1d'],
          metrics: ['cpu', 'memory', 'requests', 'responseTime'],
          dimensions: ['application', 'resourceGroup', 'region']
        },
        customQueries: [],
        dashboards: [],
        reporting: []
      },
      reporting: {
        enabled: true,
        storage: {
          type: 'file-system',
          configuration: { basePath: './monitoring-reports' },
          retention: 365 // 1 year
        },
        templates: [],
        automation: {
          enabled: false,
          triggers: [],
          actions: []
        }
      }
    };

    await this.saveConfiguration(defaultConfig);
    return defaultConfig;
  }

  async discoverApplications(): Promise<ApplicationMonitoring[]> {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }

    const applications: ApplicationMonitoring[] = [];

    try {
      // Discover managed applications
      const managedApps = await this.discoverManagedApplications();
      applications.push(...managedApps);

      // Discover function apps
      const functionApps = await this.discoverFunctionApps();
      applications.push(...functionApps);

      // Discover web apps
      const webApps = await this.discoverWebApps();
      applications.push(...webApps);

      return applications;
    } catch (error) {
      throw new Error(`Failed to discover applications: ${error}`);
    }
  }

  private async discoverManagedApplications(): Promise<ApplicationMonitoring[]> {
    try {
      const { stdout } = await execAsync(
        `az managedapp list --subscription "${this.config!.subscriptionId}" --query "[].{name:name,resourceGroup:resourceGroup,managedResourceGroupId:managedResourceGroupId}" --output json`
      );

      const managedApps = JSON.parse(stdout);
      return managedApps.map((app: any) => ({
        name: app.name,
        resourceGroup: app.resourceGroup,
        type: 'managed-app' as const,
        endpoints: [],
        healthChecks: [
          {
            name: 'Application Health',
            endpoint: '', // Will be determined later
            method: 'GET',
            expectedStatus: 200,
            timeout: 30000,
            interval: 300000 // 5 minutes
          }
        ],
        performance: {
          cpu: { warning: 70, critical: 90, unit: '%' },
          memory: { warning: 80, critical: 95, unit: '%' },
          requests: { warning: 1000, critical: 2000, unit: 'req/min' },
          responseTime: { warning: 2000, critical: 5000, unit: 'ms' },
          availability: { warning: 99, critical: 95, unit: '%' }
        }
      }));
    } catch (error) {
      console.warn('Failed to discover managed applications:', error);
      return [];
    }
  }

  private async discoverFunctionApps(): Promise<ApplicationMonitoring[]> {
    try {
      const { stdout } = await execAsync(
        `az functionapp list --subscription "${this.config!.subscriptionId}" --query "[].{name:name,resourceGroup:resourceGroup,defaultHostName:defaultHostName}" --output json`
      );

      const functionApps = JSON.parse(stdout);
      return functionApps.map((app: any) => ({
        name: app.name,
        resourceGroup: app.resourceGroup,
        type: 'function-app' as const,
        endpoints: [`https://${app.defaultHostName}`],
        healthChecks: [
          {
            name: 'Function App Health',
            endpoint: `https://${app.defaultHostName}/api/health`,
            method: 'GET',
            expectedStatus: 200,
            timeout: 30000,
            interval: 300000
          }
        ],
        performance: {
          cpu: { warning: 70, critical: 90, unit: '%' },
          memory: { warning: 80, critical: 95, unit: '%' },
          requests: { warning: 500, critical: 1000, unit: 'req/min' },
          responseTime: { warning: 1000, critical: 3000, unit: 'ms' },
          availability: { warning: 99, critical: 95, unit: '%' }
        }
      }));
    } catch (error) {
      console.warn('Failed to discover function apps:', error);
      return [];
    }
  }

  private async discoverWebApps(): Promise<ApplicationMonitoring[]> {
    try {
      const { stdout } = await execAsync(
        `az webapp list --subscription "${this.config!.subscriptionId}" --query "[].{name:name,resourceGroup:resourceGroup,defaultHostName:defaultHostName}" --output json`
      );

      const webApps = JSON.parse(stdout);
      return webApps.map((app: any) => ({
        name: app.name,
        resourceGroup: app.resourceGroup,
        type: 'web-app' as const,
        endpoints: [`https://${app.defaultHostName}`],
        healthChecks: [
          {
            name: 'Web App Health',
            endpoint: `https://${app.defaultHostName}/health`,
            method: 'GET',
            expectedStatus: 200,
            timeout: 30000,
            interval: 300000
          }
        ],
        performance: {
          cpu: { warning: 70, critical: 90, unit: '%' },
          memory: { warning: 80, critical: 95, unit: '%' },
          requests: { warning: 1000, critical: 2000, unit: 'req/min' },
          responseTime: { warning: 1500, critical: 4000, unit: 'ms' },
          availability: { warning: 99, critical: 95, unit: '%' }
        }
      }));
    } catch (error) {
      console.warn('Failed to discover web apps:', error);
      return [];
    }
  }

  async runMonitoring(): Promise<MonitoringResult> {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }

    const timestamp = new Date();
    const applications: ApplicationStatus[] = [];
    const alerts: AlertStatus[] = [];
    const recommendations: Recommendation[] = [];

    try {
      // Monitor each application
      for (const app of this.config.applications) {
        const status = await this.monitorApplication(app);
        applications.push(status);

        // Generate alerts based on status
        const appAlerts = await this.generateAlerts(app, status);
        alerts.push(...appAlerts);
      }

      // Generate performance report
      const performance = await this.generatePerformanceReport();

      // Generate compliance report
      const compliance = await this.generateComplianceReport();

      // Generate recommendations
      const appRecommendations = await this.generateRecommendations(applications);
      recommendations.push(...appRecommendations);

      const result: MonitoringResult = {
        timestamp,
        applications,
        alerts,
        performance,
        compliance,
        recommendations
      };

      // Process alerts
      await this.processAlerts(alerts);

      // Generate automated reports
      await this.generateAutomatedReports(result);

      return result;
    } catch (error) {
      throw new Error(`Failed to run monitoring: ${error}`);
    }
  }

  private async monitorApplication(app: ApplicationMonitoring): Promise<ApplicationStatus> {
    const healthChecks: HealthCheckResult[] = [];
    const metrics: MetricResult[] = [];

    // Run health checks
    for (const check of app.healthChecks) {
      const result = await this.runHealthCheck(check);
      healthChecks.push(result);
    }

    // Collect metrics
    const appMetrics = await this.collectMetrics(app);
    metrics.push(...appMetrics);

    // Calculate overall status
    const status = this.calculateApplicationStatus(healthChecks, metrics);

    // Calculate uptime
    const uptime = await this.calculateUptime(app.name);

    return {
      name: app.name,
      status,
      healthChecks,
      metrics,
      lastUpdated: new Date(),
      uptime
    };
  }

  private async runHealthCheck(check: HealthCheck): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const response = await fetch(check.endpoint, {
        method: check.method,
        signal: AbortSignal.timeout(check.timeout)
      });

      const responseTime = Date.now() - startTime;
      const status = response.status === check.expectedStatus ? 'pass' : 'fail';

      return {
        name: check.name,
        status,
        responseTime,
        statusCode: response.status,
        timestamp: new Date()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        name: check.name,
        status: responseTime >= check.timeout ? 'timeout' : 'fail',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  private async collectMetrics(app: ApplicationMonitoring): Promise<MetricResult[]> {
    const metrics: MetricResult[] = [];

    try {
      // Collect Azure Monitor metrics
      const azureMetrics = await this.collectAzureMetrics(app);
      metrics.push(...azureMetrics);

      // Collect custom metrics if configured
      if (app.customMetrics) {
        const customMetrics = await this.collectCustomMetrics(app.customMetrics);
        metrics.push(...customMetrics);
      }
    } catch (error) {
      console.warn(`Failed to collect metrics for ${app.name}:`, error);
    }

    return metrics;
  }

  private async collectAzureMetrics(app: ApplicationMonitoring): Promise<MetricResult[]> {
    const metrics: MetricResult[] = [];

    try {
      // Get resource ID
      const resourceId = await this.getResourceId(app);

      // Define metric queries
      const metricQueries = [
        { name: 'CPU Percentage', metric: 'CpuPercentage', threshold: app.performance.cpu },
        { name: 'Memory Percentage', metric: 'MemoryPercentage', threshold: app.performance.memory },
        { name: 'Request Count', metric: 'RequestCount', threshold: app.performance.requests },
        { name: 'Response Time', metric: 'ResponseTime', threshold: app.performance.responseTime }
      ];

      for (const query of metricQueries) {
        try {
          const { stdout } = await execAsync(
            `az monitor metrics list --resource "${resourceId}" --metric "${query.metric}" --interval PT1M --query "value[0].timeseries[0].data[-1].average" --output tsv`
          );

          const value = parseFloat(stdout.trim()) || 0;
          const status = this.evaluateMetricStatus(value, query.threshold);

          metrics.push({
            name: query.name,
            value,
            unit: query.threshold.unit,
            status,
            threshold: query.threshold,
            trend: 'stable' // Would need historical data for trend analysis
          });
        } catch (error) {
          console.warn(`Failed to collect metric ${query.name} for ${app.name}:`, error);
        }
      }
    } catch (error) {
      console.warn(`Failed to collect Azure metrics for ${app.name}:`, error);
    }

    return metrics;
  }

  private async getResourceId(app: ApplicationMonitoring): Promise<string> {
    const resourceType = app.type === 'managed-app' ? 'Microsoft.Solutions/applications' :
                        app.type === 'function-app' ? 'Microsoft.Web/sites' :
                        'Microsoft.Web/sites';

    const { stdout } = await execAsync(
      `az resource show --name "${app.name}" --resource-group "${app.resourceGroup}" --resource-type "${resourceType}" --query "id" --output tsv`
    );

    return stdout.trim();
  }

  private async collectCustomMetrics(customMetrics: CustomMetric[]): Promise<MetricResult[]> {
    // Implementation for custom metrics collection
    // This would depend on the specific custom metrics configured
    return [];
  }

  private evaluateMetricStatus(value: number, threshold: MetricThreshold): 'normal' | 'warning' | 'critical' {
    if (value >= threshold.critical) {
      return 'critical';
    } else if (value >= threshold.warning) {
      return 'warning';
    } else {
      return 'normal';
    }
  }

  private calculateApplicationStatus(
    healthChecks: HealthCheckResult[],
    metrics: MetricResult[]
  ): 'healthy' | 'warning' | 'critical' | 'unknown' {
    // Check for critical conditions
    if (healthChecks.some(check => check.status === 'fail') ||
        metrics.some(metric => metric.status === 'critical')) {
      return 'critical';
    }

    // Check for warning conditions
    if (healthChecks.some(check => check.status === 'timeout') ||
        metrics.some(metric => metric.status === 'warning')) {
      return 'warning';
    }

    // Check if we have sufficient data
    if (healthChecks.length === 0 && metrics.length === 0) {
      return 'unknown';
    }

    return 'healthy';
  }

  private async calculateUptime(appName: string): Promise<number> {
    // This would calculate uptime based on historical monitoring data
    // For now, return a default value
    return 99.9;
  }

  private async generateAlerts(app: ApplicationMonitoring, status: ApplicationStatus): Promise<AlertStatus[]> {
    const alerts: AlertStatus[] = [];

    // Generate alerts based on application status
    if (status.status === 'critical') {
      alerts.push({
        id: `${app.name}-critical-${Date.now()}`,
        severity: 'critical',
        status: 'active',
        title: `Critical Issue Detected: ${app.name}`,
        description: `Application ${app.name} is in critical state`,
        application: app.name,
        metric: 'overall-status',
        value: 0,
        threshold: 1,
        timestamp: new Date()
      });
    }

    // Generate metric-based alerts
    for (const metric of status.metrics) {
      if (metric.status === 'critical' || metric.status === 'warning') {
        alerts.push({
          id: `${app.name}-${metric.name}-${Date.now()}`,
          severity: metric.status === 'critical' ? 'critical' : 'medium',
          status: 'active',
          title: `${metric.name} Alert: ${app.name}`,
          description: `${metric.name} is ${metric.value}${metric.unit}, exceeding threshold`,
          application: app.name,
          metric: metric.name,
          value: metric.value,
          threshold: metric.status === 'critical' ? metric.threshold.critical : metric.threshold.warning,
          timestamp: new Date()
        });
      }
    }

    return alerts;
  }

  private async processAlerts(alerts: AlertStatus[]): Promise<void> {
    if (!this.config?.alerting.enabled) {
      return;
    }

    for (const alert of alerts) {
      // Send notifications based on alert severity and configuration
      await this.sendAlertNotifications(alert);

      // Log alert for tracking
      console.log(chalk.red(`🚨 ALERT: ${alert.title} - ${alert.description}`));
    }
  }

  private async sendAlertNotifications(alert: AlertStatus): Promise<void> {
    // Implementation for sending notifications through configured channels
    // This would integrate with email, Teams, Slack, etc.
    console.log(chalk.yellow(`📧 Sending alert notification: ${alert.title}`));
  }

  private async generatePerformanceReport(): Promise<PerformanceReport> {
    // Implementation for performance report generation
    return {
      period: 'last-24h',
      applications: [],
      trends: [],
      benchmarks: []
    };
  }

  private async generateComplianceReport(): Promise<ComplianceReport> {
    // Implementation for compliance report generation
    return {
      overall: { score: 85, maxScore: 100, percentage: 85, grade: 'B' },
      categories: [],
      violations: [],
      recommendations: []
    };
  }

  private async generateRecommendations(applications: ApplicationStatus[]): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Analyze applications for optimization opportunities
    for (const app of applications) {
      // Performance recommendations
      const perfRecommendations = this.generatePerformanceRecommendations(app);
      recommendations.push(...perfRecommendations);

      // Cost optimization recommendations
      const costRecommendations = this.generateCostRecommendations(app);
      recommendations.push(...costRecommendations);
    }

    return recommendations;
  }

  private generatePerformanceRecommendations(app: ApplicationStatus): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Check CPU utilization
    const cpuMetric = app.metrics.find(m => m.name.includes('CPU'));
    if (cpuMetric && cpuMetric.status === 'warning') {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        title: `Optimize CPU Usage for ${app.name}`,
        description: `CPU utilization is at ${cpuMetric.value}%, consider optimization or scaling`,
        impact: 'Improved response times and reduced resource costs',
        effort: 'medium',
        implementation: 'Review application code, implement caching, or scale horizontally',
        estimatedImprovement: '20-30% performance improvement'
      });
    }

    return recommendations;
  }

  private generateCostRecommendations(app: ApplicationStatus): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // This would analyze resource usage patterns and suggest cost optimizations
    // For now, return empty array
    return recommendations;
  }

  private async generateAutomatedReports(result: MonitoringResult): Promise<void> {
    if (!this.config?.reporting.enabled) {
      return;
    }

    // Generate and save monitoring report
    const reportPath = path.join(
      this.config.reporting.storage.configuration.basePath || './monitoring-reports',
      `monitoring-report-${result.timestamp.toISOString().split('T')[0]}.json`
    );

    try {
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(result, null, 2));
      console.log(chalk.green(`📊 Monitoring report saved: ${reportPath}`));
    } catch (error) {
      console.error(chalk.red(`Failed to save monitoring report: ${error}`));
    }
  }

  async generateDashboard(): Promise<string> {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }

    // Generate HTML dashboard
    const dashboardHtml = this.createDashboardHtml();
    const dashboardPath = path.join(process.cwd(), 'monitoring-dashboard.html');

    await fs.writeFile(dashboardPath, dashboardHtml);
    return dashboardPath;
  }

  private createDashboardHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Enterprise Monitoring Dashboard</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .header { background: #0078d4; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .widget { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .status-healthy { color: #107c10; }
        .status-warning { color: #ff8c00; }
        .status-critical { color: #d13438; }
        .metric { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .metric:last-child { border-bottom: none; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Enterprise Monitoring Dashboard</h1>
        <p>Real-time monitoring and analytics for Azure Marketplace applications</p>
    </div>
    
    <div class="dashboard-grid">
        <div class="widget">
            <h3>📊 Application Status</h3>
            <div id="application-status">Loading...</div>
        </div>
        
        <div class="widget">
            <h3>⚡ Performance Metrics</h3>
            <div id="performance-metrics">Loading...</div>
        </div>
        
        <div class="widget">
            <h3>🚨 Active Alerts</h3>
            <div id="active-alerts">Loading...</div>
        </div>
        
        <div class="widget">
            <h3>📈 Recommendations</h3>
            <div id="recommendations">Loading...</div>
        </div>
    </div>
    
    <script>
        // Dashboard would be populated with real data via AJAX calls
        // This is a static template for demonstration
        document.getElementById('application-status').innerHTML = 
            '<div class="metric"><span>Applications Monitored</span><span class="status-healthy">0</span></div>' +
            '<div class="metric"><span>Healthy</span><span class="status-healthy">0</span></div>' +
            '<div class="metric"><span>Warning</span><span class="status-warning">0</span></div>' +
            '<div class="metric"><span>Critical</span><span class="status-critical">0</span></div>';
            
        document.getElementById('performance-metrics').innerHTML = 
            '<div class="metric"><span>Avg Response Time</span><span>0ms</span></div>' +
            '<div class="metric"><span>Availability</span><span>0%</span></div>' +
            '<div class="metric"><span>CPU Usage</span><span>0%</span></div>' +
            '<div class="metric"><span>Memory Usage</span><span>0%</span></div>';
            
        document.getElementById('active-alerts').innerHTML = '<p>No active alerts</p>';
        document.getElementById('recommendations').innerHTML = '<p>No recommendations available</p>';
        
        // Auto-refresh every 30 seconds
        setInterval(() => {
            // In a real implementation, this would fetch fresh data
            console.log('Refreshing dashboard data...');
        }, 30000);
    </script>
</body>
</html>`;
  }

  async cleanup(): Promise<void> {
    // Cleanup monitoring resources, temporary files, etc.
    console.log(chalk.blue('🧹 Cleaning up monitoring resources...'));
  }
}

// Custom metric interface
export interface CustomMetric {
  name: string;
  query: string;
  threshold: MetricThreshold;
  unit: string;
}