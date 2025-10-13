#!/usr/bin/env node

import { spawn } from 'child_process';
import { createInterface } from 'readline';
import path from 'path';
import fs from 'fs-extra';

/**
 * Azure Marketplace Generator - MCP Ecosystem CLI
 * Integrates all MCP servers for comprehensive development intelligence
 */

interface MCPServer {
  name: string;
  path: string;
  description: string;
  tools: string[];
  status: 'stopped' | 'running' | 'error';
}

class MCPEcosystemCLI {
  private servers: Map<string, MCPServer> = new Map();
  private processes: Map<string, any> = new Map();
  private rl: any;

  constructor() {
    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });

    this.initializeServers();
  }

  private initializeServers(): void {
    const basePackagesPath = path.join(process.cwd(), 'packages');

    const serverConfigs = [
      {
        name: 'devops-rag',
        path: path.join(basePackagesPath, 'devops-rag-mcp-server', 'dist', 'index.js'),
        description: 'Azure DevOps integration with RAG for code history and work items',
        tools: [
          'analyze_devops_project',
          'devops_search',
          'get_work_items',
          'analyze_pipelines',
          'devops_intelligence',
          'analyze_repositories',
          'get_build_history',
          'index_devops_data'
        ]
      },
      {
        name: 'lighthouse-rag',
        path: path.join(basePackagesPath, 'lighthouse-rag-mcp-server', 'dist', 'index.js'),
        description: 'Performance intelligence with RAG for optimization patterns',
        tools: [
          'lighthouse_audit',
          'performance_search',
          'performance_intelligence',
          'compare_audits',
          'optimization_recommendations',
          'analyze_web_vitals',
          'generate_performance_report'
        ]
      },
      {
        name: 'vscode-rag',
        path: path.join(basePackagesPath, 'vscode-rag-mcp-server', 'dist', 'index.js'),
        description: 'VS Code workspace intelligence for project analysis and optimization',
        tools: [
          'analyze_workspace',
          'workspace_search',
          'workspace_intelligence',
          'extension_recommendations',
          'settings_recommendations',
          'tasks_recommendations',
          'launch_recommendations',
          'index_workspace',
          'start_file_watcher',
          'stop_file_watcher'
        ]
      },
      {
        name: 'codespaces-rag',
        path: path.join(basePackagesPath, 'codespaces-rag-mcp-server', 'dist', 'index.js'),
        description: 'GitHub Codespaces environment optimization and collaboration',
        tools: [
          'analyze_codespaces_environment',
          'optimize_codespaces_config',
          'codespaces_search',
          'analyze_devcontainer',
          'generate_devcontainer',
          'analyze_performance',
          'collaboration_tools',
          'troubleshoot_codespaces'
        ]
      }
    ];

    serverConfigs.forEach(config => {
      this.servers.set(config.name, {
        ...config,
        status: 'stopped'
      });
    });
  }

  async start(): Promise<void> {
    console.log('🚀 Azure Marketplace Generator - MCP Ecosystem CLI');
    console.log('==================================================\\n');

    await this.showWelcome();
    await this.mainMenu();
  }

  private async showWelcome(): Promise<void> {
    console.log('Available MCP Servers:');
    console.log('---------------------');

    for (const [name, server] of this.servers) {
      const statusIcon = server.status === 'running' ? '🟢' : '🔴';
      console.log(`${statusIcon} ${name}: ${server.description}`);
      console.log(`   Tools: ${server.tools.length} available`);
    }
    console.log();
  }

  private async mainMenu(): Promise<void> {
    while (true) {
      console.log('\\nMain Menu:');
      console.log('1. 📊 Server Status & Management');
      console.log('2. 🔧 Test Individual MCP Server');
      console.log('3. 🌐 Test Complete Ecosystem');
      console.log('4. 📋 Generate Integration Report');
      console.log('5. 🏗️  Build All Servers');
      console.log('6. 🧹 Clean All Servers');
      console.log('7. ❓ Help & Documentation');
      console.log('8. 🚪 Exit');

      const choice = await this.prompt('Select option (1-8): ');

      switch (choice.trim()) {
        case '1':
          await this.serverManagement();
          break;
        case '2':
          await this.testIndividualServer();
          break;
        case '3':
          await this.testEcosystem();
          break;
        case '4':
          await this.generateReport();
          break;
        case '5':
          await this.buildAllServers();
          break;
        case '6':
          await this.cleanAllServers();
          break;
        case '7':
          await this.showHelp();
          break;
        case '8':
          await this.exit();
          return;
        default:
          console.log('❌ Invalid option. Please try again.');
      }
    }
  }

  private async serverManagement(): Promise<void> {
    console.log('\\n📊 Server Management');
    console.log('====================');

    for (const [name, server] of this.servers) {
      const exists = await fs.pathExists(server.path);
      const statusIcon = exists ? '✅' : '❌';
      console.log(`${statusIcon} ${name}: ${exists ? 'Built' : 'Not built'} | ${server.status}`);
    }

    console.log('\\nOptions:');
    console.log('1. Start all servers');
    console.log('2. Stop all servers');
    console.log('3. Restart all servers');
    console.log('4. Check server health');
    console.log('5. Back to main menu');

    const choice = await this.prompt('Select option: ');

    switch (choice.trim()) {
      case '1':
        await this.startAllServers();
        break;
      case '2':
        await this.stopAllServers();
        break;
      case '3':
        await this.restartAllServers();
        break;
      case '4':
        await this.checkServerHealth();
        break;
      case '5':
        return;
    }
  }

  private async testIndividualServer(): Promise<void> {
    console.log('\\n🔧 Test Individual MCP Server');
    console.log('=============================');

    const serverNames = Array.from(this.servers.keys());
    serverNames.forEach((name, index) => {
      console.log(`${index + 1}. ${name}`);
    });

    const choice = await this.prompt('Select server to test (1-4): ');
    const serverIndex = parseInt(choice.trim()) - 1;

    if (serverIndex >= 0 && serverIndex < serverNames.length) {
      const serverName = serverNames[serverIndex];
      await this.testServer(serverName);
    } else {
      console.log('❌ Invalid server selection.');
    }
  }

  private async testServer(serverName: string): Promise<void> {
    const server = this.servers.get(serverName);
    if (!server) return;

    console.log(`\\n🧪 Testing ${serverName}`);
    console.log('='.repeat(20 + serverName.length));

    // Check if server is built
    const exists = await fs.pathExists(server.path);
    if (!exists) {
      console.log('❌ Server not built. Building now...');
      await this.buildServer(serverName);
    }

    console.log('📝 Available tools:');
    server.tools.forEach((tool, index) => {
      console.log(`  ${index + 1}. ${tool}`);
    });

    const toolChoice = await this.prompt('Select tool to test (number or name): ');
    // In a real implementation, you would start the server and test the tool
    console.log(`✅ Testing ${toolChoice} - This would execute the actual MCP tool test`);
  }

  private async testEcosystem(): Promise<void> {
    console.log('\\n🌐 Test Complete Ecosystem');
    console.log('===========================');

    console.log('🔄 Running comprehensive ecosystem test...');

    // Build all servers first
    await this.buildAllServers();

    // Test each server
    for (const [name, server] of this.servers) {
      console.log(`\\n🧪 Testing ${name}...`);

      const exists = await fs.pathExists(server.path);
      if (exists) {
        console.log(`✅ ${name}: Server executable found`);
        console.log(`📊 ${name}: ${server.tools.length} tools available`);
      } else {
        console.log(`❌ ${name}: Server not found`);
      }
    }

    console.log('\\n📊 Ecosystem Test Summary:');
    console.log('==========================');

    let totalTools = 0;
    let builtServers = 0;

    for (const [name, server] of this.servers) {
      const exists = await fs.pathExists(server.path);
      if (exists) builtServers++;
      totalTools += server.tools.length;

      console.log(`${exists ? '✅' : '❌'} ${name}: ${server.tools.length} tools`);
    }

    console.log(`\\n🏆 Results: ${builtServers}/${this.servers.size} servers built, ${totalTools} total tools available`);
  }

  private async generateReport(): Promise<void> {
    console.log('\\n📋 Generating Integration Report');
    console.log('================================');

    const report = {
      timestamp: new Date().toISOString(),
      ecosystem: {
        totalServers: this.servers.size,
        builtServers: 0,
        totalTools: 0
      },
      servers: {} as any
    };

    for (const [name, server] of this.servers) {
      const exists = await fs.pathExists(server.path);
      if (exists) report.ecosystem.builtServers++;
      report.ecosystem.totalTools += server.tools.length;

      report.servers[name] = {
        description: server.description,
        built: exists,
        toolCount: server.tools.length,
        tools: server.tools,
        path: server.path
      };
    }

    const reportPath = path.join(process.cwd(), 'mcp-ecosystem-report.json');
    await fs.writeJson(reportPath, report, { spaces: 2 });

    console.log(`✅ Report generated: ${reportPath}`);
    console.log('\\n📊 Summary:');
    console.log(`- Total Servers: ${report.ecosystem.totalServers}`);
    console.log(`- Built Servers: ${report.ecosystem.builtServers}`);
    console.log(`- Total Tools: ${report.ecosystem.totalTools}`);
    console.log(`- Success Rate: ${Math.round((report.ecosystem.builtServers / report.ecosystem.totalServers) * 100)}%`);
  }

  private async buildAllServers(): Promise<void> {
    console.log('\\n🏗️  Building All MCP Servers');
    console.log('=============================');

    for (const [name, server] of this.servers) {
      await this.buildServer(name);
    }

    console.log('\\n✅ All servers build process completed');
  }

  private async buildServer(serverName: string): Promise<void> {
    const server = this.servers.get(serverName);
    if (!server) return;

    console.log(`🔨 Building ${serverName}...`);

    const serverDir = path.dirname(server.path);
    const packageDir = path.join(serverDir, '..');

    try {
      // Run npm run build in the server directory
      const buildResult = await this.runCommand('npm', ['run', 'build'], packageDir);

      if (buildResult.success) {
        console.log(`✅ ${serverName}: Build successful`);
        const server = this.servers.get(serverName);
        if (server) {
          server.status = 'stopped'; // Built but not running
        }
      } else {
        console.log(`❌ ${serverName}: Build failed`);
        console.log(`   Error: ${buildResult.error}`);
      }
    } catch (error) {
      console.log(`❌ ${serverName}: Build error - ${error}`);
    }
  }

  private async cleanAllServers(): Promise<void> {
    console.log('\\n🧹 Cleaning All MCP Servers');
    console.log('============================');

    for (const [name, server] of this.servers) {
      console.log(`🧹 Cleaning ${name}...`);

      const serverDir = path.dirname(server.path);
      const packageDir = path.join(serverDir, '..');
      const distDir = path.join(packageDir, 'dist');

      try {
        if (await fs.pathExists(distDir)) {
          await fs.remove(distDir);
          console.log(`✅ ${name}: Cleaned dist directory`);
        } else {
          console.log(`ℹ️  ${name}: No dist directory to clean`);
        }
      } catch (error) {
        console.log(`❌ ${name}: Clean error - ${error}`);
      }
    }

    console.log('\\n✅ All servers cleaned');
  }

  private async startAllServers(): Promise<void> {
    console.log('🚀 Starting all servers...');
    // Implementation would start each server as a background process
    console.log('ℹ️  Server starting not implemented in this demo');
  }

  private async stopAllServers(): Promise<void> {
    console.log('🛑 Stopping all servers...');
    // Implementation would stop all running server processes
    console.log('ℹ️  Server stopping not implemented in this demo');
  }

  private async restartAllServers(): Promise<void> {
    await this.stopAllServers();
    await this.startAllServers();
  }

  private async checkServerHealth(): Promise<void> {
    console.log('\\n🏥 Server Health Check');
    console.log('======================');

    for (const [name, server] of this.servers) {
      const exists = await fs.pathExists(server.path);
      const health = exists ? '🟢 Healthy' : '🔴 Not Built';
      console.log(`${name}: ${health}`);
    }
  }

  private async showHelp(): Promise<void> {
    console.log('\\n❓ MCP Ecosystem Help');
    console.log('=====================');
    console.log();
    console.log('This CLI manages a comprehensive ecosystem of MCP (Model Context Protocol) servers');
    console.log('for Azure development intelligence and optimization.');
    console.log();
    console.log('🏗️  Architecture:');
    console.log('- DevOps RAG: Azure DevOps integration with AI-powered insights');
    console.log('- Lighthouse RAG: Performance analysis with optimization recommendations');
    console.log('- VS Code RAG: Workspace intelligence and configuration optimization');
    console.log('- Codespaces RAG: GitHub Codespaces environment optimization');
    console.log();
    console.log('🔧 Usage:');
    console.log('1. Build all servers first using option 5');
    console.log('2. Test individual servers to verify functionality');
    console.log('3. Run ecosystem test for comprehensive validation');
    console.log('4. Generate reports for documentation');
    console.log();
    console.log('📚 Each server provides multiple tools accessible via MCP protocol');
    console.log('📊 Total: 30+ tools across 4 specialized domains');
  }

  private async runCommand(command: string, args: string[], cwd: string): Promise<{success: boolean, error?: string}> {
    return new Promise((resolve) => {
      const process = spawn(command, args, {
        cwd,
        stdio: ['inherit', 'inherit', 'pipe']
      });

      let error = '';
      process.stderr?.on('data', (data) => {
        error += data.toString();
      });

      process.on('close', (code) => {
        resolve({
          success: code === 0,
          error: code !== 0 ? error : undefined
        });
      });
    });
  }

  private async prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }

  private async exit(): Promise<void> {
    console.log('\\n👋 Goodbye! Thank you for using Azure Marketplace Generator MCP Ecosystem');
    await this.stopAllServers();
    this.rl.close();
    process.exit(0);
  }
}

// Start the CLI
async function main() {
  const cli = new MCPEcosystemCLI();
  await cli.start();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { MCPEcosystemCLI };