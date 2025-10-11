import { Command } from 'commander';
import chalk from 'chalk';
import * as inquirer from 'inquirer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EnterpriseMonitoringService, MonitoringConfig, ApplicationMonitoring } from '../../services/enterprise-monitoring-service';

export const monitorCommand = new Command('monitor')
  .description('Enterprise monitoring and analytics for Azure applications')
  .option('-c, --config <path>', 'Path to monitoring configuration file')
  .option('-s, --subscription <id>', 'Azure subscription ID')
  .option('--init', 'Initialize monitoring configuration')
  .option('--discover', 'Auto-discover applications for monitoring')
  .option('--dashboard', 'Generate monitoring dashboard')
  .option('--alerts', 'Show active alerts only')
  .option('--performance', 'Show performance report')
  .option('--compliance', 'Show compliance report')
  .option('--recommendations', 'Show optimization recommendations')
  .option('--export <format>', 'Export report (json|pdf|excel)', 'json')
  .option('--watch', 'Continuous monitoring mode')
  .option('--interval <minutes>', 'Monitoring interval in minutes', '5')
  .action(async (options) => {
    try {
      console.log(chalk.blue.bold('🚀 Enterprise Monitoring & Analytics'));
      console.log(chalk.blue('='.repeat(50)));

      const monitoringService = new EnterpriseMonitoringService(options.config);

      // Initialize monitoring if requested
      if (options.init) {
        await initializeMonitoring(monitoringService, options.subscription);
        return;
      }

      // Auto-discover applications if requested
      if (options.discover) {
        await discoverApplications(monitoringService);
        return;
      }

      // Generate dashboard if requested
      if (options.dashboard) {
        await generateDashboard(monitoringService);
        return;
      }

      // Load configuration
      let config: MonitoringConfig;
      try {
        config = await monitoringService.loadConfiguration();
      } catch (error) {
        console.log(chalk.yellow('⚠️  No monitoring configuration found.'));
        console.log(chalk.blue('💡 Run: azmp monitor --init to initialize monitoring'));
        return;
      }

      // Run monitoring
      if (options.watch) {
        await runContinuousMonitoring(monitoringService, parseInt(options.interval));
      } else {
        await runSingleMonitoring(monitoringService, options);
      }

    } catch (error) {
      console.error(chalk.red('❌ Monitoring failed:'), error);
      process.exit(1);
    }
  });

async function initializeMonitoring(service: EnterpriseMonitoringService, subscriptionId?: string): Promise<void> {
  console.log(chalk.blue('🔧 Initializing Enterprise Monitoring...'));

  // Get subscription ID if not provided
  if (!subscriptionId) {
    const answers = await inquirer.default.prompt([
      {
        type: 'input',
        name: 'subscriptionId',
        message: 'Enter Azure subscription ID:',
        validate: (input: string) => input.length > 0 || 'Subscription ID is required'
      }
    ]);
    subscriptionId = answers.subscriptionId;
  }

  // Initialize configuration
  const config = await service.initializeMonitoring(subscriptionId!);

  console.log(chalk.green('✅ Monitoring configuration initialized'));
  console.log(chalk.blue('📋 Configuration saved to: monitoring-config.json'));
  
  console.log(chalk.yellow('\n🎯 Next steps:'));
  console.log(chalk.yellow('   1. azmp monitor --discover          # Auto-discover applications'));
  console.log(chalk.yellow('   2. azmp monitor                     # Run monitoring'));
  console.log(chalk.yellow('   3. azmp monitor --dashboard         # Generate dashboard'));
  console.log(chalk.yellow('   4. azmp monitor --watch             # Continuous monitoring'));
}

async function discoverApplications(service: EnterpriseMonitoringService): Promise<void> {
  console.log(chalk.blue('🔍 Discovering Azure applications...'));

  // Load configuration
  const config = await service.loadConfiguration();

  // Discover applications
  const applications = await service.discoverApplications();

  console.log(chalk.green(`✅ Discovered ${applications.length} applications:`));
  
  // Display discovered applications
  for (const app of applications) {
    console.log(chalk.blue(`   📱 ${app.name} (${app.type}) in ${app.resourceGroup}`));
    if (app.endpoints.length > 0) {
      console.log(chalk.gray(`      Endpoints: ${app.endpoints.join(', ')}`));
    }
  }

  // Ask user to add applications to monitoring
  if (applications.length > 0) {
    const answers = await inquirer.default.prompt([
      {
        type: 'checkbox',
        name: 'selectedApps',
        message: 'Select applications to monitor:',
        choices: applications.map((app: ApplicationMonitoring) => ({
          name: `${app.name} (${app.type}) - ${app.resourceGroup}`,
          value: app,
          checked: true
        }))
      }
    ]);

    // Update configuration with selected applications
    config.applications = answers.selectedApps;
    await service.saveConfiguration(config);

    console.log(chalk.green(`✅ Added ${answers.selectedApps.length} applications to monitoring`));
  } else {
    console.log(chalk.yellow('⚠️  No applications found for monitoring'));
  }
}

async function generateDashboard(service: EnterpriseMonitoringService): Promise<void> {
  console.log(chalk.blue('📊 Generating monitoring dashboard...'));

  const dashboardPath = await service.generateDashboard();

  console.log(chalk.green('✅ Dashboard generated successfully'));
  console.log(chalk.blue(`📁 Dashboard location: ${dashboardPath}`));
  console.log(chalk.blue('💡 Open in browser to view monitoring data'));
}

async function runSingleMonitoring(service: EnterpriseMonitoringService, options: any): Promise<void> {
  console.log(chalk.blue('🔍 Running monitoring cycle...'));

  const startTime = Date.now();
  const result = await service.runMonitoring();
  const duration = Date.now() - startTime;

  console.log(chalk.green(`✅ Monitoring completed in ${duration}ms`));
  console.log(chalk.blue('='.repeat(50)));

  // Display results based on options
  if (options.alerts) {
    displayAlerts(result.alerts);
  } else if (options.performance) {
    displayPerformanceReport(result.performance);
  } else if (options.compliance) {
    displayComplianceReport(result.compliance);
  } else if (options.recommendations) {
    displayRecommendations(result.recommendations);
  } else {
    // Display summary
    displayMonitoringSummary(result);
  }

  // Export report if requested
  if (options.export) {
    await exportReport(result, options.export);
  }
}

async function runContinuousMonitoring(service: EnterpriseMonitoringService, intervalMinutes: number): Promise<void> {
  console.log(chalk.blue('🔄 Starting continuous monitoring...'));
  console.log(chalk.blue(`⏱️  Monitoring interval: ${intervalMinutes} minutes`));
  console.log(chalk.gray('Press Ctrl+C to stop monitoring\n'));

  const intervalMs = intervalMinutes * 60 * 1000;
  let cycle = 0;

  while (true) {
    try {
      cycle++;
      const timestamp = new Date().toLocaleString();
      
      console.log(chalk.blue(`\n📊 Monitoring Cycle #${cycle} - ${timestamp}`));
      console.log(chalk.blue('-'.repeat(50)));

      const startTime = Date.now();
      const result = await service.runMonitoring();
      const duration = Date.now() - startTime;

      // Display brief summary
      displayBriefSummary(result, duration);

      // Check for critical alerts
      const criticalAlerts = result.alerts.filter((a: any) => a.severity === 'critical');
      if (criticalAlerts.length > 0) {
        console.log(chalk.red(`\n🚨 CRITICAL ALERTS: ${criticalAlerts.length}`));
        for (const alert of criticalAlerts) {
          console.log(chalk.red(`   ❌ ${alert.title}`));
        }
      }

    } catch (error) {
      console.error(chalk.red(`❌ Monitoring cycle failed: ${error}`));
    }

    // Wait for next cycle
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
}

function displayMonitoringSummary(result: any): void {
  console.log(chalk.blue('📊 MONITORING SUMMARY'));
  console.log(chalk.blue('-'.repeat(30)));

  // Application Status
  console.log(chalk.yellow('\n🎯 Application Status:'));
  const statusCounts = result.applications.reduce((acc: any, app: any) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});

  console.log(chalk.green(`   ✅ Healthy: ${statusCounts.healthy || 0}`));
  console.log(chalk.yellow(`   ⚠️  Warning: ${statusCounts.warning || 0}`));
  console.log(chalk.red(`   ❌ Critical: ${statusCounts.critical || 0}`));
  console.log(chalk.gray(`   ❓ Unknown: ${statusCounts.unknown || 0}`));

  // Alerts
  console.log(chalk.yellow('\n🚨 Active Alerts:'));
  const alertCounts = result.alerts.reduce((acc: any, alert: any) => {
    acc[alert.severity] = (acc[alert.severity] || 0) + 1;
    return acc;
  }, {});

  console.log(chalk.red(`   🔴 Critical: ${alertCounts.critical || 0}`));
  console.log(chalk.yellow(`   🟡 High: ${alertCounts.high || 0}`));
  console.log(chalk.blue(`   🔵 Medium: ${alertCounts.medium || 0}`));
  console.log(chalk.green(`   🟢 Low: ${alertCounts.low || 0}`));

  // Recommendations
  if (result.recommendations.length > 0) {
    console.log(chalk.yellow('\n💡 Top Recommendations:'));
    const topRecommendations = result.recommendations
      .sort((a: any, b: any) => {
        const priorities: { [key: string]: number } = { critical: 4, high: 3, medium: 2, low: 1 };
        return (priorities[b.priority] || 0) - (priorities[a.priority] || 0);
      })
      .slice(0, 3);

    for (const rec of topRecommendations) {
      console.log(chalk.blue(`   📋 ${rec.title}`));
      console.log(chalk.gray(`      ${rec.description}`));
    }
  }

  // Compliance
  if (result.compliance) {
    console.log(chalk.yellow('\n🔒 Compliance Status:'));
    console.log(chalk.blue(`   📊 Overall Score: ${result.compliance.overall.score}/${result.compliance.overall.maxScore} (${result.compliance.overall.grade})`));
    console.log(chalk.blue(`   📈 Percentage: ${result.compliance.overall.percentage}%`));
  }
}

function displayBriefSummary(result: any, duration: number): void {
  const healthy = result.applications.filter((app: any) => app.status === 'healthy').length;
  const total = result.applications.length;
  const criticalAlerts = result.alerts.filter((alert: any) => alert.severity === 'critical').length;

  console.log(chalk.green(`   ✅ ${healthy}/${total} applications healthy`));
  console.log(chalk.yellow(`   🚨 ${result.alerts.length} alerts (${criticalAlerts} critical)`));
  console.log(chalk.blue(`   ⏱️  Completed in ${duration}ms`));
}

function displayAlerts(alerts: any[]): void {
  console.log(chalk.yellow('🚨 ACTIVE ALERTS'));
  console.log(chalk.yellow('-'.repeat(20)));

  if (alerts.length === 0) {
    console.log(chalk.green('✅ No active alerts'));
    return;
  }

  // Group alerts by severity
  const alertsBySeverity = alerts.reduce((acc: any, alert) => {
    if (!acc[alert.severity]) acc[alert.severity] = [];
    acc[alert.severity].push(alert);
    return acc;
  }, {});

  // Display alerts by severity
  for (const severity of ['critical', 'high', 'medium', 'low']) {
    const severityAlerts = alertsBySeverity[severity] || [];
    if (severityAlerts.length === 0) continue;

    const severityColor = severity === 'critical' ? chalk.red :
                         severity === 'high' ? chalk.yellow :
                         severity === 'medium' ? chalk.blue : chalk.green;

    console.log(severityColor(`\n${severity.toUpperCase()} (${severityAlerts.length}):`));
    
    for (const alert of severityAlerts) {
      console.log(severityColor(`   📋 ${alert.title}`));
      console.log(chalk.gray(`      App: ${alert.application}`));
      console.log(chalk.gray(`      Metric: ${alert.metric} = ${alert.value} (threshold: ${alert.threshold})`));
      console.log(chalk.gray(`      Time: ${alert.timestamp.toLocaleString()}`));
    }
  }
}

function displayPerformanceReport(performance: any): void {
  console.log(chalk.blue('📈 PERFORMANCE REPORT'));
  console.log(chalk.blue('-'.repeat(25)));

  if (!performance || performance.applications.length === 0) {
    console.log(chalk.yellow('⚠️  No performance data available'));
    return;
  }

  console.log(chalk.blue(`📊 Report Period: ${performance.period}`));

  // Display application performance
  for (const app of performance.applications) {
    console.log(chalk.yellow(`\n🎯 ${app.name}:`));
    console.log(chalk.blue(`   📊 Availability: ${app.availability}%`));
    console.log(chalk.blue(`   ⏱️  Response Time: ${app.responseTime.average}ms (avg)`));
    console.log(chalk.blue(`   📈 Throughput: ${app.throughput.average} req/min`));
    console.log(chalk.blue(`   ❌ Error Rate: ${app.errorRate.average}%`));
  }

  // Display trends
  if (performance.trends.length > 0) {
    console.log(chalk.yellow('\n📈 Performance Trends:'));
    for (const trend of performance.trends) {
      const trendIcon = trend.trend === 'improving' ? '📈' :
                       trend.trend === 'degrading' ? '📉' : '➡️';
      console.log(chalk.blue(`   ${trendIcon} ${trend.metric}: ${trend.trend} (${trend.change}%)`));
    }
  }
}

function displayComplianceReport(compliance: any): void {
  console.log(chalk.blue('🔒 COMPLIANCE REPORT'));
  console.log(chalk.blue('-'.repeat(25)));

  if (!compliance) {
    console.log(chalk.yellow('⚠️  No compliance data available'));
    return;
  }

  // Overall score
  console.log(chalk.yellow('\n📊 Overall Compliance:'));
  console.log(chalk.blue(`   Score: ${compliance.overall.score}/${compliance.overall.maxScore}`));
  console.log(chalk.blue(`   Percentage: ${compliance.overall.percentage}%`));
  console.log(chalk.blue(`   Grade: ${compliance.overall.grade}`));

  // Categories
  if (compliance.categories.length > 0) {
    console.log(chalk.yellow('\n📋 Categories:'));
    for (const category of compliance.categories) {
      const statusIcon = category.status === 'compliant' ? '✅' :
                        category.status === 'warning' ? '⚠️' : '❌';
      console.log(chalk.blue(`   ${statusIcon} ${category.name}: ${category.score}/${category.maxScore}`));
    }
  }

  // Violations
  if (compliance.violations.length > 0) {
    console.log(chalk.yellow('\n❌ Violations:'));
    for (const violation of compliance.violations.slice(0, 5)) { // Show top 5
      const severityColor = violation.severity === 'critical' ? chalk.red :
                           violation.severity === 'high' ? chalk.yellow :
                           chalk.blue;
      console.log(severityColor(`   📋 ${violation.check} (${violation.severity})`));
      console.log(chalk.gray(`      ${violation.description}`));
    }
  }
}

function displayRecommendations(recommendations: any[]): void {
  console.log(chalk.blue('💡 OPTIMIZATION RECOMMENDATIONS'));
  console.log(chalk.blue('-'.repeat(35)));

  if (recommendations.length === 0) {
    console.log(chalk.green('✅ No recommendations at this time'));
    return;
  }

  // Group by priority
  const recsByPriority = recommendations.reduce((acc: any, rec) => {
    if (!acc[rec.priority]) acc[rec.priority] = [];
    acc[rec.priority].push(rec);
    return acc;
  }, {});

  // Display by priority
  for (const priority of ['critical', 'high', 'medium', 'low']) {
    const priorityRecs = recsByPriority[priority] || [];
    if (priorityRecs.length === 0) continue;

    const priorityColor = priority === 'critical' ? chalk.red :
                         priority === 'high' ? chalk.yellow :
                         priority === 'medium' ? chalk.blue : chalk.green;

    console.log(priorityColor(`\n${priority.toUpperCase()} PRIORITY (${priorityRecs.length}):`));
    
    for (const rec of priorityRecs) {
      console.log(priorityColor(`   📋 ${rec.title}`));
      console.log(chalk.gray(`      ${rec.description}`));
      console.log(chalk.gray(`      Impact: ${rec.impact}`));
      console.log(chalk.gray(`      Effort: ${rec.effort}`));
      if (rec.estimatedSavings) {
        console.log(chalk.green(`      💰 Estimated Savings: ${rec.estimatedSavings}`));
      }
      if (rec.estimatedImprovement) {
        console.log(chalk.blue(`      📈 Estimated Improvement: ${rec.estimatedImprovement}`));
      }
    }
  }
}

async function exportReport(result: any, format: string): Promise<void> {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `monitoring-report-${timestamp}.${format}`;

  try {
    if (format === 'json') {
      await fs.writeFile(filename, JSON.stringify(result, null, 2));
    } else if (format === 'pdf' || format === 'excel') {
      // These would require additional libraries like puppeteer or exceljs
      console.log(chalk.yellow(`⚠️  ${format.toUpperCase()} export not implemented yet`));
      return;
    }

    console.log(chalk.green(`✅ Report exported: ${filename}`));
  } catch (error) {
    console.error(chalk.red(`❌ Export failed: ${error}`));
  }
}