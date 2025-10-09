import { OpenAI } from 'openai';
import * as fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';
import ignore, { Ignore } from 'ignore';
import * as git from 'simple-git';
import * as chokidar from 'chokidar';
import * as yaml from 'yaml';
import NodeCache from 'node-cache';
import { z } from 'zod';

/**
 * VS Code Workspace Intelligence Service
 * Provides workspace analysis, project context, and development environment optimization
 */
export class VSCodeRAGService {
  private openaiClient: OpenAI;
  private cache: NodeCache;
  private embeddings: Map<string, number[]>;
  private workspaceData: Map<string, any>;
  private fileWatcher?: chokidar.FSWatcher;
  private gitClient: any;
  private workspacePath: string;

  constructor(workspacePath?: string) {
    // Initialize OpenAI client for Azure OpenAI
    this.openaiClient = new OpenAI({
      apiKey: process.env.AZURE_OPENAI_KEY!,
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT!}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'text-embedding-ada-002'}`,
      defaultQuery: { 'api-version': '2024-02-01' },
      defaultHeaders: {
        'api-key': process.env.AZURE_OPENAI_KEY!,
      },
    });

    this.cache = new NodeCache({ stdTTL: 1800 }); // 30 minutes cache
    this.embeddings = new Map();
    this.workspaceData = new Map();
    this.workspacePath = workspacePath || process.cwd();
    this.gitClient = git.simpleGit(this.workspacePath);
  }

  /**
   * Generate text embedding for workspace analysis
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
   * Analyze workspace structure and configuration
   */
  async analyzeWorkspace(workspacePath?: string): Promise<any> {
    const wsPath = workspacePath || this.workspacePath;
    const cacheKey = `workspace_analysis_${wsPath}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const analysis = {
        path: wsPath,
        timestamp: new Date().toISOString(),
        structure: await this.analyzeProjectStructure(wsPath),
        configuration: await this.analyzeVSCodeConfiguration(wsPath),
        dependencies: await this.analyzeDependencies(wsPath),
        gitInfo: await this.analyzeGitRepository(wsPath),
        extensions: await this.analyzeExtensionRequirements(wsPath),
        settings: await this.analyzeWorkspaceSettings(wsPath),
        tasks: await this.analyzeTaskConfiguration(wsPath),
        launch: await this.analyzeLaunchConfiguration(wsPath)
      };

      this.cache.set(cacheKey, analysis, 1800);
      this.workspaceData.set(wsPath, analysis);

      return analysis;
    } catch (error) {
      console.error('Workspace analysis failed:', error);
      throw error;
    }
  }

  /**
   * Analyze project structure and file organization
   */
  private async analyzeProjectStructure(workspacePath: string): Promise<any> {
    try {
      const ig = ignore();
      const gitignorePath = path.join(workspacePath, '.gitignore');
      
      if (await fs.pathExists(gitignorePath)) {
        const gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
        ig.add(gitignoreContent);
      }

      // Add common ignores
      ig.add([
        'node_modules',
        '.git',
        'dist',
        'build',
        '*.log',
        '.env*',
        '.DS_Store'
      ]);

      const allFiles = await glob('**/*', { 
        cwd: workspacePath,
        dot: true,
        nodir: true
      });

      const files = allFiles.filter(file => !ig.ignores(file));
      
      // Categorize files
      const structure = {
        totalFiles: files.length,
        fileTypes: this.categorizeFiles(files),
        directories: this.analyzeDirectoryStructure(files),
        languages: this.detectLanguages(files),
        configFiles: this.identifyConfigFiles(files),
        documentation: this.identifyDocumentationFiles(files)
      };

      return structure;
    } catch (error: any) {
      console.error('Project structure analysis failed:', error);
      return { error: error?.message || 'Unknown error occurred' };
    }
  }

  /**
   * Categorize files by type and purpose
   */
  private categorizeFiles(files: string[]): any {
    const categories = {
      source: 0,
      test: 0,
      config: 0,
      documentation: 0,
      assets: 0,
      build: 0,
      other: 0
    };

    const extensions = {
      source: ['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.cs', '.cpp', '.c', '.go', '.rs', '.php', '.rb'],
      test: ['.test.js', '.test.ts', '.spec.js', '.spec.ts', '.test.py', '.spec.py'],
      config: ['.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf'],
      documentation: ['.md', '.txt', '.rst', '.adoc', '.docx'],
      assets: ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.css', '.scss', '.sass', '.less'],
      build: ['.dockerfile', 'Dockerfile', '.dockerignore', 'Makefile', '.gitignore']
    };

    files.forEach(file => {
      const ext = path.extname(file).toLowerCase();
      const basename = path.basename(file).toLowerCase();
      
      let categorized = false;
      
      for (const [category, exts] of Object.entries(extensions)) {
        if (exts.some(e => file.includes(e) || basename === e)) {
          categories[category as keyof typeof categories]++;
          categorized = true;
          break;
        }
      }
      
      if (!categorized) {
        categories.other++;
      }
    });

    return categories;
  }

  /**
   * Analyze directory structure and organization patterns
   */
  private analyzeDirectoryStructure(files: string[]): any {
    const directories = new Set<string>();
    const dirDepth: { [key: string]: number } = {};
    
    files.forEach(file => {
      const dir = path.dirname(file);
      if (dir !== '.') {
        directories.add(dir);
        dirDepth[dir] = dir.split(path.sep).length;
      }
    });

    const commonPatterns = {
      src: Array.from(directories).some(d => d.includes('src')),
      lib: Array.from(directories).some(d => d.includes('lib')),
      test: Array.from(directories).some(d => d.includes('test') || d.includes('spec')),
      docs: Array.from(directories).some(d => d.includes('doc')),
      assets: Array.from(directories).some(d => d.includes('asset') || d.includes('static')),
      config: Array.from(directories).some(d => d.includes('config') || d.includes('conf')),
      scripts: Array.from(directories).some(d => d.includes('script')),
      build: Array.from(directories).some(d => d.includes('build') || d.includes('dist'))
    };

    return {
      totalDirectories: directories.size,
      maxDepth: Math.max(...Object.values(dirDepth), 0),
      commonPatterns,
      topLevelDirs: Array.from(directories).filter(d => !d.includes(path.sep)).sort()
    };
  }

  /**
   * Detect programming languages used in the project
   */
  private detectLanguages(files: string[]): any {
    const languages: { [key: string]: number } = {};
    
    const langMap = {
      '.js': 'JavaScript',
      '.jsx': 'JavaScript (React)',
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript (React)',
      '.py': 'Python',
      '.java': 'Java',
      '.cs': 'C#',
      '.cpp': 'C++',
      '.c': 'C',
      '.go': 'Go',
      '.rs': 'Rust',
      '.php': 'PHP',
      '.rb': 'Ruby',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
      '.scala': 'Scala',
      '.clj': 'Clojure',
      '.hs': 'Haskell',
      '.ml': 'OCaml',
      '.elm': 'Elm',
      '.dart': 'Dart',
      '.r': 'R',
      '.jl': 'Julia',
      '.lua': 'Lua',
      '.sh': 'Shell',
      '.ps1': 'PowerShell',
      '.sql': 'SQL'
    };

    files.forEach(file => {
      const ext = path.extname(file).toLowerCase();
      const lang = langMap[ext as keyof typeof langMap];
      if (lang) {
        languages[lang] = (languages[lang] || 0) + 1;
      }
    });

    return Object.entries(languages)
      .sort(([,a], [,b]) => b - a)
      .reduce((acc, [lang, count]) => ({ ...acc, [lang]: count }), {});
  }

  /**
   * Identify configuration files
   */
  private identifyConfigFiles(files: string[]): string[] {
    const configPatterns = [
      'package.json',
      'tsconfig.json',
      'jsconfig.json',
      'webpack.config.js',
      'vite.config.js',
      'rollup.config.js',
      'babel.config.js',
      '.babelrc',
      'eslint.config.js',
      '.eslintrc',
      'prettier.config.js',
      '.prettierrc',
      'jest.config.js',
      'vitest.config.js',
      'cypress.config.js',
      'playwright.config.js',
      'docker-compose.yml',
      'Dockerfile',
      '.env.example',
      'requirements.txt',
      'Pipfile',
      'pyproject.toml',
      'Cargo.toml',
      'go.mod',
      'pom.xml',
      'build.gradle',
      'Gemfile',
      'composer.json'
    ];

    return files.filter(file => {
      const basename = path.basename(file);
      return configPatterns.some(pattern => 
        basename === pattern || basename.startsWith(pattern)
      );
    });
  }

  /**
   * Identify documentation files
   */
  private identifyDocumentationFiles(files: string[]): string[] {
    const docPatterns = [
      'README.md',
      'CHANGELOG.md',
      'CONTRIBUTING.md',
      'LICENSE',
      'CODE_OF_CONDUCT.md',
      'SECURITY.md',
      'API.md',
      'ARCHITECTURE.md'
    ];

    return files.filter(file => {
      const basename = path.basename(file);
      return docPatterns.includes(basename) || 
             file.includes('doc') || 
             file.endsWith('.md') || 
             file.endsWith('.rst') || 
             file.endsWith('.adoc');
    });
  }

  /**
   * Analyze VS Code configuration
   */
  private async analyzeVSCodeConfiguration(workspacePath: string): Promise<any> {
    const vscodeDir = path.join(workspacePath, '.vscode');
    
    if (!await fs.pathExists(vscodeDir)) {
      return { configured: false };
    }

    const config: any = { configured: true };

    try {
      // Settings
      const settingsPath = path.join(vscodeDir, 'settings.json');
      if (await fs.pathExists(settingsPath)) {
        config.settings = await fs.readJson(settingsPath);
      }

      // Extensions
      const extensionsPath = path.join(vscodeDir, 'extensions.json');
      if (await fs.pathExists(extensionsPath)) {
        config.extensions = await fs.readJson(extensionsPath);
      }

      // Tasks
      const tasksPath = path.join(vscodeDir, 'tasks.json');
      if (await fs.pathExists(tasksPath)) {
        config.tasks = await fs.readJson(tasksPath);
      }

      // Launch
      const launchPath = path.join(vscodeDir, 'launch.json');
      if (await fs.pathExists(launchPath)) {
        config.launch = await fs.readJson(launchPath);
      }

      return config;
    } catch (error: any) {
      console.error('VS Code configuration analysis failed:', error);
      return { configured: true, error: error?.message || 'Configuration analysis failed' };
    }
  }

  /**
   * Analyze project dependencies
   */
  private async analyzeDependencies(workspacePath: string): Promise<any> {
    const dependencies: any = {};

    try {
      // Node.js
      const packageJsonPath = path.join(workspacePath, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        dependencies.nodejs = {
          name: packageJson.name,
          version: packageJson.version,
          dependencies: Object.keys(packageJson.dependencies || {}),
          devDependencies: Object.keys(packageJson.devDependencies || {}),
          scripts: Object.keys(packageJson.scripts || {})
        };
      }

      // Python
      const requirementsPath = path.join(workspacePath, 'requirements.txt');
      if (await fs.pathExists(requirementsPath)) {
        const requirements = await fs.readFile(requirementsPath, 'utf8');
        dependencies.python = {
          requirements: requirements.split('\n').filter(line => line.trim())
        };
      }

      // Go
      const goModPath = path.join(workspacePath, 'go.mod');
      if (await fs.pathExists(goModPath)) {
        const goMod = await fs.readFile(goModPath, 'utf8');
        dependencies.go = { goMod: goMod.split('\n').filter(line => line.trim()) };
      }

      // Rust
      const cargoPath = path.join(workspacePath, 'Cargo.toml');
      if (await fs.pathExists(cargoPath)) {
        const cargoToml = await fs.readFile(cargoPath, 'utf8');
        dependencies.rust = { cargo: cargoToml };
      }

      return dependencies;
    } catch (error: any) {
      console.error('Dependencies analysis failed:', error);
      return { error: error?.message || 'Dependencies analysis failed' };
    }
  }

  /**
   * Analyze Git repository information
   */
  private async analyzeGitRepository(workspacePath: string): Promise<any> {
    try {
      const gitDir = path.join(workspacePath, '.git');
      if (!await fs.pathExists(gitDir)) {
        return { isGitRepo: false };
      }

      const git = this.gitClient;
      
      const status = await git.status();
      const log = await git.log({ maxCount: 10 });
      const branches = await git.branch();
      const remotes = await git.getRemotes(true);

      return {
        isGitRepo: true,
        currentBranch: branches.current,
        allBranches: branches.all,
        remotes: remotes.map((r: any) => ({ name: r.name, url: r.refs.fetch })),
        status: {
          ahead: status.ahead,
          behind: status.behind,
          staged: status.staged,
          modified: status.modified,
          created: status.created,
          deleted: status.deleted
        },
        recentCommits: log.all.map((commit: any) => ({
          hash: commit.hash.substring(0, 8),
          message: commit.message,
          author: commit.author_name,
          date: commit.date
        }))
      };
    } catch (error: any) {
      console.error('Git analysis failed:', error);
      return { isGitRepo: false, error: error?.message || 'Git analysis failed' };
    }
  }

  /**
   * Analyze extension requirements based on project
   */
  async analyzeExtensionRequirements(workspacePath?: string): Promise<any> {
    const wsPath = workspacePath || this.workspacePath;
    const analysis = await this.analyzeWorkspace(wsPath);
    const recommendations = [];

    // Language-specific extensions
    const languages = analysis.structure?.languages || {};
    const langExtensions = {
      'TypeScript': ['ms-vscode.vscode-typescript-next'],
      'JavaScript': ['ms-vscode.vscode-typescript-next'],
      'Python': ['ms-python.python', 'ms-python.debugpy'],
      'Java': ['vscjava.vscode-java-pack'],
      'C#': ['ms-dotnettools.csharp'],
      'Go': ['golang.go'],
      'Rust': ['rust-lang.rust-analyzer'],
      'PHP': ['php.php-extensions'],
      'Ruby': ['rebornix.ruby']
    };

    Object.keys(languages).forEach((lang: string) => {
      const exts = langExtensions[lang as keyof typeof langExtensions];
      if (exts) {
        recommendations.push(...exts.map((ext: string) => ({
          id: ext,
          reason: `${lang} language support`,
          priority: 'high'
        })));
      }
    });

    // Framework-specific extensions
    const configFiles = analysis.structure?.configFiles || [];
    const frameworkExtensions = {
      'package.json': ['bradlc.vscode-tailwindcss', 'esbenp.prettier-vscode'],
      'tsconfig.json': ['ms-vscode.vscode-typescript-next'],
      'webpack.config.js': ['ms-vscode.vscode-webpack'],
      'docker-compose.yml': ['ms-azuretools.vscode-docker'],
      'Dockerfile': ['ms-azuretools.vscode-docker'],
      '.eslintrc': ['dbaeumer.vscode-eslint'],
      'jest.config.js': ['orta.vscode-jest']
    };

    configFiles.forEach((file: string) => {
      const basename = path.basename(file);
      if (basename in frameworkExtensions) {
        const exts = frameworkExtensions[basename as keyof typeof frameworkExtensions];
        recommendations.push(...exts.map((ext: string) => ({
          id: ext,
          reason: `Support for ${basename}`,
          priority: 'medium'
        })));
      }
    });

    // General productivity extensions
    const productivityExtensions = [
      { id: 'ms-vscode.vscode-json', reason: 'JSON support', priority: 'high' },
      { id: 'redhat.vscode-yaml', reason: 'YAML support', priority: 'medium' },
      { id: 'ms-vscode.theme-tomorrowkit', reason: 'Better themes', priority: 'low' },
      { id: 'streetsidesoftware.code-spell-checker', reason: 'Spell checking', priority: 'medium' }
    ];

    recommendations.push(...productivityExtensions);

    return {
      recommended: recommendations,
      total: recommendations.length,
      byPriority: {
        high: recommendations.filter(r => r.priority === 'high').length,
        medium: recommendations.filter(r => r.priority === 'medium').length,
        low: recommendations.filter(r => r.priority === 'low').length
      }
    };
  }

  /**
   * Analyze workspace settings recommendations
   */
  async analyzeWorkspaceSettings(workspacePath?: string): Promise<any> {
    const wsPath = workspacePath || this.workspacePath;
    const analysis = await this.analyzeWorkspace(wsPath);
    const languages = analysis.structure?.languages || {};
    
    const recommendedSettings: any = {
      'editor.tabSize': 2,
      'editor.insertSpaces': true,
      'editor.detectIndentation': true,
      'files.autoSave': 'onFocusChange',
      'editor.formatOnSave': true
    };

    // Language-specific settings
    if (languages['TypeScript'] || languages['JavaScript']) {
      recommendedSettings['typescript.preferences.noSemicolons'] = true;
      recommendedSettings['javascript.preferences.noSemicolons'] = true;
      recommendedSettings['editor.codeActionsOnSave'] = {
        'source.fixAll.eslint': true
      };
    }

    if (languages['Python']) {
      recommendedSettings['python.defaultInterpreterPath'] = './venv/bin/python';
      recommendedSettings['python.formatting.provider'] = 'black';
      recommendedSettings['python.linting.enabled'] = true;
      recommendedSettings['python.linting.pylintEnabled'] = true;
    }

    return {
      recommended: recommendedSettings,
      rationale: 'Settings optimized for detected project languages and structure'
    };
  }

  /**
   * Analyze task configuration recommendations
   */
  async analyzeTaskConfiguration(workspacePath?: string): Promise<any> {
    const wsPath = workspacePath || this.workspacePath;
    const analysis = await this.analyzeWorkspace(wsPath);
    const packageJson = analysis.dependencies?.nodejs;
    const tasks = [];

    if (packageJson?.scripts) {
      Object.entries(packageJson.scripts).forEach(([name, script]) => {
        tasks.push({
          label: `npm: ${name}`,
          type: 'shell',
          command: 'npm',
          args: ['run', name],
          group: name.includes('build') ? 'build' : name.includes('test') ? 'test' : 'none',
          problemMatcher: name.includes('test') ? '$eslint-stylish' : []
        });
      });
    }

    // Add common development tasks
    const languages = analysis.structure?.languages || {};
    
    if (languages['TypeScript']) {
      tasks.push({
        label: 'TypeScript: Watch',
        type: 'shell',
        command: 'npx',
        args: ['tsc', '--watch'],
        group: 'build',
        isBackground: true,
        problemMatcher: '$tsc-watch'
      });
    }

    if (languages['Python']) {
      tasks.push({
        label: 'Python: Run Current File',
        type: 'shell',
        command: 'python',
        args: ['${file}'],
        group: 'test'
      });
    }

    return {
      recommended: tasks,
      total: tasks.length
    };
  }

  /**
   * Analyze launch configuration recommendations
   */
  async analyzeLaunchConfiguration(workspacePath?: string): Promise<any> {
    const wsPath = workspacePath || this.workspacePath;
    const analysis = await this.analyzeWorkspace(wsPath);
    const languages = analysis.structure?.languages || {};
    const configurations = [];

    if (languages['TypeScript'] || languages['JavaScript']) {
      configurations.push({
        name: 'Launch TypeScript',
        type: 'node',
        request: 'launch',
        program: '${workspaceFolder}/src/index.ts',
        outFiles: ['${workspaceFolder}/dist/**/*.js'],
        runtimeArgs: ['--require', 'ts-node/register']
      });

      configurations.push({
        name: 'Attach to Node.js',
        type: 'node',
        request: 'attach',
        port: 9229,
        restart: true
      });
    }

    if (languages['Python']) {
      configurations.push({
        name: 'Python: Current File',
        type: 'python',
        request: 'launch',
        program: '${file}',
        console: 'integratedTerminal'
      });

      configurations.push({
        name: 'Python: FastAPI',
        type: 'python',
        request: 'launch',
        module: 'uvicorn',
        args: ['main:app', '--reload'],
        console: 'integratedTerminal'
      });
    }

    return {
      version: '0.2.0',
      configurations,
      total: configurations.length
    };
  }

  /**
   * Index workspace content for RAG search
   */
  async indexWorkspaceContent(workspacePath?: string): Promise<void> {
    const wsPath = workspacePath || this.workspacePath;
    
    try {
      const analysis = await this.analyzeWorkspace(wsPath);
      
      // Create searchable content from analysis
      const content = [
        `Workspace: ${analysis.path}`,
        `Languages: ${Object.keys(analysis.structure?.languages || {}).join(', ')}`,
        `File Types: ${Object.entries(analysis.structure?.fileTypes || {}).map(([type, count]) => `${type}: ${count}`).join(', ')}`,
        `Configuration: ${analysis.structure?.configFiles?.join(', ') || 'None'}`,
        `Documentation: ${analysis.structure?.documentation?.join(', ') || 'None'}`,
        `VS Code Configured: ${analysis.configuration?.configured || false}`,
        `Git Repository: ${analysis.gitInfo?.isGitRepo || false}`,
        `Dependencies: ${Object.keys(analysis.dependencies || {}).join(', ')}`
      ].join('\n');

      const embedding = await this.generateEmbedding(content);
      this.embeddings.set(wsPath, embedding);
      
      console.log(`Indexed workspace content for ${wsPath}`);
    } catch (error) {
      console.error('Failed to index workspace content:', error);
      throw error;
    }
  }

  /**
   * Semantic search across workspace data
   */
  async semanticSearch(query: string, limit: number = 10): Promise<any[]> {
    try {
      const queryEmbedding = await this.generateEmbedding(query);
      const results: any[] = [];
      
      for (const [workspacePath, embedding] of this.embeddings) {
        const similarity = this.cosineSimilarity(queryEmbedding, embedding);
        const workspaceData = this.workspaceData.get(workspacePath);
        
        if (workspaceData) {
          results.push({
            workspacePath,
            similarity,
            type: 'workspace-analysis',
            ...workspaceData
          });
        }
      }
      
      return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
    } catch (error) {
      console.error('Semantic search failed:', error);
      throw error;
    }
  }

  /**
   * Get workspace intelligence and recommendations
   */
  async getWorkspaceIntelligence(workspacePath?: string): Promise<any> {
    const wsPath = workspacePath || this.workspacePath;
    
    try {
      const analysis = await this.analyzeWorkspace(wsPath);
      const extensions = await this.analyzeExtensionRequirements(wsPath);
      const settings = await this.analyzeWorkspaceSettings(wsPath);
      const tasks = await this.analyzeTaskConfiguration(wsPath);
      const launch = await this.analyzeLaunchConfiguration(wsPath);

      // Generate AI-powered insights
      const insights = await this.generateWorkspaceInsights(analysis);

      return {
        workspace: wsPath,
        analysis,
        recommendations: {
          extensions,
          settings,
          tasks,
          launch
        },
        insights,
        optimization: await this.generateOptimizationSuggestions(analysis)
      };
    } catch (error) {
      console.error('Failed to get workspace intelligence:', error);
      throw error;
    }
  }

  /**
   * Generate AI-powered workspace insights
   */
  private async generateWorkspaceInsights(analysis: any): Promise<string> {
    try {
      const prompt = `
Analyze this VS Code workspace and provide insights:

Workspace Structure:
- Total Files: ${analysis.structure?.totalFiles || 0}
- Languages: ${Object.keys(analysis.structure?.languages || {}).join(', ')}
- File Types: ${JSON.stringify(analysis.structure?.fileTypes || {})}
- Directories: ${analysis.structure?.directories?.totalDirectories || 0}

Configuration:
- VS Code configured: ${analysis.configuration?.configured || false}
- Git repository: ${analysis.gitInfo?.isGitRepo || false}
- Dependencies: ${Object.keys(analysis.dependencies || {}).join(', ')}

Please provide:
1. Project type assessment
2. Development workflow recommendations
3. Potential improvements
4. Best practices suggestions
`;
      
      const response = await this.openaiClient.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.7
      });
      
      return response.choices[0].message.content || 'Unable to generate insights';
    } catch (error) {
      console.error('Failed to generate workspace insights:', error);
      return 'AI insights temporarily unavailable';
    }
  }

  /**
   * Generate optimization suggestions
   */
  private async generateOptimizationSuggestions(analysis: any): Promise<any[]> {
    const suggestions = [];

    // Check for missing .vscode configuration
    if (!analysis.configuration?.configured) {
      suggestions.push({
        type: 'configuration',
        title: 'Setup VS Code workspace configuration',
        description: 'Create .vscode folder with settings, extensions, and task configurations',
        impact: 'high',
        effort: 'low'
      });
    }

    // Check for missing Git
    if (!analysis.gitInfo?.isGitRepo) {
      suggestions.push({
        type: 'version-control',
        title: 'Initialize Git repository',
        description: 'Setup version control for better collaboration and history tracking',
        impact: 'high',
        effort: 'low'
      });
    }

    // Check file organization
    const structure = analysis.structure?.directories;
    if (structure && !structure.commonPatterns?.src) {
      suggestions.push({
        type: 'organization',
        title: 'Improve project structure',
        description: 'Consider organizing source files in a src/ directory',
        impact: 'medium',
        effort: 'medium'
      });
    }

    // Check for missing documentation
    const docs = analysis.structure?.documentation || [];
    if (!docs.some((doc: string) => doc.includes('README'))) {
      suggestions.push({
        type: 'documentation',
        title: 'Add project documentation',
        description: 'Create README.md with project overview and setup instructions',
        impact: 'medium',
        effort: 'low'
      });
    }

    return suggestions;
  }

  /**
   * Start file watching for real-time workspace updates
   */
  startFileWatcher(workspacePath?: string): void {
    const wsPath = workspacePath || this.workspacePath;
    
    if (this.fileWatcher) {
      this.fileWatcher.close();
    }

    this.fileWatcher = chokidar.watch(wsPath, {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**'
      ],
      persistent: true,
      ignoreInitial: true
    });

    this.fileWatcher.on('all', (event, filePath) => {
      console.log(`File ${event}: ${filePath}`);
      // Invalidate cache for this workspace
      this.cache.del(`workspace_analysis_${wsPath}`);
    });
  }

  /**
   * Stop file watching
   */
  stopFileWatcher(): void {
    if (this.fileWatcher) {
      this.fileWatcher.close();
      this.fileWatcher = undefined;
    }
  }
}