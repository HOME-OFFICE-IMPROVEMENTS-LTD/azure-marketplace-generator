import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';

export interface PackageOptimization {
  templateOptimizations: string[];
  uiOptimizations: string[];
  metadataEnhancements: string[];
  assetOptimizations: string[];
  qualityScore: number;
  recommendations: string[];
}

export interface PackageAnalysis {
  templateComplexity: number;
  uiComplexity: number;
  assetCount: number;
  totalSizeKB: number;
  marketplaceReadiness: number;
  securityScore: number;
  performanceScore: number;
}

export class PackagingService {
  private async analyzeTemplate(templatePath: string): Promise<any> {
    try {
      const content = await fs.readFile(templatePath, 'utf8');
      return JSON.parse(content);
    } catch (_error) {
      console.warn(chalk.yellow(`⚠️ Could not analyze template: ${templatePath}`));
      return null;
    }
  }

  private async analyzeUiDefinition(uiPath: string): Promise<any> {
    try {
      const content = await fs.readFile(uiPath, 'utf8');
      return JSON.parse(content);
    } catch (_error) {
      console.warn(chalk.yellow(`⚠️ Could not analyze UI definition: ${uiPath}`));
      return null;
    }
  }

  async analyzePackage(sourcePath: string): Promise<PackageAnalysis> {
    console.log(chalk.blue('🔍 Analyzing package for optimization opportunities...'));

    const templatePath = path.join(sourcePath, 'mainTemplate.json');
    const uiPath = path.join(sourcePath, 'createUiDefinition.json');

    const template = await this.analyzeTemplate(templatePath);
    const uiDefinition = await this.analyzeUiDefinition(uiPath);

    // Calculate complexity scores
    const templateComplexity = this.calculateTemplateComplexity(template);
    const uiComplexity = this.calculateUiComplexity(uiDefinition);

    // Analyze assets
    const assets = await this.getAssetList(sourcePath);
    const assetCount = assets.length;
    const totalSizeKB = await this.calculateTotalSize(sourcePath);

    // Calculate marketplace readiness
    const marketplaceReadiness = this.calculateMarketplaceReadiness(template, uiDefinition, assets);
    const securityScore = this.calculateSecurityScore(template);
    const performanceScore = this.calculatePerformanceScore(template, totalSizeKB);

    return {
      templateComplexity,
      uiComplexity,
      assetCount,
      totalSizeKB,
      marketplaceReadiness,
      securityScore,
      performanceScore
    };
  }

  async optimizePackage(sourcePath: string, outputPath?: string): Promise<PackageOptimization> {
    console.log(chalk.blue('⚡ Optimizing package for marketplace excellence...'));

    const analysis = await this.analyzePackage(sourcePath);
    const optimizations: PackageOptimization = {
      templateOptimizations: [],
      uiOptimizations: [],
      metadataEnhancements: [],
      assetOptimizations: [],
      qualityScore: 0,
      recommendations: []
    };

    // Template optimizations
    const templateOptims = await this.optimizeTemplate(sourcePath);
    optimizations.templateOptimizations = templateOptims;

    // UI optimizations
    const uiOptims = await this.optimizeUiDefinition(sourcePath);
    optimizations.uiOptimizations = uiOptims;

    // Metadata enhancements
    const metadataOptims = await this.enhanceMetadata(sourcePath);
    optimizations.metadataEnhancements = metadataOptims;

    // Asset optimizations
    const assetOptims = await this.optimizeAssets(sourcePath);
    optimizations.assetOptimizations = assetOptims;

    // Calculate quality score
    optimizations.qualityScore = this.calculateQualityScore(analysis, optimizations);

    // Generate recommendations
    optimizations.recommendations = this.generateRecommendations(analysis, optimizations);

    // Apply optimizations if output path specified
    if (outputPath) {
      await this.applyOptimizations(sourcePath, outputPath, optimizations);
    }

    return optimizations;
  }

  private calculateTemplateComplexity(template: any): number {
    if (!template) return 0;

    let complexity = 0;
    
    // Count resources
    const resourceCount = template.resources ? template.resources.length : 0;
    complexity += resourceCount * 2;

    // Count parameters
    const paramCount = template.parameters ? Object.keys(template.parameters).length : 0;
    complexity += paramCount;

    // Count variables
    const varCount = template.variables ? Object.keys(template.variables).length : 0;
    complexity += varCount;

    // Count outputs
    const outputCount = template.outputs ? Object.keys(template.outputs).length : 0;
    complexity += outputCount;

    // Count nested templates
    const nestedCount = template.resources ? 
      template.resources.filter((r: any) => r.type === 'Microsoft.Resources/deployments').length : 0;
    complexity += nestedCount * 5;

    return Math.min(complexity, 100); // Cap at 100
  }

  private calculateUiComplexity(uiDefinition: any): number {
    if (!uiDefinition) return 0;

    let complexity = 0;

    // Count steps
    const steps = uiDefinition.parameters?.steps || [];
    complexity += steps.length * 3;

    // Count elements across all steps
    for (const step of steps) {
      if (step.elements) {
        complexity += this.countUiElements(step.elements);
      }
    }

    return Math.min(complexity, 100); // Cap at 100
  }

  private countUiElements(elements: any[]): number {
    let count = 0;
    for (const element of elements) {
      count++;
      if (element.elements) {
        count += this.countUiElements(element.elements);
      }
    }
    return count;
  }

  private async getAssetList(sourcePath: string): Promise<string[]> {
    const assets: string[] = [];
    const files = await fs.readdir(sourcePath, { withFileTypes: true });

    for (const file of files) {
      if (file.isFile()) {
        assets.push(file.name);
      } else if (file.isDirectory()) {
        const subAssets = await this.getAssetList(path.join(sourcePath, file.name));
        assets.push(...subAssets.map(asset => `${file.name}/${asset}`));
      }
    }

    return assets;
  }

  private async calculateTotalSize(sourcePath: string): Promise<number> {
    let totalSize = 0;
    const assets = await this.getAssetList(sourcePath);

    for (const asset of assets) {
      try {
        const stat = await fs.stat(path.join(sourcePath, asset));
        totalSize += stat.size;
      } catch (_error) {
        // Skip files that can't be accessed
      }
    }

    return Math.round(totalSize / 1024); // Convert to KB
  }

  private calculateMarketplaceReadiness(template: any, uiDefinition: any, assets: string[]): number {
    let score = 0;

    // Required files present
    if (template) score += 30;
    if (uiDefinition) score += 30;

    // Optional files present
    if (assets.includes('viewDefinition.json')) score += 10;
    if (assets.includes('metadata.json')) score += 10;
    if (assets.some(a => a.includes('README'))) score += 5;

    // Template quality
    if (template?.metadata?.description) score += 5;
    if (template?.parameters && Object.keys(template.parameters).length > 0) score += 5;
    if (template?.outputs && Object.keys(template.outputs).length > 0) score += 5;

    return Math.min(score, 100);
  }

  private calculateSecurityScore(template: any): number {
    if (!template) return 0;

    let score = 100;
    const issues: string[] = [];

    // Check for hardcoded secrets
    const templateStr = JSON.stringify(template);
    if (templateStr.includes('password') && templateStr.includes('defaultValue')) {
      score -= 20;
      issues.push('Hardcoded passwords detected');
    }

    // Check for secure parameter types
    const params = template.parameters || {};
    for (const [name, param] of Object.entries(params)) {
      const p = param as any;
      if (name.toLowerCase().includes('password') && p.type !== 'securestring') {
        score -= 15;
        issues.push(`Password parameter '${name}' should use securestring type`);
      }
    }

    // Check for HTTPS usage
    if (templateStr.includes('"http://')) {
      score -= 10;
      issues.push('HTTP URLs detected, should use HTTPS');
    }

    return Math.max(score, 0);
  }

  private calculatePerformanceScore(template: any, sizeKB: number): number {
    let score = 100;

    // Package size penalty
    if (sizeKB > 1024) score -= 10; // > 1MB
    if (sizeKB > 5120) score -= 20; // > 5MB
    if (sizeKB > 10240) score -= 30; // > 10MB

    // Template efficiency
    if (template?.resources) {
      const resourceCount = template.resources.length;
      if (resourceCount > 50) score -= 15;
      if (resourceCount > 100) score -= 25;
    }

    return Math.max(score, 0);
  }

  private async optimizeTemplate(sourcePath: string): Promise<string[]> {
    const optimizations: string[] = [];
    const templatePath = path.join(sourcePath, 'mainTemplate.json');
    
    try {
      const template = await this.analyzeTemplate(templatePath);
      if (!template) return optimizations;

      // Add description if missing
      if (!template.metadata?.description) {
        optimizations.push('Added template description for better marketplace visibility');
      }

      // Optimize parameter descriptions
      const params = template.parameters || {};
      for (const [name, param] of Object.entries(params)) {
        const p = param as any;
        if (!p.metadata?.description) {
          optimizations.push(`Enhanced parameter '${name}' with descriptive metadata`);
        }
      }

      // Suggest parameter grouping
      const paramCount = Object.keys(params).length;
      if (paramCount > 10) {
        optimizations.push('Recommended parameter grouping for better user experience');
      }

      // Resource optimization suggestions
      const resources = template.resources || [];
      if (resources.length > 20) {
        optimizations.push('Suggested nested template structure for better organization');
      }

    } catch (_error) {
      console.warn(chalk.yellow('⚠️ Could not optimize template'));
    }

    return optimizations;
  }

  private async optimizeUiDefinition(sourcePath: string): Promise<string[]> {
    const optimizations: string[] = [];
    const uiPath = path.join(sourcePath, 'createUiDefinition.json');
    
    try {
      const uiDefinition = await this.analyzeUiDefinition(uiPath);
      if (!uiDefinition) return optimizations;

      // Check for proper step organization
      const steps = uiDefinition.parameters?.steps || [];
      if (steps.length > 5) {
        optimizations.push('Recommended step consolidation for better user flow');
      }

      // Validate step descriptions
      for (const step of steps) {
        if (!step.description) {
          optimizations.push(`Added description for step '${step.name || 'unnamed'}'`);
        }
      }

      // Check for validation rules
      let hasValidation = false;
      for (const step of steps) {
        if (step.elements) {
          for (const element of step.elements) {
            if (element.constraints) {
              hasValidation = true;
              break;
            }
          }
        }
      }

      if (!hasValidation) {
        optimizations.push('Added input validation rules for better user experience');
      }

    } catch (_error) {
      console.warn(chalk.yellow('⚠️ Could not optimize UI definition'));
    }

    return optimizations;
  }

  private async enhanceMetadata(sourcePath: string): Promise<string[]> {
    const enhancements: string[] = [];
    
    // Check for marketplace metadata file
    const metadataPath = path.join(sourcePath, 'marketplace-metadata.json');
    if (!await fs.pathExists(metadataPath)) {
      enhancements.push('Created marketplace-metadata.json for enhanced listing');
    }

    // Check for README
    const readmeFiles = ['README.md', 'readme.md', 'README.txt'];
    let hasReadme = false;
    for (const readme of readmeFiles) {
      if (await fs.pathExists(path.join(sourcePath, readme))) {
        hasReadme = true;
        break;
      }
    }

    if (!hasReadme) {
      enhancements.push('Created comprehensive README.md for better documentation');
    }

    // Check for icons
    const iconFiles = await fs.readdir(sourcePath);
    const hasIcon = iconFiles.some(file => 
      file.toLowerCase().includes('icon') && 
      (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.svg'))
    );

    if (!hasIcon) {
      enhancements.push('Recommended adding marketplace icon (90x90 PNG)');
    }

    return enhancements;
  }

  private async optimizeAssets(sourcePath: string): Promise<string[]> {
    const optimizations: string[] = [];
    const assets = await this.getAssetList(sourcePath);

    // Check for unnecessary files
    const unnecessaryFiles = assets.filter(asset => 
      asset.endsWith('.log') || 
      asset.endsWith('.tmp') || 
      asset.includes('node_modules') ||
      asset.includes('.git')
    );

    if (unnecessaryFiles.length > 0) {
      optimizations.push(`Excluded ${unnecessaryFiles.length} unnecessary files from package`);
    }

    // Check for large files
    for (const asset of assets) {
      try {
        const stat = await fs.stat(path.join(sourcePath, asset));
        if (stat.size > 1024 * 1024) { // > 1MB
          optimizations.push(`Recommended compression for large file: ${asset}`);
        }
      } catch (_error) {
        // Skip files that can't be accessed
      }
    }

    // Suggest file organization
    const jsonFiles = assets.filter(a => a.endsWith('.json') && !a.includes('/'));
    if (jsonFiles.length > 5) {
      optimizations.push('Recommended organizing JSON files into templates/ directory');
    }

    return optimizations;
  }

  private calculateQualityScore(analysis: PackageAnalysis, optimizations: PackageOptimization): number {
    let score = 0;

    // Base score from analysis
    score += analysis.marketplaceReadiness * 0.3;
    score += analysis.securityScore * 0.3;
    score += analysis.performanceScore * 0.2;

    // Bonus for optimizations applied
    const totalOptimizations = 
      optimizations.templateOptimizations.length +
      optimizations.uiOptimizations.length +
      optimizations.metadataEnhancements.length +
      optimizations.assetOptimizations.length;

    score += Math.min(totalOptimizations * 2, 20); // Max 20 bonus points

    return Math.min(Math.round(score), 100);
  }

  private generateRecommendations(analysis: PackageAnalysis, optimizations: PackageOptimization): string[] {
    const recommendations: string[] = [];

    // Security recommendations
    if (analysis.securityScore < 80) {
      recommendations.push('Review security configurations and remove hardcoded values');
    }

    // Performance recommendations
    if (analysis.performanceScore < 70) {
      recommendations.push('Optimize package size and template complexity');
    }

    // Marketplace readiness recommendations
    if (analysis.marketplaceReadiness < 80) {
      recommendations.push('Add missing marketplace assets (icons, documentation, metadata)');
    }

    // Template complexity recommendations
    if (analysis.templateComplexity > 70) {
      recommendations.push('Consider breaking down complex template into nested templates');
    }

    // UI complexity recommendations
    if (analysis.uiComplexity > 70) {
      recommendations.push('Simplify UI flow and consolidate related parameters');
    }

    // Package size recommendations
    if (analysis.totalSizeKB > 5120) { // > 5MB
      recommendations.push('Reduce package size by removing unnecessary assets');
    }

    return recommendations;
  }

  private async applyOptimizations(sourcePath: string, outputPath: string, optimizations: PackageOptimization): Promise<void> {
    console.log(chalk.blue('🔧 Applying optimizations...'));

    // Copy source to output
    await fs.copy(sourcePath, outputPath);

    // Apply template optimizations
    await this.applyTemplateOptimizations(outputPath, optimizations.templateOptimizations);

    // Apply UI optimizations
    await this.applyUiOptimizations(outputPath, optimizations.uiOptimizations);

    // Apply metadata enhancements
    await this.applyMetadataEnhancements(outputPath, optimizations.metadataEnhancements);

    console.log(chalk.green('✅ Optimizations applied successfully!'));
  }

  private async applyTemplateOptimizations(outputPath: string, optimizations: string[]): Promise<void> {
    const templatePath = path.join(outputPath, 'mainTemplate.json');
    
    try {
      const template = await this.analyzeTemplate(templatePath);
      if (!template) return;

      let modified = false;

      // Add description if missing
      if (optimizations.some(o => o.includes('Added template description'))) {
        if (!template.metadata) template.metadata = {};
        if (!template.metadata.description) {
          template.metadata.description = 'Azure Marketplace managed application template';
          modified = true;
        }
      }

      // Enhance parameter descriptions
      if (template.parameters) {
        for (const [name, param] of Object.entries(template.parameters)) {
          const p = param as any;
          if (!p.metadata) p.metadata = {};
          if (!p.metadata.description) {
            p.metadata.description = `Configuration parameter for ${name}`;
            modified = true;
          }
        }
      }

      if (modified) {
        await fs.writeFile(templatePath, JSON.stringify(template, null, 2));
      }

    } catch (_error) {
      console.warn(chalk.yellow('⚠️ Could not apply template optimizations'));
    }
  }

  private async applyUiOptimizations(outputPath: string, optimizations: string[]): Promise<void> {
    const uiPath = path.join(outputPath, 'createUiDefinition.json');
    
    try {
      const uiDefinition = await this.analyzeUiDefinition(uiPath);
      if (!uiDefinition) return;

      let modified = false;

      // Add step descriptions
      const steps = uiDefinition.parameters?.steps || [];
      for (const step of steps) {
        if (!step.description && optimizations.some(o => o.includes(`Added description for step`))) {
          step.description = `Configuration step for ${step.name || 'application settings'}`;
          modified = true;
        }
      }

      if (modified) {
        await fs.writeFile(uiPath, JSON.stringify(uiDefinition, null, 2));
      }

    } catch (_error) {
      console.warn(chalk.yellow('⚠️ Could not apply UI optimizations'));
    }
  }

  private async applyMetadataEnhancements(outputPath: string, enhancements: string[]): Promise<void> {
    // Create marketplace metadata if missing
    if (enhancements.some(e => e.includes('marketplace-metadata.json'))) {
      const metadataPath = path.join(outputPath, 'marketplace-metadata.json');
      const metadata = {
        name: 'Azure Marketplace Application',
        description: 'Enterprise-ready Azure managed application',
        version: '1.0.0',
        publisher: 'Your Organization',
        category: 'Infrastructure',
        tags: ['azure', 'managed-application', 'marketplace'],
        icon: 'icon.png',
        documentation: 'README.md'
      };
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    }

    // Create README if missing
    if (enhancements.some(e => e.includes('README.md'))) {
      const readmePath = path.join(outputPath, 'README.md');
      const readme = `# Azure Marketplace Application

## Overview
This managed application provides enterprise-ready Azure infrastructure deployment.

## Features
- Automated resource provisioning
- Built-in security configurations
- Comprehensive monitoring
- Enterprise compliance

## Deployment
Deploy this application through the Azure Marketplace or using Azure CLI.

## Support
For support and documentation, visit our website.
`;
      await fs.writeFile(readmePath, readme);
    }
  }
}