#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { VSCodeRAGService } from './services/VSCodeRAGService.js';
import { z } from 'zod';

// Environment validation
const EnvSchema = z.object({
  AZURE_OPENAI_ENDPOINT: z.string().url(),
  AZURE_OPENAI_KEY: z.string().min(1),
  AZURE_OPENAI_DEPLOYMENT_NAME: z.string().default('text-embedding-ada-002'),
  WORKSPACE_PATH: z.string().optional(),
});

/**
 * VS Code MCP Server with Workspace Intelligence
 * 
 * Features:
 * - Workspace structure analysis
 * - Project configuration recommendations
 * - Extension and settings optimization
 * - Development environment setup
 * - Real-time workspace monitoring
 */
class VSCodeRAGMCPServer {
  private server: Server;
  private ragService: VSCodeRAGService;

  constructor() {
    // Validate environment variables
    const env = EnvSchema.parse(process.env);
    
    this.server = new Server(
      {
        name: 'vscode-rag-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.ragService = new VSCodeRAGService(env.WORKSPACE_PATH);
    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'analyze_workspace',
            description: 'Analyze VS Code workspace structure and configuration',
            inputSchema: {
              type: 'object',
              properties: {
                workspacePath: {
                  type: 'string',
                  description: 'Path to workspace directory (optional, uses current directory if not provided)'
                }
              },
              required: []
            }
          },
          {
            name: 'workspace_search',
            description: 'Semantic search across workspace analysis and configurations',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query for workspace insights'
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
            name: 'workspace_intelligence',
            description: 'Get comprehensive workspace intelligence and recommendations',
            inputSchema: {
              type: 'object',
              properties: {
                workspacePath: {
                  type: 'string',
                  description: 'Path to workspace directory (optional)'
                }
              },
              required: []
            }
          },
          {
            name: 'extension_recommendations',
            description: 'Get VS Code extension recommendations based on project analysis',
            inputSchema: {
              type: 'object',
              properties: {
                workspacePath: {
                  type: 'string',
                  description: 'Path to workspace directory (optional)'
                }
              },
              required: []
            }
          },
          {
            name: 'settings_recommendations',
            description: 'Get VS Code settings recommendations for the workspace',
            inputSchema: {
              type: 'object',
              properties: {
                workspacePath: {
                  type: 'string',
                  description: 'Path to workspace directory (optional)'
                }
              },
              required: []
            }
          },
          {
            name: 'tasks_recommendations',
            description: 'Get VS Code tasks configuration recommendations',
            inputSchema: {
              type: 'object',
              properties: {
                workspacePath: {
                  type: 'string',
                  description: 'Path to workspace directory (optional)'
                }
              },
              required: []
            }
          },
          {
            name: 'launch_recommendations',
            description: 'Get VS Code launch configuration recommendations',
            inputSchema: {
              type: 'object',
              properties: {
                workspacePath: {
                  type: 'string',
                  description: 'Path to workspace directory (optional)'
                }
              },
              required: []
            }
          },
          {
            name: 'index_workspace',
            description: 'Index workspace content for semantic search',
            inputSchema: {
              type: 'object',
              properties: {
                workspacePath: {
                  type: 'string',
                  description: 'Path to workspace directory (optional)'
                }
              },
              required: []
            }
          },
          {
            name: 'start_file_watcher',
            description: 'Start real-time file watching for workspace changes',
            inputSchema: {
              type: 'object',
              properties: {
                workspacePath: {
                  type: 'string',
                  description: 'Path to workspace directory (optional)'
                }
              },
              required: []
            }
          },
          {
            name: 'stop_file_watcher',
            description: 'Stop file watching',
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
          case 'analyze_workspace': {
            const { workspacePath } = args as { workspacePath?: string };
            const analysis = await this.ragService.analyzeWorkspace(workspacePath);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    status: 'completed',
                    workspace: analysis.path,
                    summary: {
                      totalFiles: analysis.structure?.totalFiles || 0,
                      languages: Object.keys(analysis.structure?.languages || {}),
                      vscodeConfigured: analysis.configuration?.configured || false,
                      gitRepository: analysis.gitInfo?.isGitRepo || false,
                      dependencies: Object.keys(analysis.dependencies || {})
                    },
                    analysis
                  }, null, 2)
                }
              ]
            };
          }

          case 'workspace_search': {
            const { query, limit = 10 } = args as { query: string; limit?: number };
            const results = await this.ragService.semanticSearch(query, limit);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    query,
                    results: results.map(result => ({
                      workspacePath: result.workspacePath,
                      similarity: Math.round(result.similarity * 100) + '%',
                      languages: Object.keys(result.structure?.languages || {}),
                      configured: result.configuration?.configured || false,
                      fileCount: result.structure?.totalFiles || 0
                    }))
                  }, null, 2)
                }
              ]
            };
          }

          case 'workspace_intelligence': {
            const { workspacePath } = args as { workspacePath?: string };
            const intelligence = await this.ragService.getWorkspaceIntelligence(workspacePath);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(intelligence, null, 2)
                }
              ]
            };
          }

          case 'extension_recommendations': {
            const { workspacePath } = args as { workspacePath?: string };
            const extensions = await this.ragService.analyzeExtensionRequirements(workspacePath);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    totalRecommendations: extensions.total,
                    priorityBreakdown: extensions.byPriority,
                    recommendations: extensions.recommended.map((ext: any) => ({
                      id: ext.id,
                      reason: ext.reason,
                      priority: ext.priority
                    }))
                  }, null, 2)
                }
              ]
            };
          }

          case 'settings_recommendations': {
            const { workspacePath } = args as { workspacePath?: string };
            const settings = await this.ragService.analyzeWorkspaceSettings(workspacePath);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(settings, null, 2)
                }
              ]
            };
          }

          case 'tasks_recommendations': {
            const { workspacePath } = args as { workspacePath?: string };
            const tasks = await this.ragService.analyzeTaskConfiguration(workspacePath);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    totalTasks: tasks.total,
                    tasks: tasks.recommended
                  }, null, 2)
                }
              ]
            };
          }

          case 'launch_recommendations': {
            const { workspacePath } = args as { workspacePath?: string };
            const launch = await this.ragService.analyzeLaunchConfiguration(workspacePath);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(launch, null, 2)
                }
              ]
            };
          }

          case 'index_workspace': {
            const { workspacePath } = args as { workspacePath?: string };
            await this.ragService.indexWorkspaceContent(workspacePath);
            
            return {
              content: [
                {
                  type: 'text',
                  text: `✅ Successfully indexed workspace content for RAG search: ${workspacePath || 'current directory'}`
                }
              ]
            };
          }

          case 'start_file_watcher': {
            const { workspacePath } = args as { workspacePath?: string };
            this.ragService.startFileWatcher(workspacePath);
            
            return {
              content: [
                {
                  type: 'text',
                  text: `✅ Started file watching for workspace: ${workspacePath || 'current directory'}`
                }
              ]
            };
          }

          case 'stop_file_watcher': {
            this.ragService.stopFileWatcher();
            
            return {
              content: [
                {
                  type: 'text',
                  text: '✅ Stopped file watching'
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
          `VS Code RAG operation failed: ${errorMessage}`
        );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🚀 VS Code RAG MCP Server running on stdio');
  }
}

// Start the server
const server = new VSCodeRAGMCPServer();
server.run().catch(console.error);