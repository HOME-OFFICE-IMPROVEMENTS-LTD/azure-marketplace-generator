import { EnterpriseMonitoringOrchestrator, createEnterpriseMonitoring, EnterpriseMonitoringConfig } from './enterprise-monitoring-orchestrator';
import { MonitoringResult } from './application-reporting-service';
import * as fs from 'fs/promises';
import * as path from 'path';

// Re-export types for backward compatibility
export interface MonitoringConfig {
  subscriptionId: string;
  resourceGroups: string[];
  applications: ApplicationMonitoring[];
  alerting: AlertingConfig;
  analytics: AnalyticsConfig;
  reporting: ReportingConfigLegacy;
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

export interface ReportingConfigLegacy {
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

export interface CustomMetric {
  name: string;
  query: string;
  threshold: MetricThreshold;
  unit: string;
}

/**
 * EnterpriseMonitoringService - Backward-compatible wrapper
 *
 * @deprecated Use EnterpriseMonitoringOrchestrator directly for new implementations
 */
export class EnterpriseMonitoringService {
    private orchestrator: EnterpriseMonitoringOrchestrator;
    private config: MonitoringConfig | null = null;
    private configPath: string;

    constructor(configPath?: string) {
        this.configPath = configPath || path.join(process.cwd(), 'monitoring-config.json');

        // Initialize with default config for backward compatibility
        this.orchestrator = createEnterpriseMonitoring();
    }

    // Core monitoring methods that map to orchestrator API
    async monitorAllApplications(config?: any): Promise<any> {
        // Initialize the orchestrator if subscription ID is provided
        if (config?.subscriptionId) {
            await this.orchestrator.initialize(config.subscriptionId);
        }
        return this.orchestrator.runMonitoring();
    }

    async discoverApplications(subscriptions?: string[]): Promise<any> {
        const services = this.orchestrator.getServices();
        return services.discovery.discoverAllApplications();
    }

    async monitorApplications(applications: any[]): Promise<any> {
        const services = this.orchestrator.getServices();
        return services.monitoring.monitorApplications(applications);
    }

    async generateReports(options?: any): Promise<any> {
        const result = await this.orchestrator.runMonitoring();
        const services = this.orchestrator.getServices();
        return services.reporting.generateMonitoringReport(result.applications);
    }

    async getStatus(): Promise<any> {
        return this.orchestrator.runMonitoring();
    }

    async configure(config: any): Promise<void> {
        this.orchestrator.updateConfiguration(config);
    }

    async healthCheck(): Promise<boolean> {
        try {
            await this.orchestrator.runMonitoring();
            return true;
        } catch {
            return false;
        }
    }

    async exportData(format: 'json' | 'csv' | 'excel' = 'json'): Promise<any> {
        const result = await this.orchestrator.runMonitoring();
        return this.orchestrator.exportReport(result, format as any);
    }

    async getMetrics(applicationIds?: string[]): Promise<any> {
        const services = this.orchestrator.getServices();
        // For now, return empty array - would need to implement filtering by IDs
        return [];
    }

    async configureAlerts(alertConfig: any): Promise<void> {
        // Store alert config in orchestrator configuration
        this.orchestrator.updateConfiguration({
            monitoring: {
                alertingEnabled: true,
                pollingInterval: 300000,
                retryAttempts: 3,
                enableMetrics: true,
                enableHealthChecks: true,
                timeoutMs: 30000
            }
        });
    }

    async getAlertHistory(timeRange?: string): Promise<any> {
        // For now, return empty array - would need to implement alert history tracking
        return [];
    }

    async cleanup(): Promise<void> {
        // Clear any cached data
        this.orchestrator.clearCache();
    }

    // Legacy methods expected by CLI commands
    async loadConfiguration(): Promise<MonitoringConfig> {
        if (this.config) {
            return this.config;
        }

        try {
            const configContent = await fs.readFile(this.configPath, 'utf-8');
            this.config = JSON.parse(configContent);
            return this.config!;
        } catch (error) {
            // Return default config if file doesn't exist
            const defaultConfig: MonitoringConfig = {
                subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || '',
                resourceGroups: [],
                applications: [],
                alerting: {
                    enabled: true,
                    channels: [],
                    escalation: { levels: [], timeouts: [] },
                    suppressionRules: []
                },
                analytics: {
                    retention: 90,
                    aggregation: { intervals: [], metrics: [], dimensions: [] },
                    customQueries: [],
                    dashboards: [],
                    reporting: []
                },
                reporting: {
                    enabled: true,
                    storage: { type: 'file-system', configuration: {}, retention: 365 },
                    templates: [],
                    automation: { enabled: false, triggers: [], actions: [] }
                }
            };
            this.config = defaultConfig;
            return defaultConfig;
        }
    }

    async saveConfiguration(config: MonitoringConfig): Promise<void> {
        await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
        this.config = config;
    }

    async initializeMonitoring(subscriptionId: string): Promise<MonitoringConfig> {
        const defaultConfig: MonitoringConfig = {
            subscriptionId,
            resourceGroups: [],
            applications: [],
            alerting: {
                enabled: true,
                channels: [],
                escalation: { levels: [], timeouts: [] },
                suppressionRules: []
            },
            analytics: {
                retention: 90,
                aggregation: { intervals: [], metrics: [], dimensions: [] },
                customQueries: [],
                dashboards: [],
                reporting: []
            },
            reporting: {
                enabled: true,
                storage: { type: 'file-system', configuration: {}, retention: 365 },
                templates: [],
                automation: { enabled: false, triggers: [], actions: [] }
            }
        };

        await this.saveConfiguration(defaultConfig);
        await this.orchestrator.initialize(subscriptionId);
        return defaultConfig;
    }

    async runMonitoring(): Promise<MonitoringResult> {
        return this.orchestrator.runMonitoring();
    }

    async generateDashboard(): Promise<string> {
        // Generate a simple HTML dashboard
        const dashboardHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Enterprise Monitoring Dashboard</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 20px; }
        .header { background: #0078d4; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .status { padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Enterprise Monitoring Dashboard</h1>
        <p>Real-time monitoring for Azure Marketplace applications</p>
    </div>
    <div class="status">
        <h3>📊 Monitoring Status</h3>
        <p>Dashboard generated at: ${new Date().toLocaleString()}</p>
        <p>Use the CLI commands to view detailed monitoring data.</p>
    </div>
</body>
</html>`;

        const dashboardPath = path.join(process.cwd(), 'monitoring-dashboard.html');
        await fs.writeFile(dashboardPath, dashboardHtml);
        return dashboardPath;
    }
}
