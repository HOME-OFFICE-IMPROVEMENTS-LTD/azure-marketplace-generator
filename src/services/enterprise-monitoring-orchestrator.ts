import chalk from 'chalk';
import { ApplicationDiscoveryService, DiscoveryConfig } from './application-discovery-service';
import { ApplicationMonitoringService, MonitoringConfig } from './application-monitoring-service';
import { ApplicationReportingService, ReportingConfig, MonitoringResult } from './application-reporting-service';

export interface EnterpriseMonitoringConfig {
  discovery: DiscoveryConfig;
  monitoring: MonitoringConfig;
  reporting: ReportingConfig;
}

/**
 * Enterprise Monitoring Orchestrator
 *
 * Orchestrates the three core monitoring services:
 * - ApplicationDiscoveryService: Finds and catalogs applications
 * - ApplicationMonitoringService: Actively monitors application health and performance
 * - ApplicationReportingService: Generates reports and insights
 *
 * Provides a unified interface for enterprise monitoring operations.
 */
export class EnterpriseMonitoringOrchestrator {
  private discoveryService: ApplicationDiscoveryService;
  private monitoringService: ApplicationMonitoringService;
  private reportingService: ApplicationReportingService;
  private config: EnterpriseMonitoringConfig;

  constructor(config: EnterpriseMonitoringConfig) {
    this.config = config;
    this.discoveryService = new ApplicationDiscoveryService(config.discovery);
    this.monitoringService = new ApplicationMonitoringService();
    this.reportingService = new ApplicationReportingService(config.reporting);
  }

  /**
   * Initialize the monitoring system
   */
  async initialize(subscriptionId?: string): Promise<void> {
    console.log(chalk.blue('🚀 Initializing Enterprise Monitoring System...'));

    if (subscriptionId) {
      // Update discovery config with subscription ID
      this.discoveryService.updateConfig({ subscriptionId });
    }

    console.log(chalk.green('✅ Enterprise Monitoring System initialized'));
  }

  /**
   * Run a complete monitoring cycle
   */
  async runMonitoring(): Promise<MonitoringResult> {
    console.log(chalk.blue('🔄 Starting monitoring cycle...'));

    try {
      // Step 1: Discover applications
      console.log(chalk.yellow('Phase 1: Application Discovery'));
      const applications = await this.discoveryService.discoverAllApplications();

      if (applications.length === 0) {
        console.log(chalk.yellow('⚠️  No applications found to monitor'));
        return this.createEmptyReport();
      }

      // Step 2: Monitor applications
      console.log(chalk.yellow('Phase 2: Application Monitoring'));
      const applicationStatuses = await this.monitoringService.monitorApplications(applications);

      // Step 3: Generate reports
      console.log(chalk.yellow('Phase 3: Report Generation'));
      const result = await this.reportingService.generateMonitoringReport(applicationStatuses);

      // Step 4: Process automated reports
      await this.reportingService.generateScheduledReports(result);

      console.log(chalk.green('✅ Monitoring cycle completed successfully'));
      return result;

    } catch (error) {
      console.error(chalk.red('❌ Monitoring cycle failed:'), error);
      throw error;
    }
  }

  /**
   * Get monitoring status for a specific application
   */
  async getApplicationStatus(applicationName: string): Promise<any> {
    const cachedStatus = this.monitoringService.getCachedStatus(applicationName);

    if (cachedStatus) {
      return cachedStatus;
    }

    // If not cached, run a targeted discovery and monitoring
    const applications = await this.discoveryService.discoverAllApplications();
    const targetApp = applications.find(app => app.name === applicationName);

    if (!targetApp) {
      throw new Error(`Application '${applicationName}' not found`);
    }

    return await this.monitoringService.monitorSingleApplication(targetApp);
  }

  /**
   * Export monitoring report
   */
  async exportReport(result: MonitoringResult, format: 'json' | 'html' | 'pdf' | 'csv'): Promise<string> {
    return await this.reportingService.exportReport(result, format);
  }

  /**
   * Update monitoring configuration
   */
  updateConfiguration(config: Partial<EnterpriseMonitoringConfig>): void {
    if (config.discovery) {
      this.discoveryService.updateConfig(config.discovery);
      this.config.discovery = { ...this.config.discovery, ...config.discovery };
    }

    if (config.monitoring) {
      this.monitoringService.updateConfig(config.monitoring);
      this.config.monitoring = { ...this.config.monitoring, ...config.monitoring };
    }

    if (config.reporting) {
      this.reportingService.updateConfig(config.reporting);
      this.config.reporting = { ...this.config.reporting, ...config.reporting };
    }
  }

  /**
   * Get current configuration
   */
  getConfiguration(): EnterpriseMonitoringConfig {
    return {
      discovery: this.discoveryService.getConfig(),
      monitoring: this.monitoringService.getConfig(),
      reporting: this.reportingService.getConfig()
    };
  }

  /**
   * Clear monitoring cache
   */
  clearCache(): void {
    this.monitoringService.clearCache();
  }

  /**
   * Get service instances for advanced usage
   */
  getServices() {
    return {
      discovery: this.discoveryService,
      monitoring: this.monitoringService,
      reporting: this.reportingService
    };
  }

  /**
   * Create empty report when no applications are found
   */
  private createEmptyReport(): MonitoringResult {
    return {
      timestamp: new Date(),
      applications: [],
      alerts: [],
      performance: {
        totalApplications: 0,
        healthyApplications: 0,
        applicationsWithWarnings: 0,
        criticalApplications: 0,
        averageResponseTime: 0,
        totalAlerts: 0,
        criticalAlerts: 0,
        overallAvailability: 0,
        trends: []
      },
      compliance: {
        overall: {
          score: 0,
          percentage: 0,
          grade: 'F',
          trend: 'stable'
        },
        categories: [],
        violations: [],
        recommendations: []
      },
      recommendations: [],
      summary: {
        totalApplications: 0,
        healthyApplications: 0,
        applicationsWithIssues: 0,
        totalAlerts: 0,
        criticalAlerts: 0,
        averageUptime: 0,
        monitoringCoverage: 0,
        lastUpdated: new Date()
      }
    };
  }
}

/**
 * Factory function to create a configured Enterprise Monitoring Orchestrator
 */
export function createEnterpriseMonitoring(config?: Partial<EnterpriseMonitoringConfig>): EnterpriseMonitoringOrchestrator {
  const defaultConfig: EnterpriseMonitoringConfig = {
    discovery: {
      applicationTypes: ['managed-app', 'function-app', 'web-app'],
      includeHealthChecks: true,
      autoConfigureMetrics: true
    },
    monitoring: {
      pollingInterval: 300000, // 5 minutes
      retryAttempts: 3,
      enableMetrics: true,
      enableHealthChecks: true,
      alertingEnabled: true,
      timeoutMs: 30000
    },
    reporting: {
      outputDirectory: './reports',
      enableAutomatedReports: false,
      schedules: [],
      retentionDays: 30
    }
  };

  const finalConfig: EnterpriseMonitoringConfig = {
    discovery: { ...defaultConfig.discovery, ...config?.discovery },
    monitoring: { ...defaultConfig.monitoring, ...config?.monitoring },
    reporting: { ...defaultConfig.reporting, ...config?.reporting }
  };

  return new EnterpriseMonitoringOrchestrator(finalConfig);
}