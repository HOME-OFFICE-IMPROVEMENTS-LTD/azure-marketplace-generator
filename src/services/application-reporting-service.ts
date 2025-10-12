import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';

export interface ApplicationStatus {
  application: ApplicationMonitoring;
  status: 'healthy' | 'warning' | 'critical';
  lastChecked: Date;
  healthChecks: HealthCheckResult[];
  metrics: MetricResult[];
  uptime: number;
  alerts: AlertStatus[];
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

export interface MetricThreshold {
  warning: number;
  critical: number;
  unit: string;
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

export interface MonitoringResult {
  timestamp: Date;
  applications: ApplicationStatus[];
  alerts: AlertStatus[];
  performance: PerformanceReport;
  compliance: ComplianceReport;
  recommendations: Recommendation[];
  summary: MonitoringSummary;
}

export interface PerformanceReport {
  totalApplications: number;
  healthyApplications: number;
  applicationsWithWarnings: number;
  criticalApplications: number;
  averageResponseTime: number;
  totalAlerts: number;
  criticalAlerts: number;
  overallAvailability: number;
  trends: PerformanceTrend[];
}

export interface PerformanceTrend {
  metric: string;
  period: string;
  change: number;
  direction: 'improving' | 'degrading' | 'stable';
}

export interface ComplianceReport {
  overall: ComplianceOverall;
  categories: ComplianceCategory[];
  violations: ComplianceViolation[];
  recommendations: ComplianceRecommendation[];
}

export interface ComplianceOverall {
  score: number;
  percentage: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  trend: 'improving' | 'degrading' | 'stable';
}

export interface ComplianceCategory {
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
  status: 'compliant' | 'partial' | 'non-compliant';
  checks: ComplianceCheck[];
}

export interface ComplianceCheck {
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  remediation: string;
}

export interface ComplianceViolation {
  application: string;
  check: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  remediation: string;
  discoveredAt: Date;
}

export interface ComplianceRecommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  applications: string[];
}

export interface Recommendation {
  type: 'performance' | 'security' | 'cost' | 'reliability';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  implementation: string;
  applications: string[];
  estimatedEffort: string;
  potentialSavings?: string;
}

export interface MonitoringSummary {
  totalApplications: number;
  healthyApplications: number;
  applicationsWithIssues: number;
  totalAlerts: number;
  criticalAlerts: number;
  averageUptime: number;
  monitoringCoverage: number;
  lastUpdated: Date;
}

export interface ReportSchedule {
  type: 'performance' | 'compliance' | 'executive' | 'detailed';
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  enabled: boolean;
  lastSent?: Date;
  nextScheduled?: Date;
}

export interface ReportingConfig {
  outputDirectory: string;
  enableAutomatedReports: boolean;
  schedules: ReportSchedule[];
  templateDirectory?: string;
  retentionDays: number;
}

/**
 * Application Reporting Service
 *
 * Responsible for generating comprehensive reports from monitoring data:
 * - Performance reports with trends and analytics
 * - Compliance reports with security and policy checks
 * - Executive summaries and detailed technical reports
 * - Automated scheduled reporting
 *
 * Provides multiple output formats and customizable templates.
 */
export class ApplicationReportingService {
  private config: ReportingConfig;

  constructor(config: ReportingConfig) {
    this.config = config;
  }

  /**
   * Generate comprehensive monitoring report
   */
  async generateMonitoringReport(applications: ApplicationStatus[]): Promise<MonitoringResult> {
    console.log(chalk.blue('📊 Generating comprehensive monitoring report...'));

    const alerts = this.extractAllAlerts(applications);
    const performance = await this.generatePerformanceReport(applications);
    const compliance = await this.generateComplianceReport(applications);
    const recommendations = await this.generateRecommendations(applications);
    const summary = this.generateSummary(applications, alerts);

    const result: MonitoringResult = {
      timestamp: new Date(),
      applications,
      alerts,
      performance,
      compliance,
      recommendations,
      summary
    };

    console.log(chalk.green('✅ Monitoring report generated successfully'));
    return result;
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(applications: ApplicationStatus[]): Promise<PerformanceReport> {
    const totalApplications = applications.length;
    const healthyApplications = applications.filter(app => app.status === 'healthy').length;
    const applicationsWithWarnings = applications.filter(app => app.status === 'warning').length;
    const criticalApplications = applications.filter(app => app.status === 'critical').length;

    // Calculate average response time
    const responseTimes = applications.flatMap(app =>
      app.healthChecks.map(check => check.responseTime)
    ).filter(time => time > 0);
    const averageResponseTime = responseTimes.length > 0 ?
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0;

    // Count alerts
    const alerts = this.extractAllAlerts(applications);
    const totalAlerts = alerts.length;
    const criticalAlerts = alerts.filter(alert => alert.severity === 'critical').length;

    // Calculate overall availability
    const availabilities = applications.map(app => app.uptime);
    const overallAvailability = availabilities.length > 0 ?
      availabilities.reduce((sum, uptime) => sum + uptime, 0) / availabilities.length : 0;

    return {
      totalApplications,
      healthyApplications,
      applicationsWithWarnings,
      criticalApplications,
      averageResponseTime: Math.round(averageResponseTime),
      totalAlerts,
      criticalAlerts,
      overallAvailability: Math.round(overallAvailability * 100) / 100,
      trends: this.calculatePerformanceTrends(applications)
    };
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(applications: ApplicationStatus[]): Promise<ComplianceReport> {
    // This would integrate with your compliance checking system
    // For now, generating mock compliance data

    const categories: ComplianceCategory[] = [
      {
        name: 'Security',
        score: 85,
        maxScore: 100,
        percentage: 85,
        status: 'partial',
        checks: [
          {
            name: 'HTTPS Enforcement',
            description: 'All endpoints must use HTTPS',
            status: 'pass',
            severity: 'high',
            remediation: 'Configure SSL/TLS certificates'
          },
          {
            name: 'Authentication Required',
            description: 'All applications must require authentication',
            status: 'warning',
            severity: 'medium',
            remediation: 'Implement authentication middleware'
          }
        ]
      },
      {
        name: 'Performance',
        score: 92,
        maxScore: 100,
        percentage: 92,
        status: 'compliant',
        checks: [
          {
            name: 'Response Time SLA',
            description: 'Average response time under 2 seconds',
            status: 'pass',
            severity: 'medium',
            remediation: 'Optimize application performance'
          }
        ]
      }
    ];

    const overall: ComplianceOverall = {
      score: Math.round(categories.reduce((sum, cat) => sum + cat.score, 0) / categories.length),
      percentage: Math.round(categories.reduce((sum, cat) => sum + cat.percentage, 0) / categories.length),
      grade: 'B',
      trend: 'stable'
    };

    return {
      overall,
      categories,
      violations: [],
      recommendations: []
    };
  }

  /**
   * Generate actionable recommendations
   */
  async generateRecommendations(applications: ApplicationStatus[]): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Performance recommendations
    const slowApplications = applications.filter(app => {
      const avgResponseTime = app.healthChecks.reduce((sum, check) => sum + check.responseTime, 0) / app.healthChecks.length;
      return avgResponseTime > 2000;
    });

    if (slowApplications.length > 0) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        title: 'Optimize Response Times',
        description: 'Several applications have response times exceeding 2 seconds',
        impact: 'Improved user experience and reduced bounce rates',
        implementation: 'Review database queries, implement caching, optimize asset delivery',
        applications: slowApplications.map(app => app.application.name),
        estimatedEffort: '2-3 weeks'
      });
    }

    // Reliability recommendations
    const unreliableApplications = applications.filter(app => app.uptime < 99.0);

    if (unreliableApplications.length > 0) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        title: 'Improve Application Reliability',
        description: 'Some applications have uptime below 99%',
        impact: 'Reduced downtime and improved service availability',
        implementation: 'Implement health checks, add redundancy, improve error handling',
        applications: unreliableApplications.map(app => app.application.name),
        estimatedEffort: '3-4 weeks'
      });
    }

    // Security recommendations
    const applicationsWithoutHttps = applications.filter(app =>
      app.application.endpoints.some(endpoint => endpoint.startsWith('http://'))
    );

    if (applicationsWithoutHttps.length > 0) {
      recommendations.push({
        type: 'security',
        priority: 'critical',
        title: 'Enforce HTTPS',
        description: 'Some applications are not using HTTPS encryption',
        impact: 'Enhanced security and data protection',
        implementation: 'Configure SSL certificates and redirect HTTP to HTTPS',
        applications: applicationsWithoutHttps.map(app => app.application.name),
        estimatedEffort: '1-2 weeks'
      });
    }

    return recommendations;
  }

  /**
   * Export report to various formats
   */
  async exportReport(result: MonitoringResult, format: 'json' | 'html' | 'pdf' | 'csv'): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `monitoring-report-${timestamp}.${format}`;
    const filepath = path.join(this.config.outputDirectory, filename);

    // Ensure output directory exists
    await fs.mkdir(this.config.outputDirectory, { recursive: true });

    switch (format) {
      case 'json':
        await fs.writeFile(filepath, JSON.stringify(result, null, 2));
        break;

      case 'html':
        const htmlContent = this.generateHtmlReport(result);
        await fs.writeFile(filepath, htmlContent);
        break;

      case 'csv':
        const csvContent = this.generateCsvReport(result);
        await fs.writeFile(filepath, csvContent);
        break;

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    console.log(chalk.green(`📄 Report exported: ${filepath}`));
    return filepath;
  }

  /**
   * Generate automated reports based on schedule
   */
  async generateScheduledReports(result: MonitoringResult): Promise<void> {
    if (!this.config.enableAutomatedReports) {
      return;
    }

    console.log(chalk.blue('📅 Processing scheduled reports...'));

    for (const schedule of this.config.schedules) {
      if (schedule.enabled && this.shouldGenerateReport(schedule)) {
        try {
          const reportPath = await this.exportReport(result, 'html');

          // Here you would implement email sending or other delivery mechanisms
          console.log(chalk.green(`✅ Scheduled ${schedule.type} report generated: ${reportPath}`));

          // Update schedule
          schedule.lastSent = new Date();
          schedule.nextScheduled = this.calculateNextSchedule(schedule);
        } catch (error) {
          console.error(chalk.red(`❌ Failed to generate ${schedule.type} report:`), error);
        }
      }
    }
  }

  /**
   * Generate HTML report
   */
  private generateHtmlReport(result: MonitoringResult): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Azure Marketplace Generator - Monitoring Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #0078d4; color: white; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .status-healthy { color: #107c10; }
        .status-warning { color: #ff8c00; }
        .status-critical { color: #d83b01; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Monitoring Report</h1>
        <p>Generated: ${result.timestamp.toLocaleString()}</p>
    </div>

    <div class="section">
        <h2>Summary</h2>
        <table>
            <tr><td>Total Applications</td><td>${result.summary.totalApplications}</td></tr>
            <tr><td>Healthy Applications</td><td class="status-healthy">${result.summary.healthyApplications}</td></tr>
            <tr><td>Applications with Issues</td><td class="status-warning">${result.summary.applicationsWithIssues}</td></tr>
            <tr><td>Total Alerts</td><td>${result.summary.totalAlerts}</td></tr>
            <tr><td>Critical Alerts</td><td class="status-critical">${result.summary.criticalAlerts}</td></tr>
            <tr><td>Average Uptime</td><td>${result.summary.averageUptime.toFixed(2)}%</td></tr>
        </table>
    </div>

    <div class="section">
        <h2>Applications</h2>
        <table>
            <tr><th>Name</th><th>Status</th><th>Uptime</th><th>Last Checked</th></tr>
            ${result.applications.map(app => `
                <tr>
                    <td>${app.application.name}</td>
                    <td class="status-${app.status}">${app.status}</td>
                    <td>${app.uptime.toFixed(2)}%</td>
                    <td>${app.lastChecked.toLocaleString()}</td>
                </tr>
            `).join('')}
        </table>
    </div>

    <div class="section">
        <h2>Recommendations</h2>
        ${result.recommendations.map(rec => `
            <div style="margin-bottom: 15px; padding: 10px; border-left: 4px solid ${
              rec.priority === 'critical' ? '#d83b01' :
              rec.priority === 'high' ? '#ff8c00' : '#0078d4'
            };">
                <h4>${rec.title} (${rec.priority})</h4>
                <p>${rec.description}</p>
                <p><strong>Impact:</strong> ${rec.impact}</p>
                <p><strong>Applications:</strong> ${rec.applications.join(', ')}</p>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
  }

  /**
   * Generate CSV report
   */
  private generateCsvReport(result: MonitoringResult): string {
    const headers = ['Application,Type,Status,Uptime,Health Checks,Metrics,Alerts'];
    const rows = result.applications.map(app => [
      app.application.name,
      app.application.type,
      app.status,
      app.uptime.toFixed(2),
      app.healthChecks.length,
      app.metrics.length,
      app.alerts.length
    ].join(','));

    return [headers, ...rows].join('\n');
  }

  /**
   * Extract all alerts from applications
   */
  private extractAllAlerts(applications: ApplicationStatus[]): AlertStatus[] {
    return applications.flatMap(app => app.alerts);
  }

  /**
   * Calculate performance trends
   */
  private calculatePerformanceTrends(applications: ApplicationStatus[]): PerformanceTrend[] {
    // This would use historical data to calculate trends
    // For now, returning mock trend data
    return [
      {
        metric: 'Response Time',
        period: '7 days',
        change: -5.2,
        direction: 'improving'
      },
      {
        metric: 'Error Rate',
        period: '7 days',
        change: 0.1,
        direction: 'stable'
      }
    ];
  }

  /**
   * Generate monitoring summary
   */
  private generateSummary(applications: ApplicationStatus[], alerts: AlertStatus[]): MonitoringSummary {
    const totalApplications = applications.length;
    const healthyApplications = applications.filter(app => app.status === 'healthy').length;
    const applicationsWithIssues = totalApplications - healthyApplications;
    const totalAlerts = alerts.length;
    const criticalAlerts = alerts.filter(alert => alert.severity === 'critical').length;
    const averageUptime = applications.reduce((sum, app) => sum + app.uptime, 0) / totalApplications;

    return {
      totalApplications,
      healthyApplications,
      applicationsWithIssues,
      totalAlerts,
      criticalAlerts,
      averageUptime,
      monitoringCoverage: 100, // Assuming full coverage
      lastUpdated: new Date()
    };
  }

  /**
   * Check if report should be generated based on schedule
   */
  private shouldGenerateReport(schedule: ReportSchedule): boolean {
    if (!schedule.lastSent) return true;

    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - schedule.lastSent.getTime()) / (1000 * 60 * 60 * 24));

    switch (schedule.frequency) {
      case 'daily': return daysDiff >= 1;
      case 'weekly': return daysDiff >= 7;
      case 'monthly': return daysDiff >= 30;
      default: return false;
    }
  }

  /**
   * Calculate next scheduled report time
   */
  private calculateNextSchedule(schedule: ReportSchedule): Date {
    const now = new Date();
    const next = new Date(now);

    switch (schedule.frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
    }

    return next;
  }

  /**
   * Update reporting configuration
   */
  updateConfig(config: Partial<ReportingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current reporting configuration
   */
  getConfig(): ReportingConfig {
    return { ...this.config };
  }
}