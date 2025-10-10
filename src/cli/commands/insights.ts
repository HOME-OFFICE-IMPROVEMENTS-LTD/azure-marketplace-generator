import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs/promises';
import { AIAnalyticsService, AIAnalyticsResult } from '../../services/ai-analytics-service';
import { EnterpriseMonitoringService } from '../../services/enterprise-monitoring-service';

export const insightsCommand = new Command('insights')
  .description('AI-powered analytics and insights for Azure applications')
  .option('-c, --config <path>', 'Path to AI analytics configuration file')
  .option('--init', 'Initialize AI analytics configuration')
  .option('--load-models', 'Load AI models for analysis')
  .option('--predictions', 'Show AI predictions only')
  .option('--optimizations', 'Show optimization recommendations only')
  .option('--anomalies', 'Show detected anomalies only')
  .option('--market', 'Show market intelligence only')
  .option('--export <format>', 'Export insights report (json|pdf)', 'json')
  .option('--model <name>', 'Use specific AI model for analysis')
  .option('--confidence <threshold>', 'Minimum confidence threshold (0.0-1.0)', '0.7')
  .option('--real-time', 'Real-time AI insights with monitoring data')
  .action(async (options) => {
    try {
      console.log(chalk.blue.bold('🧠 AI-Powered Analytics & Insights'));
      console.log(chalk.blue('='.repeat(50)));

      const aiService = new AIAnalyticsService(options.config);

      // Initialize AI analytics if requested
      if (options.init) {
        await initializeAIAnalytics(aiService);
        return;
      }

      // Load models if requested
      if (options.loadModels) {
        await loadAIModels(aiService);
        return;
      }

      // Load configuration
      let config;
      try {
        config = await aiService.loadConfiguration();
      } catch (error) {
        console.log(chalk.yellow('⚠️  No AI analytics configuration found.'));
        console.log(chalk.blue('💡 Run: azmp insights --init to initialize AI analytics'));
        return;
      }

      // Get monitoring data for AI analysis
      let monitoringData = {};
      if (options.realTime) {
        monitoringData = await getMonitoringData();
      } else {
        // Use sample data for demonstration
        monitoringData = await getSampleMonitoringData();
      }

      // Run AI analytics
      const result = await runAIAnalytics(aiService, monitoringData, options);

      // Display results based on options
      if (options.predictions) {
        displayPredictions(result.predictions, parseFloat(options.confidence));
      } else if (options.optimizations) {
        displayOptimizations(result.optimizations);
      } else if (options.anomalies) {
        displayAnomalies(result.anomalies);
      } else if (options.market) {
        displayMarketIntelligence(result.marketIntelligence);
      } else {
        // Display comprehensive insights
        displayInsightsSummary(result, parseFloat(options.confidence));
      }

      // Export report if requested
      if (options.export) {
        await exportInsights(aiService, result, options.export);
      }

    } catch (error) {
      console.error(chalk.red('❌ AI insights failed:'), error);
      process.exit(1);
    }
  });

async function initializeAIAnalytics(service: AIAnalyticsService): Promise<void> {
  console.log(chalk.blue('🤖 Initializing AI Analytics...'));

  const config = await service.initializeAIAnalytics();

  console.log(chalk.green('✅ AI analytics configuration initialized'));
  console.log(chalk.blue('📋 Configuration saved to: ai-analytics-config.json'));
  
  console.log(chalk.yellow('\n🎯 AI Models Available:'));
  for (const model of config.models) {
    console.log(chalk.blue(`   🧠 ${model.name} (${model.type})`));
  }

  console.log(chalk.yellow('\n📊 Insights Enabled:'));
  for (const insight of config.insights) {
    if (insight.enabled) {
      console.log(chalk.blue(`   📈 ${insight.type} - ${insight.schedule}`));
    }
  }
  
  console.log(chalk.yellow('\n🎯 Next steps:'));
  console.log(chalk.yellow('   1. azmp insights --load-models       # Load AI models'));
  console.log(chalk.yellow('   2. azmp insights                     # Run AI analysis'));
  console.log(chalk.yellow('   3. azmp insights --real-time         # Real-time insights'));
  console.log(chalk.yellow('   4. azmp insights --predictions       # AI predictions'));
}

async function loadAIModels(service: AIAnalyticsService): Promise<void> {
  console.log(chalk.blue('🚀 Loading AI models...'));

  await service.loadAIModels();

  console.log(chalk.green('✅ AI models loaded and ready for analysis'));
  console.log(chalk.blue('💡 You can now run: azmp insights to get AI-powered insights'));
}

async function getMonitoringData(): Promise<any> {
  try {
    // Try to get real monitoring data
    const monitoringService = new EnterpriseMonitoringService();
    const config = await monitoringService.loadConfiguration();
    const result = await monitoringService.runMonitoring();
    return result;
  } catch (error) {
    console.log(chalk.yellow('⚠️  No monitoring data available, using sample data'));
    return getSampleMonitoringData();
  }
}

async function getSampleMonitoringData(): Promise<any> {
  // Sample monitoring data for AI analysis
  return {
    timestamp: new Date(),
    applications: [
      {
        name: 'webapp-prod',
        status: 'healthy',
        metrics: [
          { name: 'CPU Percentage', value: 45, unit: '%', status: 'normal' },
          { name: 'Memory Percentage', value: 62, unit: '%', status: 'normal' },
          { name: 'Request Count', value: 1250, unit: 'req/min', status: 'normal' },
          { name: 'Response Time', value: 180, unit: 'ms', status: 'normal' }
        ],
        uptime: 99.8
      },
      {
        name: 'api-service',
        status: 'warning',
        metrics: [
          { name: 'CPU Percentage', value: 78, unit: '%', status: 'warning' },
          { name: 'Memory Percentage', value: 85, unit: '%', status: 'warning' },
          { name: 'Request Count', value: 890, unit: 'req/min', status: 'normal' },
          { name: 'Response Time', value: 320, unit: 'ms', status: 'warning' }
        ],
        uptime: 99.2
      },
      {
        name: 'background-processor',
        status: 'critical',
        metrics: [
          { name: 'CPU Percentage', value: 95, unit: '%', status: 'critical' },
          { name: 'Memory Percentage', value: 92, unit: '%', status: 'critical' },
          { name: 'Request Count', value: 45, unit: 'req/min', status: 'normal' },
          { name: 'Response Time', value: 850, unit: 'ms', status: 'critical' }
        ],
        uptime: 97.5
      }
    ],
    alerts: [
      {
        severity: 'high',
        title: 'High CPU Usage',
        application: 'background-processor',
        metric: 'CPU Percentage',
        value: 95,
        threshold: 90
      }
    ],
    performance: {
      period: 'last-24h',
      applications: [],
      trends: [],
      benchmarks: []
    },
    compliance: {
      overall: { score: 82, maxScore: 100, percentage: 82, grade: 'B' }
    }
  };
}

async function runAIAnalytics(
  service: AIAnalyticsService,
  monitoringData: any,
  options: any
): Promise<AIAnalyticsResult> {
  console.log(chalk.blue('🧠 Running AI analytics...'));

  const startTime = Date.now();
  const result = await service.runAIAnalytics(monitoringData);
  const duration = Date.now() - startTime;

  console.log(chalk.green(`✅ AI analysis completed in ${duration}ms`));
  console.log(chalk.blue('='.repeat(50)));

  return result;
}

function displayInsightsSummary(result: AIAnalyticsResult, confidenceThreshold: number): void {
  console.log(chalk.blue('🧠 AI INSIGHTS SUMMARY'));
  console.log(chalk.blue('-'.repeat(30)));

  // Filter by confidence threshold
  const highConfidenceInsights = result.insights.filter(i => i.confidence >= confidenceThreshold);
  const highConfidencePredictions = result.predictions.filter(p => p.confidence >= confidenceThreshold);

  // Key metrics
  console.log(chalk.yellow('\n📊 Analysis Overview:'));
  console.log(chalk.blue(`   🧠 Total Insights: ${result.insights.length} (${highConfidenceInsights.length} high confidence)`));
  console.log(chalk.blue(`   🔮 Predictions: ${result.predictions.length} (${highConfidencePredictions.length} high confidence)`));
  console.log(chalk.blue(`   ⚡ Optimizations: ${result.optimizations.length}`));
  console.log(chalk.blue(`   🚨 Anomalies: ${result.anomalies.length}`));
  console.log(chalk.blue(`   💡 Recommendations: ${result.recommendations.length}`));

  // Top insights
  if (highConfidenceInsights.length > 0) {
    console.log(chalk.yellow('\n🎯 Key Insights:'));
    for (const insight of highConfidenceInsights.slice(0, 3)) {
      const impactColor = insight.impact === 'critical' ? chalk.red :
                         insight.impact === 'high' ? chalk.yellow :
                         insight.impact === 'medium' ? chalk.blue : chalk.green;
      
      console.log(impactColor(`   📋 ${insight.title}`));
      console.log(chalk.gray(`      ${insight.description}`));
      console.log(chalk.gray(`      Confidence: ${Math.round(insight.confidence * 100)}% | Impact: ${insight.impact}`));
    }
  }

  // Top predictions
  if (highConfidencePredictions.length > 0) {
    console.log(chalk.yellow('\n🔮 Key Predictions:'));
    for (const prediction of highConfidencePredictions.slice(0, 2)) {
      console.log(chalk.blue(`   📈 ${prediction.type.toUpperCase()} (${prediction.timeframe})`));
      console.log(chalk.gray(`      Confidence: ${Math.round(prediction.confidence * 100)}%`));
      
      if (typeof prediction.prediction === 'object') {
        const pred = prediction.prediction as any;
        if (pred.trend) {
          console.log(chalk.gray(`      Trend: ${pred.trend}`));
        }
      }
    }
  }

  // Critical anomalies
  const criticalAnomalies = result.anomalies.filter(a => a.severity === 'critical' || a.severity === 'high');
  if (criticalAnomalies.length > 0) {
    console.log(chalk.yellow('\n🚨 Critical Anomalies:'));
    for (const anomaly of criticalAnomalies) {
      const severityColor = anomaly.severity === 'critical' ? chalk.red : chalk.yellow;
      console.log(severityColor(`   ⚠️  ${anomaly.description}`));
      console.log(chalk.gray(`      Affected: ${anomaly.affectedResources.join(', ')}`));
      console.log(chalk.gray(`      Confidence: ${Math.round(anomaly.confidence * 100)}%`));
    }
  }

  // Top recommendations
  const topRecommendations = result.recommendations
    .filter(r => r.confidence >= confidenceThreshold)
    .sort((a, b) => {
      const priorities: { [key: string]: number } = { critical: 4, high: 3, medium: 2, low: 1 };
      return (priorities[b.priority] || 0) - (priorities[a.priority] || 0);
    })
    .slice(0, 3);

  if (topRecommendations.length > 0) {
    console.log(chalk.yellow('\n💡 Top AI Recommendations:'));
    for (const rec of topRecommendations) {
      const priorityColor = rec.priority === 'critical' ? chalk.red :
                           rec.priority === 'high' ? chalk.yellow :
                           rec.priority === 'medium' ? chalk.blue : chalk.green;
      
      console.log(priorityColor(`   📋 ${rec.title}`));
      console.log(chalk.gray(`      ${rec.description}`));
      console.log(chalk.gray(`      Expected: ${rec.expectedOutcome}`));
      console.log(chalk.gray(`      Confidence: ${Math.round(rec.confidence * 100)}% | Effort: ${rec.effort} | Timeline: ${rec.timeline}`));
    }
  }
}

function displayPredictions(predictions: any[], confidenceThreshold: number): void {
  console.log(chalk.blue('🔮 AI PREDICTIONS'));
  console.log(chalk.blue('-'.repeat(20)));

  const filteredPredictions = predictions.filter(p => p.confidence >= confidenceThreshold);

  if (filteredPredictions.length === 0) {
    console.log(chalk.yellow(`⚠️  No predictions meet confidence threshold of ${confidenceThreshold}`));
    return;
  }

  for (const prediction of filteredPredictions) {
    console.log(chalk.yellow(`\n📈 ${prediction.type.toUpperCase()} PREDICTION`));
    console.log(chalk.blue(`   ⏱️  Timeframe: ${prediction.timeframe}`));
    console.log(chalk.blue(`   🎯 Confidence: ${Math.round(prediction.confidence * 100)}%`));
    
    // Display prediction details
    if (typeof prediction.prediction === 'object') {
      const pred = prediction.prediction as any;
      for (const [key, value] of Object.entries(pred)) {
        if (typeof value === 'object') {
          console.log(chalk.blue(`   📊 ${key}:`));
          for (const [subKey, subValue] of Object.entries(value as any)) {
            console.log(chalk.gray(`      ${subKey}: ${subValue}`));
          }
        } else {
          console.log(chalk.blue(`   📊 ${key}: ${value}`));
        }
      }
    } else {
      console.log(chalk.blue(`   📊 Value: ${prediction.prediction}`));
    }

    // Display factors
    if (prediction.factors.length > 0) {
      console.log(chalk.yellow('   🧮 Influencing Factors:'));
      for (const factor of prediction.factors) {
        const trendIcon = factor.trend === 'positive' ? '📈' :
                         factor.trend === 'negative' ? '📉' : '➡️';
        console.log(chalk.gray(`      ${trendIcon} ${factor.name} (${Math.round(factor.influence * 100)}%): ${factor.description}`));
      }
    }

    // Display recommendations
    if (prediction.recommendations.length > 0) {
      console.log(chalk.yellow('   💡 Recommendations:'));
      for (const rec of prediction.recommendations) {
        console.log(chalk.gray(`      • ${rec}`));
      }
    }
  }
}

function displayOptimizations(optimizations: any[]): void {
  console.log(chalk.blue('⚡ AI OPTIMIZATIONS'));
  console.log(chalk.blue('-'.repeat(25)));

  if (optimizations.length === 0) {
    console.log(chalk.green('✅ No optimization opportunities identified'));
    return;
  }

  for (const opt of optimizations) {
    console.log(chalk.yellow(`\n🚀 ${opt.strategy.toUpperCase()} OPTIMIZATION`));
    console.log(chalk.blue(`   🎯 Type: ${opt.type}`));
    
    // Display benefits
    console.log(chalk.yellow('   💰 Expected Benefits:'));
    if (opt.expectedBenefit.costSaving) {
      console.log(chalk.green(`      💵 Cost Saving: $${opt.expectedBenefit.costSaving}/month`));
    }
    if (opt.expectedBenefit.performanceImprovement) {
      console.log(chalk.blue(`      ⚡ Performance: ${opt.expectedBenefit.performanceImprovement}% improvement`));
    }
    console.log(chalk.gray(`      ⏱️  Timeframe: ${opt.expectedBenefit.timeframe}`));

    // Display current vs optimized state
    console.log(chalk.yellow('   📊 Current → Optimized:'));
    for (const [key, currentValue] of Object.entries(opt.currentState)) {
      const optimizedValue = opt.optimizedState[key];
      if (optimizedValue !== undefined) {
        console.log(chalk.gray(`      ${key}: ${currentValue} → ${optimizedValue}`));
      }
    }

    // Display implementation plan
    if (opt.implementationPlan.length > 0) {
      console.log(chalk.yellow('   📋 Implementation Plan:'));
      for (const step of opt.implementationPlan) {
        const effortColor = step.effort === 'high' ? chalk.red :
                          step.effort === 'medium' ? chalk.yellow : chalk.green;
        console.log(effortColor(`      ${step.order}. ${step.description}`));
        console.log(chalk.gray(`         Effort: ${step.effort} | Duration: ${step.duration}`));
      }
    }

    // Display risks
    if (opt.risks.length > 0) {
      console.log(chalk.yellow('   ⚠️  Risks:'));
      for (const risk of opt.risks) {
        const severityColor = risk.severity === 'high' ? chalk.red :
                             risk.severity === 'medium' ? chalk.yellow : chalk.green;
        console.log(severityColor(`      📋 ${risk.description}`));
        console.log(chalk.gray(`         Probability: ${Math.round(risk.probability * 100)}% | Mitigation: ${risk.mitigation}`));
      }
    }
  }
}

function displayAnomalies(anomalies: any[]): void {
  console.log(chalk.blue('🚨 AI ANOMALY DETECTION'));
  console.log(chalk.blue('-'.repeat(30)));

  if (anomalies.length === 0) {
    console.log(chalk.green('✅ No anomalies detected'));
    return;
  }

  // Group by severity
  const anomaliesBySeverity = anomalies.reduce((acc: any, anomaly) => {
    if (!acc[anomaly.severity]) acc[anomaly.severity] = [];
    acc[anomaly.severity].push(anomaly);
    return acc;
  }, {});

  for (const severity of ['critical', 'high', 'medium', 'low']) {
    const severityAnomalies = anomaliesBySeverity[severity] || [];
    if (severityAnomalies.length === 0) continue;

    const severityColor = severity === 'critical' ? chalk.red :
                         severity === 'high' ? chalk.yellow :
                         severity === 'medium' ? chalk.blue : chalk.green;

    console.log(severityColor(`\n${severity.toUpperCase()} ANOMALIES (${severityAnomalies.length}):`));
    
    for (const anomaly of severityAnomalies) {
      console.log(severityColor(`   📋 ${anomaly.description}`));
      console.log(chalk.gray(`      Type: ${anomaly.type}`));
      console.log(chalk.gray(`      Affected: ${anomaly.affectedResources.join(', ')}`));
      console.log(chalk.gray(`      Detected: ${anomaly.detectedAt.toLocaleString()}`));
      console.log(chalk.gray(`      Confidence: ${Math.round(anomaly.confidence * 100)}%`));
      
      if (anomaly.rootCause) {
        console.log(chalk.gray(`      Root Cause: ${anomaly.rootCause}`));
      }
      
      if (anomaly.remediation) {
        console.log(chalk.yellow('      🔧 Remediation:'));
        for (const step of anomaly.remediation) {
          console.log(chalk.gray(`         • ${step}`));
        }
      }
    }
  }
}

function displayMarketIntelligence(market: any): void {
  console.log(chalk.blue('📈 MARKET INTELLIGENCE'));
  console.log(chalk.blue('-'.repeat(30)));

  // Market trends
  if (market.trends.length > 0) {
    console.log(chalk.yellow('\n📊 Market Trends:'));
    for (const trend of market.trends) {
      const trendIcon = trend.trend === 'rising' ? '📈' :
                       trend.trend === 'declining' ? '📉' :
                       trend.trend === 'emerging' ? '🚀' : '➡️';
      const impactColor = trend.impact === 'high' ? chalk.red :
                         trend.impact === 'medium' ? chalk.yellow : chalk.green;
      
      console.log(impactColor(`   ${trendIcon} ${trend.category}: ${trend.description}`));
      console.log(chalk.gray(`      Impact: ${trend.impact} | Timeframe: ${trend.timeframe} | Confidence: ${Math.round(trend.confidence * 100)}%`));
    }
  }

  // Market opportunities
  if (market.opportunities.length > 0) {
    console.log(chalk.yellow('\n🎯 Market Opportunities:'));
    for (const opp of market.opportunities) {
      console.log(chalk.blue(`   💡 ${opp.type}: ${opp.description}`));
      console.log(chalk.gray(`      Market Size: $${(opp.marketSize / 1e9).toFixed(1)}B | Competition: ${opp.competition}`));
      console.log(chalk.gray(`      Timeline: ${opp.timeline} | Confidence: ${Math.round(opp.confidence * 100)}%`));
      
      if (opp.requirements.length > 0) {
        console.log(chalk.gray(`      Requirements: ${opp.requirements.join(', ')}`));
      }
    }
  }

  // Competitive analysis
  console.log(chalk.yellow('\n🏆 Competitive Position:'));
  console.log(chalk.blue(`   📊 Position: ${market.competitive.position}`));
  
  if (market.competitive.strengths.length > 0) {
    console.log(chalk.green('   ✅ Strengths:'));
    for (const strength of market.competitive.strengths) {
      console.log(chalk.gray(`      • ${strength}`));
    }
  }
  
  if (market.competitive.opportunities.length > 0) {
    console.log(chalk.blue('   🎯 Opportunities:'));
    for (const opportunity of market.competitive.opportunities) {
      console.log(chalk.gray(`      • ${opportunity}`));
    }
  }

  // Benchmarks
  if (market.benchmarks.length > 0) {
    console.log(chalk.yellow('\n📊 Performance Benchmarks:'));
    for (const benchmark of market.benchmarks) {
      const trendIcon = benchmark.trend === 'improving' ? '📈' :
                       benchmark.trend === 'declining' ? '📉' : '➡️';
      const percentileColor = benchmark.percentile >= 80 ? chalk.green :
                             benchmark.percentile >= 60 ? chalk.blue :
                             benchmark.percentile >= 40 ? chalk.yellow : chalk.red;
      
      console.log(percentileColor(`   ${trendIcon} ${benchmark.metric}: ${benchmark.value} (${benchmark.percentile}th percentile)`));
      console.log(chalk.gray(`      Industry Average: ${benchmark.industry}`));
    }
  }
}

async function exportInsights(service: AIAnalyticsService, result: AIAnalyticsResult, format: string): Promise<void> {
  try {
    if (format === 'json') {
      const reportPath = await service.generateAIReport(result);
      console.log(chalk.green(`✅ AI insights exported: ${reportPath}`));
    } else if (format === 'pdf') {
      console.log(chalk.yellow('⚠️  PDF export not implemented yet'));
    } else {
      console.log(chalk.red(`❌ Unsupported export format: ${format}`));
    }
  } catch (error) {
    console.error(chalk.red(`❌ Export failed: ${error}`));
  }
}