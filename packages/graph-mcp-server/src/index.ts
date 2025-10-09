#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  CallToolRequest
} from '@modelcontextprotocol/sdk/types.js';
import { GraphService } from './services/GraphService.js';
import { AuthService } from './services/AuthService.js';
import { z } from 'zod';

/**
 * Microsoft Graph MCP Server
 * Provides organizational context through Microsoft Graph API
 * Integrates with existing Azure auth infrastructure
 */
class GraphMCPServer {
  private server: Server;
  private graphService: GraphService;
  private authService: AuthService;

  constructor() {
    this.server = new Server(
      { name: 'graph-mcp-server', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );
    
    this.authService = new AuthService();
    this.graphService = new GraphService(this.authService);
    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_user_profile',
          description: 'Get current user profile information',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'search_users',
          description: 'Search for users in the organization',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query for user name or email' },
              limit: { type: 'number', description: 'Maximum number of results (default: 10)' }
            },
            required: ['query']
          }
        },
        {
          name: 'get_organization_groups',
          description: 'Get organization groups and teams',
          inputSchema: {
            type: 'object',
            properties: {
              type: { 
                type: 'string', 
                enum: ['all', 'security', 'microsoft365', 'distribution'],
                description: 'Type of groups to retrieve' 
              },
              limit: { type: 'number', description: 'Maximum number of results (default: 20)' }
            },
            required: []
          }
        },
        {
          name: 'get_user_groups',
          description: 'Get groups for a specific user',
          inputSchema: {
            type: 'object',
            properties: {
              userId: { type: 'string', description: 'User ID or UPN' }
            },
            required: ['userId']
          }
        },
        {
          name: 'get_organization_info',
          description: 'Get organization information and tenant details',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'search_sharepoint_content',
          description: 'Search SharePoint content for RAG capabilities',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query for SharePoint content' },
              siteId: { type: 'string', description: 'Specific SharePoint site ID (optional)' },
              contentType: { 
                type: 'string', 
                enum: ['all', 'documents', 'pages', 'lists'],
                description: 'Type of content to search' 
              },
              limit: { type: 'number', description: 'Maximum number of results (default: 10)' }
            },
            required: ['query']
          }
        },
        {
          name: 'get_teams_content',
          description: 'Get Teams conversations and files for organizational knowledge',
          inputSchema: {
            type: 'object',
            properties: {
              teamId: { type: 'string', description: 'Specific team ID (optional)' },
              channelId: { type: 'string', description: 'Specific channel ID (optional)' },
              query: { type: 'string', description: 'Search query for team content' },
              contentType: { 
                type: 'string', 
                enum: ['messages', 'files', 'all'],
                description: 'Type of Teams content' 
              },
              limit: { type: 'number', description: 'Maximum number of results (default: 10)' }
            },
            required: []
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_user_profile':
            return await this.handleGetUserProfile();
          
          case 'search_users':
            return await this.handleSearchUsers(args);
          
          case 'get_organization_groups':
            return await this.handleGetOrganizationGroups(args);
          
          case 'get_user_groups':
            return await this.handleGetUserGroups(args);
          
          case 'get_organization_info':
            return await this.handleGetOrganizationInfo();
          
          case 'search_sharepoint_content':
            return await this.handleSearchSharePointContent(args);
          
          case 'get_teams_content':
            return await this.handleGetTeamsContent(args);
          
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`Error executing tool ${name}:`, error);
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to execute tool ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });
  }

  private async handleGetUserProfile() {
    const profile = await this.graphService.getCurrentUserProfile();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(profile, null, 2)
        }
      ]
    };
  }

  private async handleSearchUsers(args: any) {
    const schema = z.object({
      query: z.string(),
      limit: z.number().optional().default(10)
    });
    
    const { query, limit } = schema.parse(args);
    const users = await this.graphService.searchUsers(query, limit);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(users, null, 2)
        }
      ]
    };
  }

  private async handleGetOrganizationGroups(args: any) {
    const schema = z.object({
      type: z.enum(['all', 'security', 'microsoft365', 'distribution']).optional().default('all'),
      limit: z.number().optional().default(20)
    });
    
    const { type, limit } = schema.parse(args);
    const groups = await this.graphService.getOrganizationGroups(type, limit);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(groups, null, 2)
        }
      ]
    };
  }

  private async handleGetUserGroups(args: any) {
    const schema = z.object({
      userId: z.string()
    });
    
    const { userId } = schema.parse(args);
    const groups = await this.graphService.getUserGroups(userId);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(groups, null, 2)
        }
      ]
    };
  }

  private async handleGetOrganizationInfo() {
    const orgInfo = await this.graphService.getOrganizationInfo();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(orgInfo, null, 2)
        }
      ]
    };
  }

  private async handleSearchSharePointContent(args: any) {
    const schema = z.object({
      query: z.string(),
      siteId: z.string().optional(),
      contentType: z.enum(['all', 'documents', 'pages', 'lists']).optional().default('all'),
      limit: z.number().optional().default(10)
    });
    
    const { query, siteId, contentType, limit } = schema.parse(args);
    const content = await this.graphService.searchSharePointContent(query, siteId, contentType, limit);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(content, null, 2)
        }
      ]
    };
  }

  private async handleGetTeamsContent(args: any) {
    const schema = z.object({
      teamId: z.string().optional(),
      channelId: z.string().optional(),
      query: z.string().optional(),
      contentType: z.enum(['messages', 'files', 'all']).optional().default('all'),
      limit: z.number().optional().default(10)
    });
    
    const { teamId, channelId, query, contentType, limit } = schema.parse(args);
    const content = await this.graphService.getTeamsContent(teamId, channelId, query, contentType, limit);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(content, null, 2)
        }
      ]
    };
  }

  async start() {
    console.error('🚀 Microsoft Graph MCP Server starting...');
    
    // Initialize authentication
    await this.authService.initialize();
    console.error('✅ Authentication initialized');
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('✅ Graph MCP Server running on stdio');
  }
}

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new GraphMCPServer();
  server.start().catch((error) => {
    console.error('Failed to start Graph MCP Server:', error);
    process.exit(1);
  });
}

export { GraphMCPServer };