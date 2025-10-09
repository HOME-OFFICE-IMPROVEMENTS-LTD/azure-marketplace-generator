#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * GitHub Codespaces MCP Server
 * Provides environment optimization and collaboration features
 */

class CodespacesMCPServer {
  private workspacePath: string;

  constructor() {
    this.workspacePath = process.cwd();
  }

  async setup() {
    const server = new Server(
      {
        name: 'codespaces-rag-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // List available tools
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'analyze_codespaces_environment',
            description: 'Analyze the current Codespaces environment and configuration',
            inputSchema: {
              type: 'object',
              properties: {
                workspacePath: {
                  type: 'string',
                  description: 'Optional workspace path to analyze'
                }
              }
            }
          },
          {
            name: 'optimize_codespaces_config',
            description: 'Generate optimization recommendations for Codespaces configuration',
            inputSchema: {
              type: 'object',
              properties: {
                workspacePath: {
                  type: 'string',
                  description: 'Optional workspace path to optimize'
                },
                focus: {
                  type: 'string',
                  enum: ['performance', 'security', 'collaboration', 'all'],
                  description: 'Focus area for optimization'
                }
              }
            }
          },
          {
            name: 'codespaces_search',
            description: 'Search Codespaces knowledge base for answers',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Question about Codespaces'
                }
              },
              required: ['query']
            }
          },
          {
            name: 'analyze_devcontainer',
            description: 'Analyze and validate devcontainer.json configuration',
            inputSchema: {
              type: 'object',
              properties: {
                workspacePath: {
                  type: 'string',
                  description: 'Optional workspace path to analyze'
                }
              }
            }
          },
          {
            name: 'generate_devcontainer',
            description: 'Generate devcontainer.json based on project analysis',
            inputSchema: {
              type: 'object',
              properties: {
                workspacePath: {
                  type: 'string',
                  description: 'Optional workspace path to analyze'
                },
                projectType: {
                  type: 'string',
                  enum: ['node', 'python', 'java', 'dotnet', 'go', 'rust', 'php', 'ruby', 'auto-detect'],
                  description: 'Project type for devcontainer generation'
                }
              }
            }
          },
          {
            name: 'analyze_performance',
            description: 'Analyze Codespaces performance and resource usage',
            inputSchema: {
              type: 'object',
              properties: {
                workspacePath: {
                  type: 'string',
                  description: 'Optional workspace path to analyze'
                }
              }
            }
          },
          {
            name: 'collaboration_tools',
            description: 'Get collaboration tools and tips for Codespaces',
            inputSchema: {
              type: 'object',
              properties: {
                feature: {
                  type: 'string',
                  enum: ['live-share', 'github-integration', 'pull-requests', 'pair-programming', 'all'],
                  description: 'Specific collaboration feature to focus on'
                }
              }
            }
          },
          {
            name: 'troubleshoot_codespaces',
            description: 'Get troubleshooting tips for common Codespaces issues',
            inputSchema: {
              type: 'object',
              properties: {
                issue: {
                  type: 'string',
                  description: 'Description of the issue you are experiencing'
                }
              },
              required: ['issue']
            }
          }
        ]
      };
    });

    // Handle tool calls
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'analyze_codespaces_environment':
            return await this.analyzeCodespacesEnvironment(args?.workspacePath as string);

          case 'optimize_codespaces_config':
            return await this.optimizeCodespacesConfig(args?.workspacePath as string, args?.focus as string);

          case 'codespaces_search':
            return await this.codespacesSearch(args?.query as string);

          case 'analyze_devcontainer':
            return await this.analyzeDevContainer(args?.workspacePath as string);

          case 'generate_devcontainer':
            return await this.generateDevContainer(args?.workspacePath as string, args?.projectType as string);

          case 'analyze_performance':
            return await this.analyzePerformance(args?.workspacePath as string);

          case 'collaboration_tools':
            return await this.getCollaborationTools(args?.feature as string);

          case 'troubleshoot_codespaces':
            return await this.troubleshootCodespaces(args?.issue as string);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
            }
          ],
          isError: true
        };
      }
    });

    return server;
  }

  private async analyzeCodespacesEnvironment(workspacePath?: string): Promise<any> {
    const wsPath = workspacePath || this.workspacePath;
    
    const environment: any = {
      isCodespace: !!process.env.CODESPACES,
      codespaceName: process.env.CODESPACE_NAME,
      machine: process.env.CODESPACES_MACHINE,
      runtime: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    };

    if (process.env.CODESPACES) {
      environment.github = {
        user: process.env.GITHUB_USER,
        repository: process.env.GITHUB_REPOSITORY,
        ref: process.env.GITHUB_REF,
        sha: process.env.GITHUB_SHA,
        token: !!process.env.GITHUB_TOKEN
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            environment,
            analysis: 'Codespaces environment analyzed successfully',
            workspace: wsPath,
            timestamp: new Date().toISOString()
          }, null, 2)
        }
      ]
    };
  }

  private async optimizeCodespacesConfig(workspacePath?: string, focus?: string): Promise<any> {
    const wsPath = workspacePath || this.workspacePath;
    const focusArea = focus || 'all';

    const recommendations = {
      performance: [
        'Use prebuilds for faster container startup',
        'Optimize Docker layers',
        'Choose appropriate machine type',
        'Use .gitignore to exclude unnecessary files'
      ],
      security: [
        'Use Codespace secrets for sensitive data',
        'Limit port visibility appropriately',
        'Regularly update base images',
        'Use minimal base images'
      ],
      collaboration: [
        'Share devcontainer configuration',
        'Document environment setup',
        'Configure consistent formatting',
        'Use Live Share for real-time collaboration'
      ],
      configuration: [
        'Create .devcontainer/devcontainer.json',
        'Pin specific versions of tools',
        'Configure appropriate port forwarding',
        'Set up post-creation commands'
      ]
    };

    const selectedRecommendations = focusArea === 'all' 
      ? recommendations 
      : { [focusArea]: (recommendations as any)[focusArea] || [] };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            workspace: wsPath,
            focus: focusArea,
            recommendations: selectedRecommendations,
            nextSteps: [
              'Review the recommendations',
              'Implement configuration changes',
              'Test the environment',
              'Share with team members'
            ]
          }, null, 2)
        }
      ]
    };
  }

  private async codespacesSearch(query: string): Promise<any> {
    // Simplified knowledge base responses
    const knowledgeBase = {
      'slow startup': {
        answer: 'Slow Codespace startup can be improved by using prebuilds, optimizing your Dockerfile, and choosing appropriate base images.',
        tips: [
          'Enable prebuilds in repository settings',
          'Use multi-stage Docker builds',
          'Cache dependencies in Docker layers',
          'Choose minimal base images'
        ]
      },
      'port forwarding': {
        answer: 'Port forwarding in Codespaces allows you to access services running in your container.',
        tips: [
          'Configure ports in devcontainer.json',
          'Set appropriate visibility (private/public)',
          'Ensure services bind to 0.0.0.0',
          'Use VS Code ports panel to manage forwarding'
        ]
      },
      'extensions': {
        answer: 'Extensions can be automatically installed in Codespaces through devcontainer configuration.',
        tips: [
          'Add extensions to devcontainer.json',
          'Use .vscode/extensions.json for recommendations',
          'Consider extension compatibility',
          'Use extension packs for related tools'
        ]
      }
    };

    const searchKey = Object.keys(knowledgeBase).find(key => 
      query.toLowerCase().includes(key)
    );

    const result = searchKey ? (knowledgeBase as any)[searchKey] : {
      answer: 'I can help with Codespaces configuration, performance optimization, port forwarding, extensions, and troubleshooting.',
      tips: [
        'Use specific keywords like "slow startup", "port forwarding", "extensions"',
        'Ask about devcontainer.json configuration',
        'Request troubleshooting for specific issues',
        'Inquire about collaboration features'
      ]
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            query,
            answer: result.answer,
            tips: result.tips,
            relatedTopics: Object.keys(knowledgeBase)
          }, null, 2)
        }
      ]
    };
  }

  private async analyzeDevContainer(workspacePath?: string): Promise<any> {
    const wsPath = workspacePath || this.workspacePath;
    
    // Check for devcontainer files
    const fs = await import('fs-extra');
    const path = await import('path');
    
    const configPaths = [
      '.devcontainer/devcontainer.json',
      '.devcontainer.json'
    ];

    const analysis: any = {
      hasDevContainer: false,
      configurations: [],
      recommendations: []
    };

    for (const configPath of configPaths) {
      const fullPath = path.join(wsPath, configPath);
      try {
        if (await fs.pathExists(fullPath)) {
          const content = await fs.readJson(fullPath);
          analysis.hasDevContainer = true;
          analysis.configurations.push({
            path: configPath,
            config: content,
            features: Object.keys(content.features || {}),
            extensions: content.customizations?.vscode?.extensions || [],
            forwardPorts: content.forwardPorts || []
          });
        }
      } catch (error) {
        console.warn(`Failed to parse ${configPath}:`, error);
      }
    }

    if (!analysis.hasDevContainer) {
      analysis.recommendations.push(
        'Create .devcontainer/devcontainer.json for consistent environment',
        'Add features for common tools (Node.js, Git, GitHub CLI)',
        'Configure VS Code extensions',
        'Set up port forwarding for development servers'
      );
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(analysis, null, 2)
        }
      ]
    };
  }

  private async generateDevContainer(workspacePath?: string, projectType?: string): Promise<any> {
    const wsPath = workspacePath || this.workspacePath;
    const type = projectType || 'auto-detect';

    // Basic devcontainer templates
    const templates = {
      node: {
        name: 'Node.js Development Container',
        image: 'mcr.microsoft.com/vscode/devcontainers/javascript-node:latest',
        features: {
          'ghcr.io/devcontainers/features/node:1': { version: 'lts' }
        },
        customizations: {
          vscode: {
            extensions: [
              'ms-vscode.vscode-typescript-next',
              'esbenp.prettier-vscode',
              'bradlc.vscode-tailwindcss'
            ]
          }
        },
        forwardPorts: [3000, 8080],
        postCreateCommand: 'npm install'
      },
      python: {
        name: 'Python Development Container',
        image: 'mcr.microsoft.com/vscode/devcontainers/python:latest',
        features: {
          'ghcr.io/devcontainers/features/python:1': { version: '3.11' }
        },
        customizations: {
          vscode: {
            extensions: [
              'ms-python.python',
              'ms-python.debugpy',
              'ms-python.pylint'
            ]
          }
        },
        forwardPorts: [5000, 8000],
        postCreateCommand: 'pip install -r requirements.txt'
      },
      universal: {
        name: 'Universal Development Container',
        image: 'mcr.microsoft.com/vscode/devcontainers/universal:latest',
        features: {
          'ghcr.io/devcontainers/features/node:1': { version: 'lts' },
          'ghcr.io/devcontainers/features/python:1': { version: '3.11' },
          'ghcr.io/devcontainers/features/git:1': {},
          'ghcr.io/devcontainers/features/github-cli:1': {}
        },
        customizations: {
          vscode: {
            extensions: [
              'ms-vscode.vscode-typescript-next',
              'ms-python.python',
              'esbenp.prettier-vscode'
            ]
          }
        },
        forwardPorts: [3000, 5000, 8000, 8080]
      }
    };

    const selectedTemplate = (templates as any)[type] || templates.universal;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            workspace: wsPath,
            projectType: type,
            devcontainer: selectedTemplate,
            instructions: [
              'Save this configuration to .devcontainer/devcontainer.json',
              'Commit the configuration to your repository',
              'Rebuild the Codespace to apply changes',
              'Customize further based on your specific needs'
            ]
          }, null, 2)
        }
      ]
    };
  }

  private async analyzePerformance(workspacePath?: string): Promise<any> {
    const wsPath = workspacePath || this.workspacePath;
    
    const performance: any = {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      workspace: wsPath,
      recommendations: []
    };

    // Add recommendations based on usage
    const memUsagePercent = (performance.memory.heapUsed / performance.memory.heapTotal) * 100;
    
    if (memUsagePercent > 80) {
      performance.recommendations.push(
        'High memory usage detected - consider upgrading machine type',
        'Review memory-intensive processes',
        'Clear unnecessary cached data'
      );
    }

    if (performance.uptime < 300) { // Less than 5 minutes
      performance.recommendations.push(
        'Recently started - performance will improve as caches warm up',
        'Consider using prebuilds for faster startup'
      );
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(performance, null, 2)
        }
      ]
    };
  }

  private async getCollaborationTools(feature?: string): Promise<any> {
    const tools = {
      'live-share': {
        description: 'Real-time collaborative editing',
        setup: [
          'Install Live Share extension',
          'Start sharing session',
          'Share session link with collaborators',
          'Use voice/video when available'
        ],
        features: [
          'Shared editing',
          'Shared terminals',
          'Shared servers',
          'Audio/video calling'
        ]
      },
      'github-integration': {
        description: 'Seamless GitHub workflow integration',
        setup: [
          'Codespaces automatically connects to GitHub',
          'Use GitHub CLI for advanced operations',
          'Configure GitHub credentials if needed'
        ],
        features: [
          'Repository access',
          'Pull request creation',
          'Issue management',
          'Action workflows'
        ]
      },
      'pull-requests': {
        description: 'Code review and collaboration',
        setup: [
          'Install GitHub Pull Requests extension',
          'Authenticate with GitHub',
          'Configure review settings'
        ],
        features: [
          'In-editor code review',
          'Comment on code',
          'Approve/request changes',
          'Merge pull requests'
        ]
      },
      'pair-programming': {
        description: 'Collaborative coding practices',
        setup: [
          'Use Live Share for real-time collaboration',
          'Share specific files or entire workspace',
          'Take turns driving and navigating'
        ],
        features: [
          'Shared editing',
          'Voice communication',
          'Screen sharing',
          'Session recording'
        ]
      }
    };

    const selectedTools = feature && feature !== 'all' 
      ? { [feature]: (tools as any)[feature] || {} }
      : tools;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            collaborationTools: selectedTools,
            generalTips: [
              'Document your collaboration workflow',
              'Set up consistent development environments',
              'Use shared settings and extensions',
              'Establish communication protocols'
            ]
          }, null, 2)
        }
      ]
    };
  }

  private async troubleshootCodespaces(issue: string): Promise<any> {
    const troubleshooting: any = {
      commonSolutions: [
        'Rebuild the container to apply configuration changes',
        'Check VS Code developer console for error messages',
        'Verify network connectivity for port forwarding',
        'Ensure sufficient storage space is available'
      ],
      specificSolutions: [],
      nextSteps: [
        'Try the suggested solutions',
        'Check Codespaces documentation',
        'Contact GitHub Support if issue persists',
        'Report bugs to GitHub Community'
      ]
    };

    // Simple keyword matching for common issues
    const issueLower = issue.toLowerCase();
    
    if (issueLower.includes('slow') || issueLower.includes('performance')) {
      troubleshooting.specificSolutions.push(
        'Enable prebuilds for faster startup',
        'Use smaller base images',
        'Optimize Docker layers',
        'Consider upgrading machine type'
      );
    }
    
    if (issueLower.includes('port') || issueLower.includes('forwarding')) {
      troubleshooting.specificSolutions.push(
        'Check if service is listening on 0.0.0.0',
        'Verify port configuration in devcontainer.json',
        'Set appropriate port visibility',
        'Use VS Code ports panel to manage forwarding'
      );
    }
    
    if (issueLower.includes('extension')) {
      troubleshooting.specificSolutions.push(
        'Check extension compatibility with Codespaces',
        'Verify extension is listed in devcontainer.json',
        'Restart VS Code or rebuild container',
        'Check extension marketplace connectivity'
      );
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            issue,
            troubleshooting,
            additionalResources: [
              'GitHub Codespaces Documentation',
              'VS Code Remote Development Troubleshooting',
              'GitHub Community Discussions',
              'GitHub Support'
            ]
          }, null, 2)
        }
      ]
    };
  }
}

async function main() {
  const mcpServer = new CodespacesMCPServer();
  const server = await mcpServer.setup();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Codespaces RAG MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});