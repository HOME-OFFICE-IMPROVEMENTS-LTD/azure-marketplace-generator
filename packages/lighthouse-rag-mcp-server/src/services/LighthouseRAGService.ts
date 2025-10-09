import { OpenAI } from 'openai';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import puppeteer from 'puppeteer';
import NodeCache from 'node-cache';
import * as fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';
import { z } from 'zod';

/**
 * Lighthouse RAG Service
 * Provides performance intelligence and optimization patterns using RAG
 */
export class LighthouseRAGService {
  private openaiClient: OpenAI;
  private cache: NodeCache;
  private embeddings: Map<string, number[]>;
  private performanceReports: Map<string, any>;
  private optimizationPatterns: Map<string, any>;
  private reportStorage: string;

  constructor() {
    // Initialize OpenAI client for Azure OpenAI
    this.openaiClient = new OpenAI({
      apiKey: process.env.AZURE_OPENAI_KEY!,
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT!}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'text-embedding-ada-002'}`,
      defaultQuery: { 'api-version': '2024-02-01' },
      defaultHeaders: {
        'api-key': process.env.AZURE_OPENAI_KEY!,
      },
    });

    this.cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache
    this.embeddings = new Map();
    this.performanceReports = new Map();
    this.optimizationPatterns = new Map();
    this.reportStorage = process.env.LIGHTHOUSE_REPORTS_PATH || './lighthouse-reports';
    
    // Ensure reports directory exists
    fs.ensureDirSync(this.reportStorage);
  }

  /**
   * Run Lighthouse performance audit
   */
  async runPerformanceAudit(url: string, options?: any): Promise<any> {
    const cacheKey = `audit_${url}_${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      // Launch Chrome
      const chrome = await chromeLauncher.launch({
        chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
      });

      // Run Lighthouse
      const lighthouseOptions = {
        logLevel: 'error',
        output: 'json',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        port: chrome.port,
        ...options
      };

      const runnerResult = await lighthouse(url, lighthouseOptions);
      
      // Close Chrome
      await chrome.kill();

      if (!runnerResult) {
        throw new Error('Lighthouse audit failed to generate results');
      }

      const report = runnerResult.lhr;
      
      // Store report with timestamp
      const timestamp = new Date().toISOString();
      const reportId = `${new URL(url).hostname}_${timestamp}`;
      const reportPath = path.join(this.reportStorage, `${reportId}.json`);
      
      await fs.writeJson(reportPath, report, { spaces: 2 });
      
      // Cache and store in memory
      this.cache.set(cacheKey, report, 3600);
      this.performanceReports.set(reportId, {
        id: reportId,
        url,
        timestamp,
        report,
        path: reportPath
      });

      return report;
    } catch (error) {
      console.error('Lighthouse audit error:', error);
      throw error;
    }
  }

  /**
   * Generate text embedding for performance analysis
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const result = await this.openaiClient.embeddings.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'text-embedding-ada-002',
        input: text,
      });
      
      return result.data[0].embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between embeddings
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Index performance reports for RAG search
   */
  async indexPerformanceReports(): Promise<void> {
    try {
      // Load existing reports from storage
      const reportFiles = await glob(path.join(this.reportStorage, '*.json'));
      
      for (const reportFile of reportFiles) {
        const report = await fs.readJson(reportFile);
        const reportId = path.basename(reportFile, '.json');
        
        // Extract key performance insights
        const performanceInsights = this.extractPerformanceInsights(report);
        
        // Generate embedding for the insights
        const embedding = await this.generateEmbedding(performanceInsights);
        this.embeddings.set(reportId, embedding);
        
        // Store report data
        this.performanceReports.set(reportId, {
          id: reportId,
          url: report.finalUrl,
          timestamp: report.fetchTime,
          report,
          path: reportFile,
          insights: performanceInsights
        });
      }
      
      console.log(`Indexed ${reportFiles.length} performance reports`);
    } catch (error) {
      console.error('Failed to index performance reports:', error);
      throw error;
    }
  }

  /**
   * Extract performance insights from Lighthouse report
   */
  private extractPerformanceInsights(report: any): string {
    const insights = [];
    
    // Performance metrics
    const performance = report.categories?.performance;
    if (performance) {
      insights.push(`Performance Score: ${Math.round(performance.score * 100)}/100`);
    }
    
    // Core Web Vitals
    const audits = report.audits || {};
    const coreWebVitals = [
      'first-contentful-paint',
      'largest-contentful-paint',
      'cumulative-layout-shift',
      'first-input-delay',
      'interaction-to-next-paint'
    ];
    
    for (const metric of coreWebVitals) {
      const audit = audits[metric];
      if (audit && audit.displayValue) {
        insights.push(`${audit.title}: ${audit.displayValue}`);
      }
    }
    
    // Opportunities
    const opportunities = Object.values(audits)
      .filter((audit: any) => audit.details?.type === 'opportunity' && audit.score < 1)
      .map((audit: any) => `${audit.title}: ${audit.description}`)
      .slice(0, 5);
    
    insights.push(...opportunities);
    
    // Diagnostics
    const diagnostics = Object.values(audits)
      .filter((audit: any) => audit.score !== null && audit.score < 1 && audit.scoreDisplayMode === 'binary')
      .map((audit: any) => `${audit.title}: ${audit.description}`)
      .slice(0, 3);
    
    insights.push(...diagnostics);
    
    return insights.join('\n');
  }

  /**
   * Semantic search over performance reports
   */
  async semanticSearch(query: string, limit: number = 10): Promise<any[]> {
    try {
      const queryEmbedding = await this.generateEmbedding(query);
      const results: any[] = [];
      
      for (const [reportId, embedding] of this.embeddings) {
        const similarity = this.cosineSimilarity(queryEmbedding, embedding);
        const reportData = this.performanceReports.get(reportId);
        
        if (reportData) {
          results.push({
            ...reportData,
            similarity,
            type: 'performance-report'
          });
        }
      }
      
      // Sort by similarity and limit results
      return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
    } catch (error) {
      console.error('Semantic search failed:', error);
      throw error;
    }
  }

  /**
   * Get performance intelligence for a domain
   */
  async getPerformanceIntelligence(domain: string): Promise<any> {
    try {
      const domainReports = Array.from(this.performanceReports.values())
        .filter(report => new URL(report.url).hostname.includes(domain))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      if (domainReports.length === 0) {
        return { domain, message: 'No performance reports found for this domain' };
      }
      
      const latestReport = domainReports[0];
      const historicalTrend = domainReports.slice(1, 6); // Last 5 historical reports
      
      // Calculate performance trends
      const performanceScores = domainReports.map(report => ({
        timestamp: report.timestamp,
        score: report.report.categories?.performance?.score * 100 || 0
      }));
      
      // Extract optimization opportunities
      const opportunities = this.extractOptimizationOpportunities(latestReport.report);
      
      // Generate AI insights
      const aiInsights = await this.generatePerformanceInsights(domainReports);
      
      return {
        domain,
        currentPerformance: {
          score: latestReport.report.categories?.performance?.score * 100 || 0,
          url: latestReport.url,
          timestamp: latestReport.timestamp,
          coreWebVitals: this.extractCoreWebVitals(latestReport.report)
        },
        historicalTrend: performanceScores,
        optimizationOpportunities: opportunities,
        aiInsights,
        totalReports: domainReports.length
      };
    } catch (error) {
      console.error('Failed to get performance intelligence:', error);
      throw error;
    }
  }

  /**
   * Extract Core Web Vitals from report
   */
  private extractCoreWebVitals(report: any): any {
    const audits = report.audits || {};
    return {
      fcp: audits['first-contentful-paint']?.displayValue || 'N/A',
      lcp: audits['largest-contentful-paint']?.displayValue || 'N/A',
      cls: audits['cumulative-layout-shift']?.displayValue || 'N/A',
      fid: audits['first-input-delay']?.displayValue || 'N/A',
      inp: audits['interaction-to-next-paint']?.displayValue || 'N/A'
    };
  }

  /**
   * Extract optimization opportunities
   */
  private extractOptimizationOpportunities(report: any): any[] {
    const audits = report.audits || {};
    const opportunities = [];
    
    // High-impact opportunities
    const highImpactAudits = [
      'unused-css-rules',
      'unused-javascript',
      'render-blocking-resources',
      'unminified-css',
      'unminified-javascript',
      'efficient-animated-content',
      'legacy-javascript'
    ];
    
    for (const auditKey of highImpactAudits) {
      const audit = audits[auditKey];
      if (audit && audit.details?.overallSavingsMs > 100) {
        opportunities.push({
          title: audit.title,
          description: audit.description,
          savingsMs: audit.details.overallSavingsMs,
          savingsBytes: audit.details.overallSavingsBytes,
          impact: 'high'
        });
      }
    }
    
    return opportunities.sort((a, b) => b.savingsMs - a.savingsMs);
  }

  /**
   * Generate AI-powered performance insights
   */
  private async generatePerformanceInsights(reports: any[]): Promise<string> {
    try {
      const performanceData = reports.map(report => ({
        timestamp: report.timestamp,
        score: report.report.categories?.performance?.score * 100 || 0,
        insights: report.insights
      }));
      
      const prompt = `
Analyze the following performance data and provide actionable insights:

${JSON.stringify(performanceData, null, 2)}

Please provide:
1. Performance trend analysis
2. Key areas for improvement
3. Specific optimization recommendations
4. Expected impact of improvements
`;
      
      const response = await this.openaiClient.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.7
      });
      
      return response.choices[0].message.content || 'Unable to generate insights';
    } catch (error) {
      console.error('Failed to generate AI insights:', error);
      return 'AI insights temporarily unavailable';
    }
  }

  /**
   * Index optimization patterns for machine learning
   */
  async indexOptimizationPatterns(): Promise<void> {
    try {
      // Common optimization patterns and their impacts
      const patterns = [
        {
          pattern: 'Image Optimization',
          description: 'Convert images to WebP format, implement lazy loading, use responsive images',
          impact: 'High - Can reduce page load time by 20-50%',
          techniques: ['WebP conversion', 'Lazy loading', 'Responsive images', 'Image compression']
        },
        {
          pattern: 'CSS Optimization',
          description: 'Minify CSS, remove unused styles, inline critical CSS',
          impact: 'Medium - Can reduce render blocking time by 15-30%',
          techniques: ['CSS minification', 'Unused CSS removal', 'Critical CSS inlining', 'CSS splitting']
        },
        {
          pattern: 'JavaScript Optimization',
          description: 'Code splitting, tree shaking, minification, async loading',
          impact: 'High - Can reduce bundle size by 30-60%',
          techniques: ['Code splitting', 'Tree shaking', 'Minification', 'Async loading', 'Dynamic imports']
        },
        {
          pattern: 'Caching Strategy',
          description: 'Implement browser caching, CDN, service workers',
          impact: 'Very High - Can reduce repeat visit load time by 70-90%',
          techniques: ['Browser caching', 'CDN implementation', 'Service workers', 'Cache-first strategy']
        },
        {
          pattern: 'Resource Hints',
          description: 'Use preload, prefetch, preconnect for critical resources',
          impact: 'Medium - Can reduce resource load time by 10-25%',
          techniques: ['Preload critical resources', 'Prefetch next page resources', 'Preconnect to origins', 'DNS prefetch']
        }
      ];
      
      for (const pattern of patterns) {
        const patternText = `${pattern.pattern}: ${pattern.description}. Impact: ${pattern.impact}. Techniques: ${pattern.techniques.join(', ')}`;
        const embedding = await this.generateEmbedding(patternText);
        
        this.embeddings.set(`pattern_${pattern.pattern}`, embedding);
        this.optimizationPatterns.set(pattern.pattern, {
          ...pattern,
          text: patternText,
          type: 'optimization-pattern'
        });
      }
      
      console.log(`Indexed ${patterns.length} optimization patterns`);
    } catch (error) {
      console.error('Failed to index optimization patterns:', error);
      throw error;
    }
  }

  /**
   * Get optimization recommendations based on performance issues
   */
  async getOptimizationRecommendations(performanceIssues: string[]): Promise<any[]> {
    try {
      const recommendations = [];
      
      for (const issue of performanceIssues) {
        const searchResults = await this.semanticSearch(issue, 3);
        const patternResults = searchResults.filter(result => result.type === 'optimization-pattern');
        
        if (patternResults.length > 0) {
          recommendations.push({
            issue,
            recommendations: patternResults.map(result => ({
              pattern: result.pattern,
              description: result.description,
              impact: result.impact,
              techniques: result.techniques,
              similarity: result.similarity
            }))
          });
        }
      }
      
      return recommendations;
    } catch (error) {
      console.error('Failed to get optimization recommendations:', error);
      throw error;
    }
  }

  /**
   * Compare performance between two URLs or time periods
   */
  async comparePerformance(url1: string, url2?: string, timeRange?: { start: string; end: string }): Promise<any> {
    try {
      let reports1: any[] = [];
      let reports2: any[] = [];
      
      if (url2) {
        // Compare two different URLs
        reports1 = Array.from(this.performanceReports.values())
          .filter(report => report.url === url1)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        reports2 = Array.from(this.performanceReports.values())
          .filter(report => report.url === url2)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      } else if (timeRange) {
        // Compare same URL across time range
        const allReports = Array.from(this.performanceReports.values())
          .filter(report => report.url === url1)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        const startDate = new Date(timeRange.start);
        const endDate = new Date(timeRange.end);
        
        reports1 = allReports.filter(report => 
          new Date(report.timestamp) >= startDate && new Date(report.timestamp) <= endDate
        );
        
        reports2 = allReports.filter(report => 
          new Date(report.timestamp) < startDate
        );
      }
      
      if (reports1.length === 0 || reports2.length === 0) {
        return { error: 'Insufficient data for comparison' };
      }
      
      const avg1 = this.calculateAverageMetrics(reports1);
      const avg2 = this.calculateAverageMetrics(reports2);
      
      return {
        comparison: {
          baseline: avg2,
          current: avg1,
          improvements: this.calculateImprovements(avg2, avg1)
        },
        reports: {
          set1: reports1.length,
          set2: reports2.length
        }
      };
    } catch (error) {
      console.error('Failed to compare performance:', error);
      throw error;
    }
  }

  /**
   * Calculate average metrics from reports
   */
  private calculateAverageMetrics(reports: any[]): any {
    const metrics = {
      performanceScore: 0,
      fcp: 0,
      lcp: 0,
      cls: 0,
      count: reports.length
    };
    
    for (const report of reports) {
      const perf = report.report.categories?.performance?.score || 0;
      metrics.performanceScore += perf * 100;
      
      const audits = report.report.audits || {};
      metrics.fcp += parseFloat(audits['first-contentful-paint']?.numericValue || 0);
      metrics.lcp += parseFloat(audits['largest-contentful-paint']?.numericValue || 0);
      metrics.cls += parseFloat(audits['cumulative-layout-shift']?.numericValue || 0);
    }
    
    return {
      performanceScore: Math.round(metrics.performanceScore / reports.length),
      fcp: Math.round(metrics.fcp / reports.length),
      lcp: Math.round(metrics.lcp / reports.length),
      cls: Math.round((metrics.cls / reports.length) * 1000) / 1000
    };
  }

  /**
   * Calculate improvements between two metric sets
   */
  private calculateImprovements(baseline: any, current: any): any {
    return {
      performanceScore: current.performanceScore - baseline.performanceScore,
      fcp: baseline.fcp - current.fcp, // Lower is better
      lcp: baseline.lcp - current.lcp, // Lower is better
      cls: baseline.cls - current.cls // Lower is better
    };
  }
}