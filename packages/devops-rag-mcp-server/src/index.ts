#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { DevOpsRAGService } from './services/DevOpsRAGService.js';
import { z } from 'zod';

// Environment validation
const EnvSchema = z.object({
  AZURE_OPENAI_ENDPOINT: z.string().url(),
  AZURE_OPENAI_KEY: z.string().min(1),
  AZURE_DEVOPS_ORG_URL: z.string().url(),
  AZURE_DEVOPS_PAT: z.string().min(1),
  AZURE_DEVOPS_PROJECT: z.string().min(1).optional(),
  AZURE_OPENAI_DEPLOYMENT_NAME: z.string().default('text-embedding-ada-002'),
});

/**
 * Azure DevOps MCP Server with RAG Intelligence
 * 
 * Features:
 * - Code history semantic search
 * - Work item intelligence and patterns
 * - Pipeline analysis and optimization
 * - Developer productivity insights
 * - Project knowledge extraction
 */
class DevOpsRAGMCPServer {
  private server: Server;
  private ragService: DevOpsRAGService;

  constructor() {
    // Validate environment variables
    const env = EnvSchema.parse(process.env);
    
    this.server = new Server(
      {
        name: 'devops-rag-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.ragService = new DevOpsRAGService();
    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'devops_search',
            description: 'Semantic search across Azure DevOps content (commits, work items, builds)',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query for DevOps content'
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
            name: 'devops_index_project',
            description: 'Index Azure DevOps project content for RAG search',
            inputSchema: {
              type: 'object',
              properties: {
                projectName: {
                  type: 'string',
                  description: 'Azure DevOps project name'
                },
                repositoryId: {
                  type: 'string',
                  description: 'Repository ID or name (optional)'
                }
              },
              required: ['projectName']
            }
          },
          {
            name: 'devops_code_intelligence',
            description: 'Get code intelligence insights for a repository',
            inputSchema: {
              type: 'object',
              properties: {
                projectName: {
                  type: 'string',
                  description: 'Azure DevOps project name'
                },
                repositoryId: {
                  type: 'string',
                  description: 'Repository ID or name'
                }
              },
              required: ['projectName', 'repositoryId']
            }
          },
          {
            name: 'devops_work_item_intelligence',
            description: 'Get work item intelligence and patterns for a project',
            inputSchema: {
              type: 'object',
              properties: {
                projectName: {
                  type: 'string',
                  description: 'Azure DevOps project name'
                }
              },
              required: ['projectName']
            }
          },
          {
            name: 'devops_pipeline_intelligence',
            description: 'Get pipeline intelligence and build patterns for a project',
            inputSchema: {
              type: 'object',
              properties: {
                projectName: {
                  type: 'string',
                  description: 'Azure DevOps project name'
                }
              },
              required: ['projectName']
            }
          },
          {
            name: 'devops_index_git_history',
            description: 'Index Git commit history for semantic search',
            inputSchema: {
              type: 'object',
              properties: {
                projectName: {
                  type: 'string',
                  description: 'Azure DevOps project name'
                },
                repositoryId: {
                  type: 'string',
                  description: 'Repository ID or name'
                }
              },
              required: ['projectName', 'repositoryId']
            }
          },
          {
            name: 'devops_index_work_items',
            description: 'Index work items for semantic search',
            inputSchema: {
              type: 'object',
              properties: {
                projectName: {
                  type: 'string',
                  description: 'Azure DevOps project name'
                }
              },
              required: ['projectName']
            }
          },
          {
            name: 'devops_index_builds',
            description: 'Index build/pipeline history for semantic search',
            inputSchema: {
              type: 'object',
              properties: {
                projectName: {
                  type: 'string',
                  description: 'Azure DevOps project name'
                }
              },
              required: ['projectName']
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
          case 'devops_search': {
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
                      title: result.title || result.message || `${result.type} ${result.id}`,
                      content: result.content,
                      similarity: Math.round(result.similarity * 100) + '%',
                      metadata: {
                        project: result.project,
                        id: result.id || result.commitId,
                        author: result.author || result.assignedTo,
                        date: result.date || result.createdDate || result.startTime
                      }
                    }))
                  }, null, 2)
                }
              ]
            };
          }

          case 'devops_index_project': {
            const { projectName, repositoryId } = args as { projectName: string; repositoryId?: string };
            await this.ragService.indexProject(projectName, repositoryId);
            
            return {
              content: [
                {
                  type: 'text',
                  text: `✅ Successfully indexed Azure DevOps project: ${projectName}${repositoryId ? ` (repository: ${repositoryId})` : ''}`
                }
              ]
            };
          }

          case 'devops_code_intelligence': {
            const { projectName, repositoryId } = args as { projectName: string; repositoryId: string };
            const intelligence = await this.ragService.getCodeIntelligence(projectName, repositoryId);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(intelligence, null, 2)
                }
              ]
            };
          }

          case 'devops_work_item_intelligence': {
            const { projectName } = args as { projectName: string };
            const intelligence = await this.ragService.getWorkItemIntelligence(projectName);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(intelligence, null, 2)
                }
              ]
            };
          }

          case 'devops_pipeline_intelligence': {
            const { projectName } = args as { projectName: string };
            const intelligence = await this.ragService.getPipelineIntelligence(projectName);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(intelligence, null, 2)
                }
              ]
            };
          }

          case 'devops_index_git_history': {
            const { projectName, repositoryId } = args as { projectName: string; repositoryId: string };
            await this.ragService.indexGitHistory(projectName, repositoryId);
            
            return {
              content: [
                {
                  type: 'text',
                  text: `✅ Successfully indexed Git history for ${projectName}/${repositoryId}`
                }
              ]
            };
          }

          case 'devops_index_work_items': {
            const { projectName } = args as { projectName: string };
            await this.ragService.indexWorkItems(projectName);
            
            return {
              content: [
                {
                  type: 'text',
                  text: `✅ Successfully indexed work items for ${projectName}`
                }
              ]
            };
          }

          case 'devops_index_builds': {
            const { projectName } = args as { projectName: string };
            await this.ragService.indexBuildHistory(projectName);
            
            return {
              content: [
                {
                  type: 'text',
                  text: `✅ Successfully indexed build history for ${projectName}`
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
          `Azure DevOps RAG operation failed: ${errorMessage}`
        );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🚀 Azure DevOps RAG MCP Server running on stdio');
  }
}

// Start the server
const server = new DevOpsRAGMCPServer();
server.run().catch(console.error);