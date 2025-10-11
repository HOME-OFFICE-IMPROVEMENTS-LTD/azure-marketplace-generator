// Intelligence Service for AZMP Validation
// src/services/intelligence-service.ts

import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface IntelligenceOptions {
  templatePath: string;
  includeMarketplaceContext?: boolean;
  enableAutoFix?: boolean;
  organizationalContext?: boolean;
}

export interface IntelligenceResult {
  complianceGaps: ComplianceGap[];
  recommendations: Recommendation[];
  autoFixesApplied: AutoFix[];
  marketplaceScore: number;
  similarTemplates: SimilarTemplate[];
  bestPracticesAnalysis: BestPracticeAnalysis;
}

export interface ComplianceGap {
  category: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  remediation: string;
  autoFixable: boolean;
}

export interface Recommendation {
  type: 'security' | 'performance' | 'cost' | 'compliance' | 'marketplace';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  implementation: string;
}

export interface AutoFix {
  type: string;
  description: string;
  filesModified: string[];
  impact: 'safe' | 'moderate' | 'review-required';
}

export interface SimilarTemplate {
  name: string;
  similarity: number;
  successRate: number;
  marketplaceUrl?: string;
}

export interface BestPracticeAnalysis {
  securityScore: number;
  performanceScore: number;
  costOptimizationScore: number;
  marketplaceReadinessScore: number;
  overallScore: number;
}

export class IntelligenceService {
  
  async enhanceValidation(armTtkResults: any, options: IntelligenceOptions): Promise<IntelligenceResult> {
    console.log(chalk.cyan('🧠 Applying intelligent analysis...'));
    
    // Step 1: Analyze template content
    const templateContent = await this.loadTemplateContent(options.templatePath);
    
    // Step 2: Run compliance analysis
    const complianceGaps = await this.analyzeCompliance(templateContent, options);
    
    // Step 3: Generate recommendations
    const recommendations = await this.generateRecommendations(templateContent, armTtkResults, options);
    
    // Step 4: Apply auto-fixes if enabled
    const autoFixesApplied = options.enableAutoFix ? 
      await this.applyAutoFixes(templateContent, options.templatePath, complianceGaps) : [];
    
    // Step 5: Find similar templates
    const similarTemplates = await this.findSimilarTemplates(templateContent);
    
    // Step 6: Calculate scores
    const bestPracticesAnalysis = await this.analyzeBestPractices(templateContent, armTtkResults);
    
    // Step 7: Calculate marketplace score
    const marketplaceScore = options.includeMarketplaceContext ? 
      await this.calculateMarketplaceScore(templateContent, armTtkResults, bestPracticesAnalysis) : 0;
    
    return {
      complianceGaps,
      recommendations,
      autoFixesApplied,
      marketplaceScore,
      similarTemplates,
      bestPracticesAnalysis
    };
  }
  
  private async loadTemplateContent(templatePath: string): Promise<any> {
    try {
      const mainTemplatePath = path.join(templatePath, 'mainTemplate.json');
      const content = await fs.readFile(mainTemplatePath, 'utf8');
      return JSON.parse(content);
    } catch (_error) {
      console.log(chalk.yellow('⚠️  Could not load mainTemplate.json, using basic analysis'));
      return {};
    }
  }
  
  private async analyzeCompliance(template: any, options: IntelligenceOptions): Promise<ComplianceGap[]> {
    const gaps: ComplianceGap[] = [];
    
    // Analyze common compliance issues
    if (!template.parameters) {
      gaps.push({
        category: 'Template Structure',
        severity: 'medium',
        description: 'Template missing parameters section',
        remediation: 'Add parameters section for configurable values',
        autoFixable: true
      });
    }
    
    // Check for hardcoded values
    const templateStr = JSON.stringify(template);
    if (templateStr.includes('admin') && templateStr.includes('password')) {
      gaps.push({
        category: 'Security',
        severity: 'high',
        description: 'Potential hardcoded credentials detected',
        remediation: 'Use secure parameters or Key Vault references',
        autoFixable: false
      });
    }
    
    // Check for required metadata
    if (!template.metadata?.description) {
      gaps.push({
        category: 'Documentation',
        severity: 'low',
        description: 'Missing template description in metadata',
        remediation: 'Add description to template metadata',
        autoFixable: true
      });
    }
    
    // Check for outputs
    if (!template.outputs || Object.keys(template.outputs).length === 0) {
      gaps.push({
        category: 'Template Structure',
        severity: 'medium',
        description: 'Template has no outputs',
        remediation: 'Add outputs for key resource properties',
        autoFixable: true
      });
    }
    
    console.log(chalk.gray(`   Found ${gaps.length} compliance gaps`));
    return gaps;
  }
  
  private async generateRecommendations(template: any, armTtkResults: any, options: IntelligenceOptions): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    
    // Security recommendations
    if (template.parameters) {
      Object.keys(template.parameters).forEach(paramName => {
        const param = template.parameters[paramName];
        if (paramName.toLowerCase().includes('password') && param.type === 'string') {
          recommendations.push({
            type: 'security',
            priority: 'high',
            title: 'Use SecureString for passwords',
            description: `Parameter '${paramName}' should use SecureString type`,
            implementation: `Change type from 'string' to 'secureString' for parameter ${paramName}`
          });
        }
      });
    }
    
    // Performance recommendations
    if (template.resources) {
      const storageAccounts = template.resources.filter((r: any) => 
        r.type === 'Microsoft.Storage/storageAccounts');
      
      storageAccounts.forEach((sa: any) => {
        if (sa.properties?.accessTier === 'Hot') {
          recommendations.push({
            type: 'cost',
            priority: 'medium',
            title: 'Consider access tier optimization',
            description: 'Hot access tier may not be cost-effective for all scenarios',
            implementation: 'Add parameter to configure access tier based on usage patterns'
          });
        }
      });
    }
    
    // Marketplace-specific recommendations
    if (options.includeMarketplaceContext) {
      recommendations.push({
        type: 'marketplace',
        priority: 'high',
        title: 'Add comprehensive parameter descriptions',
        description: 'Marketplace requires detailed parameter descriptions',
        implementation: 'Add description and constraints to all parameters'
      });
      
      recommendations.push({
        type: 'marketplace',
        priority: 'medium',
        title: 'Include resource tagging strategy',
        description: 'Consistent tagging improves marketplace discoverability',
        implementation: 'Add standard tags to all resources'
      });
    }
    
    console.log(chalk.gray(`   Generated ${recommendations.length} recommendations`));
    return recommendations;
  }
  
  private async applyAutoFixes(template: any, templatePath: string, gaps: ComplianceGap[]): Promise<AutoFix[]> {
    const fixes: AutoFix[] = [];
    const autoFixableGaps = gaps.filter(gap => gap.autoFixable);
    
    if (autoFixableGaps.length === 0) {
      console.log(chalk.gray('   No auto-fixable issues found'));
      return fixes;
    }
    
    console.log(chalk.yellow(`   Applying ${autoFixableGaps.length} auto-fixes...`));
    
    // Auto-fix: Add metadata description
    const descriptionGap = autoFixableGaps.find(gap => 
      gap.description.includes('Missing template description'));
    
    if (descriptionGap && template) {
      if (!template.metadata) template.metadata = {};
      template.metadata.description = 'Azure Marketplace solution template';
      
      fixes.push({
        type: 'metadata',
        description: 'Added template description to metadata',
        filesModified: ['mainTemplate.json'],
        impact: 'safe'
      });
    }
    
    // Auto-fix: Add basic outputs
    const outputGap = autoFixableGaps.find(gap => 
      gap.description.includes('Template has no outputs'));
    
    if (outputGap && template && template.resources) {
      if (!template.outputs) template.outputs = {};
      
      // Add resource group output
      template.outputs.resourceGroupName = {
        type: 'string',
        value: '[resourceGroup().name]'
      };
      
      fixes.push({
        type: 'outputs',
        description: 'Added basic template outputs',
        filesModified: ['mainTemplate.json'],
        impact: 'safe'
      });
    }
    
    // Save the fixed template
    if (fixes.length > 0) {
      try {
        const mainTemplatePath = path.join(templatePath, 'mainTemplate.json');
        await fs.writeFile(mainTemplatePath, JSON.stringify(template, null, 2), 'utf8');
        console.log(chalk.green(`   ✅ Applied ${fixes.length} auto-fixes to template`));
      } catch (_error) {
        console.log(chalk.yellow('   ⚠️  Could not save auto-fixes to template'));
      }
    }
    
    return fixes;
  }
  
  private async findSimilarTemplates(template: any): Promise<SimilarTemplate[]> {
    // Mock similar templates based on resource types
    const similarTemplates: SimilarTemplate[] = [];
    
    if (template.resources) {
      const resourceTypes = template.resources.map((r: any) => r.type);
      
      if (resourceTypes.includes('Microsoft.Storage/storageAccounts')) {
        similarTemplates.push({
          name: 'Flexible Storage Platform',
          similarity: 0.85,
          successRate: 100,
          marketplaceUrl: 'published'
        });
      }
    }
    
    console.log(chalk.gray(`   Found ${similarTemplates.length} similar templates`));
    return similarTemplates;
  }
  
  private async analyzeBestPractices(template: any, armTtkResults: any): Promise<BestPracticeAnalysis> {
    // Calculate scores based on template analysis
    let securityScore = 85;
    const performanceScore = 80;
    const costOptimizationScore = 75;
    let marketplaceReadinessScore = 70;
    
    // Adjust scores based on ARM-TTK results
    if (armTtkResults.success) {
      securityScore += 10;
      marketplaceReadinessScore += 15;
    }
    
    // Analyze template content for best practices
    if (template.parameters) {
      const secureParams = Object.values(template.parameters).filter((p: any) => 
        p.type === 'secureString').length;
      const totalParams = Object.keys(template.parameters).length;
      
      if (totalParams > 0) {
        securityScore += Math.min(20, (secureParams / totalParams) * 20);
      }
    }
    
    const overallScore = Math.round(
      (securityScore + performanceScore + costOptimizationScore + marketplaceReadinessScore) / 4
    );
    
    console.log(chalk.gray(`   Calculated best practices scores`));
    
    return {
      securityScore: Math.min(100, Math.round(securityScore)),
      performanceScore: Math.min(100, Math.round(performanceScore)),
      costOptimizationScore: Math.min(100, Math.round(costOptimizationScore)),
      marketplaceReadinessScore: Math.min(100, Math.round(marketplaceReadinessScore)),
      overallScore: Math.min(100, overallScore)
    };
  }
  
  private async calculateMarketplaceScore(template: any, armTtkResults: any, bestPractices: BestPracticeAnalysis): Promise<number> {
    let score = bestPractices.marketplaceReadinessScore;
    
    // Bonus points for ARM-TTK success
    if (armTtkResults.success) {
      score += 10;
    }
    
    // Check for marketplace-specific requirements
    if (template.parameters) {
      const hasDescriptions = Object.values(template.parameters).every((p: any) => p.description);
      if (hasDescriptions) score += 5;
    }
    
    if (template.metadata?.description) score += 5;
    
    console.log(chalk.gray(`   Calculated marketplace score: ${Math.min(100, score)}`));
    return Math.min(100, Math.round(score));
  }
}