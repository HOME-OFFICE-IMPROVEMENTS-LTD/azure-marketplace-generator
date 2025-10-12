import * as chalk from 'chalk';
import { ComplianceEngine, ComplianceAssessment } from './compliance-engine';
import { PartnerCenterIntegration, PartnerCenterValidationResult } from './partner-center-integration';
import { AzurePricingService, TemplateCostAnalysis } from './azure-pricing-service';
import { EnhancedTemplateGenerator, TemplateValidationResult, EnhancedTemplateConfig } from './enhanced-template-generator';
import { MultiTenantManager, TenantContext, TenantConfiguration } from './multi-tenant-manager';

/**
 * Enterprise Package Service
 *
 * Integrates all enterprise features: compliance checking, Partner Center validation,
 * real cost analysis, enhanced template generation, and multi-tenant support.
 */

export interface EnterprisePackageOptions {
  tenantId?: string;
  enforceCompliance: boolean;
  validatePartnerCenter: boolean;
  calculateRealCosts: boolean;
  useEnhancedGeneration: boolean;
  framework?: 'SOC2' | 'ISO27001' | 'PCI-DSS' | 'NIST';
  region?: string;
  currency?: string;
}

export interface EnterprisePackageResult {
  packagePath: string;
  timestamp: Date;
  tenant?: string;

  // Generation Results
  templateGeneration?: TemplateValidationResult;

  // Validation Results
  complianceAssessment?: ComplianceAssessment;
  partnerCenterValidation?: PartnerCenterValidationResult;

  // Cost Analysis
  costAnalysis?: TemplateCostAnalysis;

  // Overall Status
  readyForProduction: boolean;
  certificationReady: boolean;
  blockingIssues: string[];
  recommendations: string[];

  // Enterprise Metrics
  qualityScore: number;
  securityScore: number;
  complianceScore: number;
  costEfficiency: number;
}

export class EnterprisePackageService {
  private complianceEngine: ComplianceEngine;
  private partnerCenterIntegration: PartnerCenterIntegration;
  private pricingService: AzurePricingService;
  private templateGenerator: EnhancedTemplateGenerator;
  private multiTenantManager: MultiTenantManager;

  constructor() {
    this.complianceEngine = new ComplianceEngine();
    this.partnerCenterIntegration = new PartnerCenterIntegration();
    this.pricingService = new AzurePricingService();
    this.templateGenerator = new EnhancedTemplateGenerator();
    this.multiTenantManager = new MultiTenantManager();
  }

  /**
   * Create enterprise package with full validation and analysis
   */
  async createEnterprisePackage(
    templateConfig: EnhancedTemplateConfig,
    options: EnterprisePackageOptions
  ): Promise<EnterprisePackageResult> {
    console.log(chalk.blue('🏢 Creating enterprise package with full validation...'));

    const result: EnterprisePackageResult = {
      packagePath: '',
      timestamp: new Date(),
      readyForProduction: false,
      certificationReady: false,
      blockingIssues: [],
      recommendations: [],
      qualityScore: 0,
      securityScore: 0,
      complianceScore: 0,
      costEfficiency: 0
    };

    // Step 1: Switch to tenant context if specified
    let tenantContext: TenantContext | null = null;
    if (options.tenantId) {
      try {
        tenantContext = await this.multiTenantManager.switchTenant(options.tenantId);
        result.tenant = options.tenantId;
        console.log(chalk.green(`✅ Switched to tenant: ${tenantContext.tenant.displayName}`));
      } catch (error) {
        result.blockingIssues.push(`Failed to switch to tenant ${options.tenantId}: ${error}`);
        console.error(chalk.red(`❌ Tenant switch failed: ${error}`));
      }
    }

    // Step 2: Generate enhanced template
    if (options.useEnhancedGeneration) {
      try {
        console.log(chalk.yellow('🎨 Generating enhanced template...'));
        result.templateGeneration = await this.templateGenerator.generateEnhancedTemplate(templateConfig);
        result.packagePath = result.templateGeneration.templatePath;

        if (!result.templateGeneration.isValid) {
          result.blockingIssues.push('Template generation validation failed');
        }
      } catch (error) {
        result.blockingIssues.push(`Template generation failed: ${error}`);
        console.error(chalk.red(`❌ Template generation failed: ${error}`));
        return result;
      }
    }

    // Step 3: Partner Center validation
    if (options.validatePartnerCenter && result.packagePath) {
      try {
        console.log(chalk.yellow('🏪 Validating against Partner Center requirements...'));
        result.partnerCenterValidation = await this.partnerCenterIntegration.validatePackage(result.packagePath);

        if (!result.partnerCenterValidation.certificationReady) {
          result.blockingIssues.push(...result.partnerCenterValidation.blockingIssues);
        }

        result.recommendations.push(...result.partnerCenterValidation.recommendations);
      } catch (error) {
        result.blockingIssues.push(`Partner Center validation failed: ${error}`);
        console.error(chalk.red(`❌ Partner Center validation failed: ${error}`));
      }
    }

    // Step 4: Compliance assessment
    if (options.enforceCompliance) {
      try {
        console.log(chalk.yellow('🔍 Performing compliance assessment...'));

        const subscriptionId = tenantContext?.tenant.subscriptionId ||
                              process.env.AZURE_SUBSCRIPTION_ID ||
                              'default-subscription';

        result.complianceAssessment = await this.complianceEngine.assessCompliance(
          subscriptionId,
          undefined,
          options.framework || 'SOC2'
        );

        if (!result.complianceAssessment.certificationReadiness) {
          result.blockingIssues.push('Compliance assessment failed - certification not ready');
        }

        result.recommendations.push(...result.complianceAssessment.recommendations);
      } catch (error) {
        result.blockingIssues.push(`Compliance assessment failed: ${error}`);
        console.error(chalk.red(`❌ Compliance assessment failed: ${error}`));
      }
    }

    // Step 5: Real cost analysis
    if (options.calculateRealCosts && result.packagePath) {
      try {
        console.log(chalk.yellow('💰 Calculating real costs with Azure pricing data...'));

        const region = options.region ||
                      tenantContext?.tenant.defaultRegion ||
                      'eastus';

        const currency = options.currency || 'USD';

        result.costAnalysis = await this.pricingService.analyzeTemplateCosts(
          result.packagePath,
          region,
          currency
        );

        // Add cost efficiency metrics
        result.costEfficiency = this.calculateCostEfficiency(result.costAnalysis);

        if (result.costAnalysis.totalMonthlyCost > 5000) {
          result.recommendations.push('Consider cost optimization strategies for high-cost deployment');
        }
      } catch (error) {
        result.recommendations.push(`Cost analysis partially failed: ${error}`);
        console.warn(chalk.yellow(`⚠️ Cost analysis warning: ${error}`));
      }
    }

    // Step 6: Calculate overall scores
    this.calculateEnterpriseScores(result);

    // Step 7: Determine production readiness
    this.assessProductionReadiness(result);

    // Step 8: Generate final report
    this.printEnterprisePackageReport(result);

    return result;
  }

  /**
   * Validate existing package with enterprise standards
   */
  async validateEnterprisePackage(
    packagePath: string,
    options: EnterprisePackageOptions
  ): Promise<EnterprisePackageResult> {
    console.log(chalk.blue('🔍 Validating existing package with enterprise standards...'));

    const result: EnterprisePackageResult = {
      packagePath,
      timestamp: new Date(),
      readyForProduction: false,
      certificationReady: false,
      blockingIssues: [],
      recommendations: [],
      qualityScore: 0,
      securityScore: 0,
      complianceScore: 0,
      costEfficiency: 0
    };

    // Run all validations in parallel where possible
    const validationPromises = [];

    if (options.validatePartnerCenter) {
      validationPromises.push(
        this.partnerCenterIntegration.validatePackage(packagePath)
          .then(res => { result.partnerCenterValidation = res; })
          .catch(err => result.blockingIssues.push(`Partner Center validation failed: ${err}`))
      );
    }

    if (options.enforceCompliance) {
      const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID || 'default-subscription';
      validationPromises.push(
        this.complianceEngine.assessCompliance(subscriptionId, undefined, options.framework)
          .then(res => { result.complianceAssessment = res; })
          .catch(err => result.blockingIssues.push(`Compliance assessment failed: ${err}`))
      );
    }

    if (options.calculateRealCosts) {
      const region = options.region || 'eastus';
      const currency = options.currency || 'USD';
      validationPromises.push(
        this.pricingService.analyzeTemplateCosts(packagePath, region, currency)
          .then(res => { result.costAnalysis = res; })
          .catch(err => result.recommendations.push(`Cost analysis failed: ${err}`))
      );
    }

    // Wait for all validations to complete
    await Promise.all(validationPromises);

    // Calculate scores and readiness
    this.calculateEnterpriseScores(result);
    this.assessProductionReadiness(result);
    this.printEnterprisePackageReport(result);

    return result;
  }

  /**
   * Initialize enterprise environment for organization
   */
  async initializeEnterprise(tenants: TenantConfiguration[]): Promise<void> {
    console.log(chalk.blue('🏢 Initializing enterprise environment...'));

    // Initialize multi-tenant support
    await this.multiTenantManager.initializeMultiTenant();

    // Register all tenants
    for (const tenant of tenants) {
      try {
        await this.multiTenantManager.registerTenant(tenant);
        console.log(chalk.green(`✅ Registered tenant: ${tenant.displayName}`));
      } catch (error) {
        console.error(chalk.red(`❌ Failed to register tenant ${tenant.displayName}: ${error}`));
      }
    }

    console.log(chalk.green('✅ Enterprise environment initialized successfully'));
  }

  /**
   * Calculate cost efficiency score
   */
  private calculateCostEfficiency(costAnalysis: TemplateCostAnalysis): number {
    if (!costAnalysis) return 0;

    let score = 100;

    // Penalize high costs without optimization opportunities
    const potentialSavings = costAnalysis.optimizationOpportunities
      .reduce((sum, opp) => sum + opp.potentialSavings, 0);

    const savingsPercentage = potentialSavings / costAnalysis.totalMonthlyCost;
    score -= savingsPercentage * 50; // Up to 50 points penalty

    // Bonus for using reserved instances (simulated)
    if (costAnalysis.optimizationOpportunities.some(opp =>
      opp.description.includes('Reserved Instances'))) {
      score += 10;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calculate enterprise scores
   */
  private calculateEnterpriseScores(result: EnterprisePackageResult): void {
    // Quality Score (Template Generation + Partner Center)
    let qualityScore = 0;
    let qualityFactors = 0;

    if (result.templateGeneration) {
      const armTtkScore = result.templateGeneration.armTtkResults.passed /
        (result.templateGeneration.armTtkResults.passed + result.templateGeneration.armTtkResults.failed) * 100;
      qualityScore += armTtkScore;
      qualityFactors++;
    }

    if (result.partnerCenterValidation) {
      const assetScore = result.partnerCenterValidation.assetsValidation.compliant /
        result.partnerCenterValidation.assetsValidation.required * 100;
      const certScore = result.partnerCenterValidation.certificationRequirements.met /
        result.partnerCenterValidation.certificationRequirements.total * 100;
      qualityScore += (assetScore + certScore) / 2;
      qualityFactors++;
    }

    result.qualityScore = qualityFactors > 0 ? Math.round(qualityScore / qualityFactors) : 0;

    // Security Score (Compliance + Template Security)
    let securityScore = 0;
    let securityFactors = 0;

    if (result.complianceAssessment) {
      securityScore += result.complianceAssessment.overallScore;
      securityFactors++;
    }

    if (result.templateGeneration?.customValidation.securityBaseline) {
      securityScore += 90; // High score for security baseline compliance
      securityFactors++;
    }

    result.securityScore = securityFactors > 0 ? Math.round(securityScore / securityFactors) : 0;

    // Compliance Score
    result.complianceScore = result.complianceAssessment?.overallScore || 0;

    // Cost Efficiency Score
    if (result.costAnalysis) {
      result.costEfficiency = this.calculateCostEfficiency(result.costAnalysis);
    }
  }

  /**
   * Assess production readiness
   */
  private assessProductionReadiness(result: EnterprisePackageResult): void {
    // Certification readiness requires all validations to pass
    result.certificationReady =
      result.blockingIssues.length === 0 &&
      (result.complianceAssessment?.certificationReadiness !== false) &&
      (result.partnerCenterValidation?.certificationReady !== false) &&
      (result.templateGeneration?.isValid !== false);

    // Production readiness has lower thresholds
    const minimumQualityScore = 70;
    const minimumSecurityScore = 80;
    const minimumComplianceScore = 75;

    result.readyForProduction =
      result.blockingIssues.length === 0 &&
      result.qualityScore >= minimumQualityScore &&
      result.securityScore >= minimumSecurityScore &&
      result.complianceScore >= minimumComplianceScore;

    // Add specific recommendations
    if (!result.readyForProduction) {
      if (result.qualityScore < minimumQualityScore) {
        result.recommendations.push(`Improve quality score (${result.qualityScore}% < ${minimumQualityScore}%)`);
      }
      if (result.securityScore < minimumSecurityScore) {
        result.recommendations.push(`Improve security score (${result.securityScore}% < ${minimumSecurityScore}%)`);
      }
      if (result.complianceScore < minimumComplianceScore) {
        result.recommendations.push(`Improve compliance score (${result.complianceScore}% < ${minimumComplianceScore}%)`);
      }
    }
  }

  /**
   * Print comprehensive enterprise package report
   */
  private printEnterprisePackageReport(result: EnterprisePackageResult): void {
    console.log(chalk.blue('\n🏢 ENTERPRISE PACKAGE REPORT'));
    console.log(chalk.blue('============================'));

    console.log(chalk.white(`Package: ${result.packagePath}`));
    console.log(chalk.white(`Timestamp: ${result.timestamp.toISOString()}`));
    if (result.tenant) {
      console.log(chalk.white(`Tenant: ${result.tenant}`));
    }

    // Overall Status
    console.log(chalk.white('\n📊 OVERALL STATUS:'));

    if (result.certificationReady) {
      console.log(chalk.green('✅ Certification Ready: YES'));
    } else {
      console.log(chalk.red('❌ Certification Ready: NO'));
    }

    if (result.readyForProduction) {
      console.log(chalk.green('✅ Production Ready: YES'));
    } else {
      console.log(chalk.red('❌ Production Ready: NO'));
    }

    // Enterprise Scores
    console.log(chalk.white('\n📈 ENTERPRISE SCORES:'));
    console.log(chalk.cyan(`  Quality Score: ${result.qualityScore}%`));
    console.log(chalk.cyan(`  Security Score: ${result.securityScore}%`));
    console.log(chalk.cyan(`  Compliance Score: ${result.complianceScore}%`));
    console.log(chalk.cyan(`  Cost Efficiency: ${result.costEfficiency}%`));

    // Cost Summary
    if (result.costAnalysis) {
      console.log(chalk.white('\n💰 COST ANALYSIS:'));
      console.log(chalk.cyan(`  Monthly Cost: $${result.costAnalysis.totalMonthlyCost.toFixed(2)}`));
      console.log(chalk.cyan(`  Daily Cost: $${result.costAnalysis.totalDailyCost.toFixed(2)}`));

      const totalSavings = result.costAnalysis.optimizationOpportunities
        .reduce((sum, opp) => sum + opp.potentialSavings, 0);
      if (totalSavings > 0) {
        console.log(chalk.yellow(`  Potential Savings: $${totalSavings.toFixed(2)}/month`));
      }
    }

    // Blocking Issues
    if (result.blockingIssues.length > 0) {
      console.log(chalk.red('\n🚫 BLOCKING ISSUES:'));
      result.blockingIssues.forEach((issue, i) => {
        console.log(chalk.red(`  ${i + 1}. ${issue}`));
      });
    }

    // Recommendations
    if (result.recommendations.length > 0) {
      console.log(chalk.yellow('\n📋 RECOMMENDATIONS:'));
      const uniqueRecommendations = [...new Set(result.recommendations)];
      uniqueRecommendations.slice(0, 10).forEach((rec, i) => {
        console.log(chalk.yellow(`  ${i + 1}. ${rec}`));
      });

      if (uniqueRecommendations.length > 10) {
        console.log(chalk.gray(`  ... and ${uniqueRecommendations.length - 10} more recommendations`));
      }
    }

    // Next Steps
    console.log(chalk.blue('\n🎯 NEXT STEPS:'));
    if (result.certificationReady) {
      console.log(chalk.green('  ✅ Package is ready for Azure Marketplace submission'));
    } else if (result.readyForProduction) {
      console.log(chalk.yellow('  ⚡ Package is ready for production deployment'));
      console.log(chalk.yellow('  📋 Address remaining items for marketplace certification'));
    } else {
      console.log(chalk.red('  🔧 Address blocking issues and improve scores'));
      console.log(chalk.red('  📊 Review recommendations for guidance'));
    }

    console.log(chalk.gray('\n📧 Enterprise support: enterprise@azmp.com'));
  }
}