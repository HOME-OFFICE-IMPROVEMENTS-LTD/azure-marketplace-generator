#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { LighthouseRAGService } from './services/LighthouseRAGService.js';
import { z } from 'zod';

// Environment validation
const EnvSchema = z.object({
  AZURE_OPENAI_ENDPOINT: z.string().url(),
  AZURE_OPENAI_KEY: z.string().min(1),
  AZURE_OPENAI_DEPLOYMENT_NAME: z.string().default('text-embedding-ada-002'),
  LIGHTHOUSE_REPORTS_PATH: z.string().optional(),
});

/**
 * Lighthouse MCP Server with RAG Intelligence
 * 
 * Features:
 * - Performance auditing and analysis
 * - Historical performance tracking
 * - Optimization pattern recognition
 * - Performance intelligence and recommendations
 * - Core Web Vitals monitoring
 */
class LighthouseRAGMCPServer {
  private server: Server;
  private ragService: LighthouseRAGService;

  constructor() {
    // Validate environment variables
    const env = EnvSchema.parse(process.env);
    
    this.server = new Server(
      {
        name: 'lighthouse-rag-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.ragService = new LighthouseRAGService();
    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'lighthouse_audit',
            description: 'Run Lighthouse performance audit on a URL',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL to audit for performance'
                },
                options: {
                  type: 'object',
                  description: 'Additional Lighthouse options',
                  properties: {
                    formFactor: {
                      type: 'string',
                      enum: ['mobile', 'desktop'],
                      default: 'mobile'
                    },
                    throttling: {
                      type: 'string',
                      enum: ['mobileSlow4G', 'mobile3G', 'desktopDense4G'],
                      default: 'mobileSlow4G'
                    }
                  }
                }
              },
              required: ['url']
            }
          },
          {
            name: 'performance_search',
            description: 'Semantic search across performance reports and optimization patterns',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query for performance insights'
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results (default: 10)',
                  default: 10
                }
              },
              required: ['query']
            }
          },
          {
            name: 'performance_intelligence',
            description: 'Get comprehensive performance intelligence for a domain',
            inputSchema: {
              type: 'object',
              properties: {
                domain: {
                  type: 'string',
                  description: 'Domain to analyze for performance intelligence'
                }
              },
              required: ['domain']
            }
          },
          {
            name: 'optimization_recommendations',
            description: 'Get optimization recommendations based on performance issues',
            inputSchema: {
              type: 'object',
              properties: {
                issues: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of performance issues to get recommendations for'
                }
              },
              required: ['issues']
            }
          },
          {
            name: 'performance_comparison',
            description: 'Compare performance between URLs or time periods',
            inputSchema: {
              type: 'object',
              properties: {
                url1: {
                  type: 'string',
                  description: 'Primary URL for comparison'
                },
                url2: {
                  type: 'string',
                  description: 'Secondary URL for comparison (optional)'
                },
                timeRange: {
                  type: 'object',
                  description: 'Time range for historical comparison',
                  properties: {
                    start: { type: 'string', description: 'Start date (ISO string)' },
                    end: { type: 'string', description: 'End date (ISO string)' }
                  }
                }
              },
              required: ['url1']
            }
          },
          {
            name: 'index_performance_reports',
            description: 'Index existing performance reports for RAG search',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'index_optimization_patterns',
            description: 'Index optimization patterns for machine learning recommendations',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          }
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'lighthouse_audit': {
            const { url, options = {} } = args as { url: string; options?: any };
            const report = await this.ragService.runPerformanceAudit(url, options);
            
            // Extract key metrics for summary
            const performance = report.categories?.performance;
            const audits = report.audits || {};
            
            const summary = {
              url: report.finalUrl,
              performanceScore: Math.round((performance?.score || 0) * 100),
              coreWebVitals: {
                fcp: audits['first-contentful-paint']?.displayValue || 'N/A',
                lcp: audits['largest-contentful-paint']?.displayValue || 'N/A',
                cls: audits['cumulative-layout-shift']?.displayValue || 'N/A',
                fid: audits['first-input-delay']?.displayValue || 'N/A'
              },
              opportunities: Object.values(audits)
                .filter((audit: any) => audit.details?.type === 'opportunity' && audit.score < 1)
                .slice(0, 5)
                .map((audit: any) => ({
                  title: audit.title,
                  description: audit.description,
                  savings: audit.details?.overallSavingsMs ? `${audit.details.overallSavingsMs}ms` : 'N/A'
                })),
              diagnostics: Object.values(audits)
                .filter((audit: any) => audit.score !== null && audit.score < 1 && audit.scoreDisplayMode === 'binary')
                .slice(0, 3)
                .map((audit: any) => audit.title)
            };
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    status: 'completed',
                    summary,
                    fullReport: 'Full report saved to storage'
                  }, null, 2)
                }
              ]
            };
          }

          case 'performance_search': {
            const { query, limit = 10 } = args as { query: string; limit?: number };
            const results = await this.ragService.semanticSearch(query, limit);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    query,
                    results: results.map(result => ({
                      type: result.type,
                      title: result.pattern || result.url || 'Performance Data',
                      description: result.description || result.insights,
                      similarity: Math.round(result.similarity * 100) + '%',
                      metadata: {
                        url: result.url,
                        timestamp: result.timestamp,
                        impact: result.impact
                      }
                    }))
                  }, null, 2)
                }
              ]
            };
          }

          case 'performance_intelligence': {
            const { domain } = args as { domain: string };
            const intelligence = await this.ragService.getPerformanceIntelligence(domain);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(intelligence, null, 2)
                }
              ]
            };
          }

          case 'optimization_recommendations': {
            const { issues } = args as { issues: string[] };
            const recommendations = await this.ragService.getOptimizationRecommendations(issues);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    issues: issues.length,
                    recommendations
                  }, null, 2)
                }
              ]
            };
          }

          case 'performance_comparison': {
            const { url1, url2, timeRange } = args as { 
              url1: string; 
              url2?: string; 
              timeRange?: { start: string; end: string } 
            };
            const comparison = await this.ragService.comparePerformance(url1, url2, timeRange);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(comparison, null, 2)
                }
              ]
            };
          }

          case 'index_performance_reports': {
            await this.ragService.indexPerformanceReports();
            
            return {
              content: [
                {
                  type: 'text',
                  text: '✅ Successfully indexed performance reports for RAG search'
                }
              ]
            };
          }

          case 'index_optimization_patterns': {
            await this.ragService.indexOptimizationPatterns();
            
            return {
              content: [
                {
                  type: 'text',
                  text: '✅ Successfully indexed optimization patterns for ML recommendations'
                }
              ]
            };
          }

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new McpError(
          ErrorCode.InternalError,
          `Lighthouse RAG operation failed: ${errorMessage}`
        );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🚀 Lighthouse RAG MCP Server running on stdio');
  }
}

// Start the server
const server = new LighthouseRAGMCPServer();
server.run().catch(console.error);