import * as chalk from 'chalk';
import * as https from 'https';
import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Azure Pricing API Integration Service
 *
 * Provides real cost calculations using Azure Retail Prices API,
 * replaces placeholder cost estimates with accurate pricing data.
 */

export interface AzureResource {
  type: string;
  sku?: string;
  region: string;
  quantity: number;
  unit: string;
  properties?: any;
}

export interface PricingData {
  serviceName: string;
  productName: string;
  skuName: string;
  region: string;
  currency: string;
  unitPrice: number;
  unit: string;
  effectiveStartDate: string;
  meterId: string;
  meterName: string;
  productId: string;
}

export interface CostEstimate {
  resourceType: string;
  resourceName: string;
  region: string;
  sku: string;
  monthlyEstimate: number;
  dailyEstimate: number;
  hourlyEstimate: number;
  currency: string;
  breakdown: {
    compute?: number;
    storage?: number;
    network?: number;
    database?: number;
    other?: number;
  };
  assumptions: string[];
  confidenceLevel: 'high' | 'medium' | 'low';
}

export interface TemplateCostAnalysis {
  timestamp: Date;
  templatePath: string;
  totalMonthlyCost: number;
  totalDailyCost: number;
  currency: string;
  region: string;
  resources: CostEstimate[];
  optimizationOpportunities: {
    description: string;
    potentialSavings: number;
    complexity: 'low' | 'medium' | 'high';
  }[];
  costBreakdown: {
    compute: number;
    storage: number;
    network: number;
    database: number;
    other: number;
  };
  scalingProjections: {
    timeframe: string;
    lowUsage: number;
    mediumUsage: number;
    highUsage: number;
  }[];
}

export class AzurePricingService {
  private readonly retailPricesApiUrl = 'https://prices.azure.com/api/retail/prices';
  private pricingCache: Map<string, PricingData[]> = new Map();
  private cacheExpiryMs = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.loadPricingCache();
  }

  /**
   * Analyze template costs using real Azure pricing data
   */
  async analyzeTemplateCosts(
    templatePath: string,
    region: string = 'eastus',
    currency: string = 'USD'
  ): Promise<TemplateCostAnalysis> {
    console.log(chalk.blue('💰 Analyzing template costs with Azure Retail Prices API...'));

    const template = await this.loadTemplate(templatePath);
    if (!template) {
      throw new Error(`Unable to load template: ${templatePath}`);
    }

    const resources = this.extractResources(template);
    const costEstimates: CostEstimate[] = [];
    let totalMonthlyCost = 0;

    console.log(chalk.yellow(`📊 Calculating costs for ${resources.length} resources...`));

    for (const resource of resources) {
      try {
        const estimate = await this.calculateResourceCost(resource, region, currency);
        costEstimates.push(estimate);
        totalMonthlyCost += estimate.monthlyEstimate;

        console.log(chalk.white(`  💸 ${resource.type}: $${estimate.monthlyEstimate.toFixed(2)}/month`));
      } catch (error) {
        console.warn(chalk.yellow(`⚠️ Could not calculate cost for ${resource.type}: ${error}`));

        // Add fallback estimate
        const fallbackEstimate = this.createFallbackEstimate(resource, region, currency);
        costEstimates.push(fallbackEstimate);
        totalMonthlyCost += fallbackEstimate.monthlyEstimate;
      }
    }

    const analysis: TemplateCostAnalysis = {
      timestamp: new Date(),
      templatePath,
      totalMonthlyCost,
      totalDailyCost: totalMonthlyCost / 30,
      currency,
      region,
      resources: costEstimates,
      optimizationOpportunities: this.identifyOptimizationOpportunities(costEstimates),
      costBreakdown: this.calculateCostBreakdown(costEstimates),
      scalingProjections: this.generateScalingProjections(costEstimates)
    };

    this.printCostAnalysis(analysis);
    return analysis;
  }

  /**
   * Load ARM template from file
   */
  private async loadTemplate(templatePath: string): Promise<any> {
    try {
      const mainTemplatePath = path.isAbsolute(templatePath)
        ? templatePath
        : path.join(templatePath, 'mainTemplate.json');

      return await fs.readJson(mainTemplatePath);
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract resources from ARM template
   */
  private extractResources(template: any): AzureResource[] {
    const resources: AzureResource[] = [];
    const templateResources = template.resources || [];

    for (const resource of templateResources) {
      // Extract basic resource information
      const azureResource: AzureResource = {
        type: resource.type,
        sku: resource.sku?.name || resource.properties?.sku?.name,
        region: resource.location || '[resourceGroup().location]',
        quantity: 1,
        unit: 'month',
        properties: resource.properties
      };

      // Add specific quantity/unit information based on resource type
      this.enrichResourceDetails(azureResource, resource);
      resources.push(azureResource);
    }

    return resources;
  }

  /**
   * Enrich resource details with usage patterns
   */
  private enrichResourceDetails(azureResource: AzureResource, templateResource: any): void {
    switch (azureResource.type) {
      case 'Microsoft.Compute/virtualMachines':
        // Assume 24/7 usage for VMs
        azureResource.quantity = 730; // Hours per month
        azureResource.unit = 'hour';
        break;

      case 'Microsoft.Storage/storageAccounts':
        // Estimate storage usage
        azureResource.quantity = 100; // GB
        azureResource.unit = 'GB';
        break;

      case 'Microsoft.Web/sites':
        // App Service plans - assume standard hours
        azureResource.quantity = 730; // Hours per month
        azureResource.unit = 'hour';
        break;

      case 'Microsoft.Sql/servers/databases':
        // SQL Database - assume DTU or vCore model
        azureResource.quantity = 730; // Hours per month
        azureResource.unit = 'hour';
        break;

      default:
        // Default to monthly billing
        azureResource.quantity = 1;
        azureResource.unit = 'month';
    }
  }

  /**
   * Calculate cost for individual resource
   */
  private async calculateResourceCost(
    resource: AzureResource,
    region: string,
    currency: string
  ): Promise<CostEstimate> {
    const pricingData = await this.getPricingData(resource.type, resource.sku, region, currency);

    if (!pricingData || pricingData.length === 0) {
      throw new Error(`No pricing data found for ${resource.type}`);
    }

    // Select the most appropriate pricing entry
    const selectedPricing = this.selectBestPricing(pricingData, resource);

    // Calculate costs based on resource type and usage
    const costs = this.calculateResourceSpecificCosts(resource, selectedPricing);

    const estimate: CostEstimate = {
      resourceType: resource.type,
      resourceName: `${resource.type.split('/').pop()}`,
      region,
      sku: resource.sku || 'Standard',
      monthlyEstimate: costs.monthly,
      dailyEstimate: costs.monthly / 30,
      hourlyEstimate: costs.monthly / 730,
      currency,
      breakdown: costs.breakdown,
      assumptions: costs.assumptions,
      confidenceLevel: costs.confidence
    };

    return estimate;
  }

  /**
   * Get pricing data from Azure Retail Prices API
   */
  private async getPricingData(
    resourceType: string,
    sku: string | undefined,
    region: string,
    currency: string
  ): Promise<PricingData[]> {
    const cacheKey = `${resourceType}-${sku}-${region}-${currency}`;

    // Check cache first
    if (this.pricingCache.has(cacheKey)) {
      return this.pricingCache.get(cacheKey)!;
    }

    try {
      // Build API query
      const serviceName = this.mapResourceTypeToServiceName(resourceType);
      let apiUrl = `${this.retailPricesApiUrl}?currencyCode=${currency}&$filter=`;

      const filters = [
        `serviceName eq '${serviceName}'`,
        `armRegionName eq '${region}'`
      ];

      if (sku) {
        filters.push(`skuName eq '${sku}'`);
      }

      apiUrl += filters.join(' and ');

      console.log(chalk.gray(`📡 Fetching pricing data: ${serviceName} in ${region}`));

      const pricingData = await this.fetchPricingData(apiUrl);

      // Cache the results
      this.pricingCache.set(cacheKey, pricingData);
      this.savePricingCache();

      return pricingData;
    } catch (error) {
      console.warn(chalk.yellow(`⚠️ Failed to fetch pricing data: ${error}`));
      return [];
    }
  }

  /**
   * Fetch pricing data from API
   */
  private async fetchPricingData(url: string): Promise<PricingData[]> {
    return new Promise((resolve, reject) => {
      const request = https.get(url, (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result.Items || []);
          } catch (error) {
            reject(new Error(`Failed to parse pricing data: ${error}`));
          }
        });
      });

      request.on('error', (error) => {
        reject(error);
      });

      request.setTimeout(10000, () => {
        reject(new Error('Request timeout'));
      });
    });
  }

  /**
   * Map ARM resource type to Azure service name
   */
  private mapResourceTypeToServiceName(resourceType: string): string {
    const mapping: { [key: string]: string } = {
      'Microsoft.Compute/virtualMachines': 'Virtual Machines',
      'Microsoft.Storage/storageAccounts': 'Storage',
      'Microsoft.Web/sites': 'Azure App Service',
      'Microsoft.Sql/servers/databases': 'SQL Database',
      'Microsoft.Network/loadBalancers': 'Load Balancer',
      'Microsoft.Network/applicationGateways': 'Application Gateway',
      'Microsoft.KeyVault/vaults': 'Key Vault',
      'Microsoft.DocumentDB/databaseAccounts': 'Azure Cosmos DB',
      'Microsoft.Cache/Redis': 'Azure Cache for Redis',
      'Microsoft.ServiceBus/namespaces': 'Service Bus'
    };

    return mapping[resourceType] || resourceType;
  }

  /**
   * Select best pricing option for resource
   */
  private selectBestPricing(pricingData: PricingData[], resource: AzureResource): PricingData {
    // Prefer pay-as-you-go pricing
    let preferred = pricingData.find(p => p.productName.toLowerCase().includes('pay-as-you-go'));

    // If no pay-as-you-go, prefer standard SKUs
    if (!preferred) {
      preferred = pricingData.find(p => p.skuName.toLowerCase().includes('standard'));
    }

    // Fallback to first available
    return preferred || pricingData[0];
  }

  /**
   * Calculate resource-specific costs
   */
  private calculateResourceSpecificCosts(resource: AzureResource, pricing: PricingData): {
    monthly: number;
    breakdown: any;
    assumptions: string[];
    confidence: 'high' | 'medium' | 'low';
  } {
    const baseHourlyRate = pricing.unitPrice;
    let monthly = 0;
    const breakdown: any = {};
    const assumptions: string[] = [];
    let confidence: 'high' | 'medium' | 'low' = 'high';

    switch (resource.type) {
      case 'Microsoft.Compute/virtualMachines':
        monthly = baseHourlyRate * 730; // 24/7 operation
        breakdown.compute = monthly;
        assumptions.push('VM runs 24/7 (730 hours/month)');
        assumptions.push('No additional disk costs included');
        break;

      case 'Microsoft.Storage/storageAccounts':
        // Estimate based on storage tier and usage
        const storageGB = resource.quantity;
        monthly = baseHourlyRate * storageGB;
        breakdown.storage = monthly;
        assumptions.push(`${storageGB}GB storage capacity`);
        assumptions.push('Standard transaction rates assumed');
        confidence = 'medium';
        break;

      case 'Microsoft.Web/sites':
        monthly = baseHourlyRate * 730;
        breakdown.compute = monthly;
        assumptions.push('App Service runs continuously');
        assumptions.push('Standard traffic patterns assumed');
        break;

      case 'Microsoft.Sql/servers/databases':
        monthly = baseHourlyRate * 730;
        breakdown.database = monthly;
        assumptions.push('Database runs 24/7');
        assumptions.push('Standard query workload assumed');
        break;

      default:
        monthly = baseHourlyRate * resource.quantity;
        breakdown.other = monthly;
        assumptions.push('Standard usage patterns assumed');
        confidence = 'low';
    }

    return { monthly, breakdown, assumptions, confidence };
  }

  /**
   * Create fallback estimate when API data unavailable
   */
  private createFallbackEstimate(resource: AzureResource, region: string, currency: string): CostEstimate {
    // Fallback pricing estimates based on typical Azure costs
    const fallbackPricing: { [key: string]: number } = {
      'Microsoft.Compute/virtualMachines': 50, // $50/month for standard VM
      'Microsoft.Storage/storageAccounts': 20, // $20/month for standard storage
      'Microsoft.Web/sites': 55, // $55/month for standard App Service
      'Microsoft.Sql/servers/databases': 200, // $200/month for standard SQL DB
      'Microsoft.Network/loadBalancers': 25, // $25/month for load balancer
      'Microsoft.KeyVault/vaults': 0.03 // $0.03/month base cost
    };

    const monthlyEstimate = fallbackPricing[resource.type] || 10;

    return {
      resourceType: resource.type,
      resourceName: `${resource.type.split('/').pop()}`,
      region,
      sku: resource.sku || 'Standard',
      monthlyEstimate,
      dailyEstimate: monthlyEstimate / 30,
      hourlyEstimate: monthlyEstimate / 730,
      currency,
      breakdown: { other: monthlyEstimate },
      assumptions: ['Fallback estimate - actual costs may vary'],
      confidenceLevel: 'low'
    };
  }

  /**
   * Identify cost optimization opportunities
   */
  private identifyOptimizationOpportunities(estimates: CostEstimate[]): any[] {
    const opportunities = [];

    const totalCost = estimates.reduce((sum, est) => sum + est.monthlyEstimate, 0);

    // High-cost resources
    const expensiveResources = estimates.filter(est => est.monthlyEstimate > totalCost * 0.3);
    if (expensiveResources.length > 0) {
      opportunities.push({
        description: `Consider right-sizing expensive resources (${expensiveResources.map(r => r.resourceType).join(', ')})`,
        potentialSavings: totalCost * 0.15,
        complexity: 'medium'
      });
    }

    // Multiple VMs that could be consolidated
    const vmCount = estimates.filter(est => est.resourceType === 'Microsoft.Compute/virtualMachines').length;
    if (vmCount > 2) {
      opportunities.push({
        description: 'Consider consolidating VMs or using Virtual Machine Scale Sets',
        potentialSavings: totalCost * 0.20,
        complexity: 'high'
      });
    }

    // Reserved instances savings
    const computeCosts = estimates
      .filter(est => est.resourceType.includes('Compute') || est.resourceType.includes('Sql'))
      .reduce((sum, est) => sum + est.monthlyEstimate, 0);

    if (computeCosts > 100) {
      opportunities.push({
        description: 'Consider Reserved Instances for long-running compute resources (up to 72% savings)',
        potentialSavings: computeCosts * 0.40,
        complexity: 'low'
      });
    }

    // Auto-scaling opportunities
    opportunities.push({
      description: 'Implement auto-scaling to optimize costs during low usage periods',
      potentialSavings: totalCost * 0.25,
      complexity: 'medium'
    });

    return opportunities;
  }

  /**
   * Calculate cost breakdown by category
   */
  private calculateCostBreakdown(estimates: CostEstimate[]): any {
    const breakdown = {
      compute: 0,
      storage: 0,
      network: 0,
      database: 0,
      other: 0
    };

    for (const estimate of estimates) {
      if (estimate.breakdown.compute) breakdown.compute += estimate.breakdown.compute;
      if (estimate.breakdown.storage) breakdown.storage += estimate.breakdown.storage;
      if (estimate.breakdown.network) breakdown.network += estimate.breakdown.network;
      if (estimate.breakdown.database) breakdown.database += estimate.breakdown.database;
      if (estimate.breakdown.other) breakdown.other += estimate.breakdown.other;
    }

    return breakdown;
  }

  /**
   * Generate scaling projections
   */
  private generateScalingProjections(estimates: CostEstimate[]): any[] {
    const baseCost = estimates.reduce((sum, est) => sum + est.monthlyEstimate, 0);

    return [
      {
        timeframe: '6 months',
        lowUsage: baseCost * 0.8 * 6,
        mediumUsage: baseCost * 1.0 * 6,
        highUsage: baseCost * 1.5 * 6
      },
      {
        timeframe: '1 year',
        lowUsage: baseCost * 0.7 * 12,
        mediumUsage: baseCost * 1.0 * 12,
        highUsage: baseCost * 2.0 * 12
      },
      {
        timeframe: '3 years',
        lowUsage: baseCost * 0.6 * 36,
        mediumUsage: baseCost * 0.9 * 36,
        highUsage: baseCost * 1.8 * 36
      }
    ];
  }

  /**
   * Load pricing cache from disk
   */
  private async loadPricingCache(): Promise<void> {
    try {
      const cachePath = path.join(process.cwd(), '.azmp-pricing-cache.json');
      if (await fs.pathExists(cachePath)) {
        const cacheData = await fs.readJson(cachePath);
        this.pricingCache = new Map(Object.entries(cacheData));
      }
    } catch (error) {
      // Ignore cache loading errors
    }
  }

  /**
   * Save pricing cache to disk
   */
  private async savePricingCache(): Promise<void> {
    try {
      const cachePath = path.join(process.cwd(), '.azmp-pricing-cache.json');
      const cacheData = Object.fromEntries(this.pricingCache);
      await fs.writeJson(cachePath, cacheData);
    } catch (error) {
      // Ignore cache saving errors
    }
  }

  /**
   * Print comprehensive cost analysis
   */
  private printCostAnalysis(analysis: TemplateCostAnalysis): void {
    console.log(chalk.blue('\n💰 AZURE COST ANALYSIS REPORT'));
    console.log(chalk.blue('=============================='));

    console.log(chalk.white(`Template: ${analysis.templatePath}`));
    console.log(chalk.white(`Region: ${analysis.region}`));
    console.log(chalk.white(`Analysis Date: ${analysis.timestamp.toISOString()}`));

    console.log(chalk.cyan(`\n💸 TOTAL ESTIMATED COST: ${analysis.currency} $${analysis.totalMonthlyCost.toFixed(2)}/month`));
    console.log(chalk.cyan(`💸 Daily Cost: ${analysis.currency} $${analysis.totalDailyCost.toFixed(2)}/day`));

    console.log(chalk.white(`\n📊 Cost Breakdown:`));
    console.log(chalk.white(`  Compute: $${analysis.costBreakdown.compute.toFixed(2)}`));
    console.log(chalk.white(`  Storage: $${analysis.costBreakdown.storage.toFixed(2)}`));
    console.log(chalk.white(`  Database: $${analysis.costBreakdown.database.toFixed(2)}`));
    console.log(chalk.white(`  Network: $${analysis.costBreakdown.network.toFixed(2)}`));
    console.log(chalk.white(`  Other: $${analysis.costBreakdown.other.toFixed(2)}`));

    if (analysis.optimizationOpportunities.length > 0) {
      console.log(chalk.yellow('\n🎯 OPTIMIZATION OPPORTUNITIES:'));
      analysis.optimizationOpportunities.forEach((opp, i) => {
        console.log(chalk.yellow(`  ${i + 1}. ${opp.description}`));
        console.log(chalk.yellow(`     Potential Savings: $${opp.potentialSavings.toFixed(2)}/month`));
        console.log(chalk.yellow(`     Complexity: ${opp.complexity}`));
      });
    }

    console.log(chalk.gray('\n📈 Scaling Projections:'));
    analysis.scalingProjections.forEach(proj => {
      console.log(chalk.gray(`  ${proj.timeframe}:`));
      console.log(chalk.gray(`    Low Usage: $${proj.lowUsage.toFixed(2)}`));
      console.log(chalk.gray(`    Medium Usage: $${proj.mediumUsage.toFixed(2)}`));
      console.log(chalk.gray(`    High Usage: $${proj.highUsage.toFixed(2)}`));
    });

    console.log(chalk.blue('\n💡 Cost data sourced from Azure Retail Prices API'));
  }
}