import { OpenAI } from 'openai';
import * as azdev from 'azure-devops-node-api';
import { IGitApi } from 'azure-devops-node-api/GitApi';
import { IWorkItemTrackingApi } from 'azure-devops-node-api/WorkItemTrackingApi';
import { IBuildApi } from 'azure-devops-node-api/BuildApi';
import NodeCache from 'node-cache';
import { z } from 'zod';

/**
 * Azure DevOps RAG Service
 * Provides semantic search and intelligence over Azure DevOps data
 */
export class DevOpsRAGService {
  private openaiClient: OpenAI;
  private devopsConnection: azdev.WebApi;
  private gitApi?: IGitApi;
  private workItemApi?: IWorkItemTrackingApi;
  private buildApi?: IBuildApi;
  private cache: NodeCache;
  private embeddings: Map<string, number[]>;
  private devopsContent: Map<string, any>;

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

    // Initialize Azure DevOps connection
    const orgUrl = process.env.AZURE_DEVOPS_ORG_URL!;
    const token = process.env.AZURE_DEVOPS_PAT!;
    
    const authHandler = azdev.getPersonalAccessTokenHandler(token);
    this.devopsConnection = new azdev.WebApi(orgUrl, authHandler);

    // Initialize cache and storage
    this.cache = new NodeCache({ stdTTL: 3600 }); // 1 hour TTL
    this.embeddings = new Map();
    this.devopsContent = new Map();

    this.initializeAPIs();
  }

  private async initializeAPIs(): Promise<void> {
    try {
      this.gitApi = await this.devopsConnection.getGitApi();
      this.workItemApi = await this.devopsConnection.getWorkItemTrackingApi();
      this.buildApi = await this.devopsConnection.getBuildApi();
      console.log('✅ Azure DevOps APIs initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Azure DevOps APIs:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for text content
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const result = await this.openaiClient.embeddings.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'text-embedding-ada-002',
        input: text,
      });
      
      return result.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Index Git commit history with RAG
   */
  async indexGitHistory(projectName: string, repositoryId: string): Promise<void> {
    console.log(`📂 Indexing Git history for ${projectName}/${repositoryId}...`);
    
    try {
      const cacheKey = `git-history-${projectName}-${repositoryId}`;
      let commits = this.cache.get<any[]>(cacheKey);

      if (!commits) {
        // Get commit history from Azure DevOps
        const commitSearchCriteria = {
          itemVersion: { version: 'main' },
          top: 100 // Limit to recent 100 commits
        };

        commits = await this.gitApi!.getCommits(
          repositoryId,
          commitSearchCriteria,
          projectName
        );

        this.cache.set(cacheKey, commits);
      }

      // Process commits for RAG indexing
      for (const commit of commits || []) {
        const commitText = [
          `Commit: ${commit.commitId}`,
          `Author: ${commit.author?.name}`,
          `Date: ${commit.author?.date}`,
          `Message: ${commit.comment}`,
          `Changes: ${commit.changeCounts?.Add || 0} additions, ${commit.changeCounts?.Delete || 0} deletions`
        ].join('\n');

        const embedding = await this.generateEmbedding(commitText);
        const commitId = `commit-${commit.commitId}`;
        
        this.embeddings.set(commitId, embedding);
        this.devopsContent.set(commitId, {
          type: 'commit',
          commitId: commit.commitId,
          author: commit.author?.name,
          date: commit.author?.date,
          message: commit.comment,
          changeCounts: commit.changeCounts,
          project: projectName,
          repository: repositoryId,
          content: commitText
        });
      }

      console.log(`✅ Indexed ${commits?.length || 0} commits`);
    } catch (error) {
      console.error('Error indexing Git history:', error);
      throw error;
    }
  }

  /**
   * Index work items with RAG
   */
  async indexWorkItems(projectName: string): Promise<void> {
    console.log(`📋 Indexing work items for ${projectName}...`);
    
    try {
      const cacheKey = `work-items-${projectName}`;
      let workItems = this.cache.get<any[]>(cacheKey);

      if (!workItems) {
        // Query for work items
        const wiql = {
          query: `SELECT [System.Id], [System.Title], [System.Description], [System.State], [System.WorkItemType], [System.CreatedDate] 
                  FROM WorkItems 
                  WHERE [System.TeamProject] = '${projectName}' 
                  AND [System.CreatedDate] >= @Today - 90 
                  ORDER BY [System.CreatedDate] DESC`
        };

        const queryResult = await this.workItemApi!.queryByWiql({ query: wiql.query }, { projectId: projectName });
        
        if (queryResult.workItems && queryResult.workItems.length > 0) {
          const ids = queryResult.workItems.map(wi => wi.id!);
          workItems = await this.workItemApi!.getWorkItems(ids, undefined, undefined, undefined, undefined, projectName);
        } else {
          workItems = [];
        }

        this.cache.set(cacheKey, workItems);
      }

      // Process work items for RAG indexing
      for (const workItem of workItems || []) {
        const fields = workItem.fields || {};
        const workItemText = [
          `Work Item: ${workItem.id}`,
          `Type: ${fields['System.WorkItemType']}`,
          `Title: ${fields['System.Title']}`,
          `State: ${fields['System.State']}`,
          `Description: ${fields['System.Description'] || 'No description'}`,
          `Created: ${fields['System.CreatedDate']}`,
          `Assigned To: ${fields['System.AssignedTo']?.displayName || 'Unassigned'}`
        ].join('\n');

        const embedding = await this.generateEmbedding(workItemText);
        const workItemId = `workitem-${workItem.id}`;
        
        this.embeddings.set(workItemId, embedding);
        this.devopsContent.set(workItemId, {
          type: 'work-item',
          id: workItem.id,
          title: fields['System.Title'],
          description: fields['System.Description'],
          state: fields['System.State'],
          workItemType: fields['System.WorkItemType'],
          assignedTo: fields['System.AssignedTo']?.displayName,
          createdDate: fields['System.CreatedDate'],
          project: projectName,
          content: workItemText
        });
      }

      console.log(`✅ Indexed ${workItems?.length || 0} work items`);
    } catch (error) {
      console.error('Error indexing work items:', error);
      throw error;
    }
  }

  /**
   * Index build/pipeline history with RAG
   */
  async indexBuildHistory(projectName: string): Promise<void> {
    console.log(`🚀 Indexing build history for ${projectName}...`);
    
    try {
      const cacheKey = `builds-${projectName}`;
      let builds = this.cache.get<any[]>(cacheKey);

      if (!builds) {
        builds = await this.buildApi!.getBuilds(
          projectName,
          undefined, // definitions
          undefined, // queues
          undefined, // buildNumber
          undefined, // minTime
          undefined, // maxTime
          undefined, // requestedFor
          undefined, // reasonFilter
          undefined, // statusFilter
          undefined, // resultFilter
          undefined, // tagFilters
          undefined, // properties
          50 // top - limit to recent 50 builds
        );

        this.cache.set(cacheKey, builds);
      }

      // Process builds for RAG indexing
      for (const build of builds || []) {
        const buildText = [
          `Build: ${build.id}`,
          `Definition: ${build.definition?.name}`,
          `Status: ${build.status}`,
          `Result: ${build.result}`,
          `Started: ${build.startTime}`,
          `Completed: ${build.finishTime}`,
          `Requested By: ${build.requestedBy?.displayName}`,
          `Source Branch: ${build.sourceBranch}`,
          `Reason: ${build.reason}`
        ].join('\n');

        const embedding = await this.generateEmbedding(buildText);
        const buildId = `build-${build.id}`;
        
        this.embeddings.set(buildId, embedding);
        this.devopsContent.set(buildId, {
          type: 'build',
          id: build.id,
          definitionName: build.definition?.name,
          status: build.status,
          result: build.result,
          startTime: build.startTime,
          finishTime: build.finishTime,
          requestedBy: build.requestedBy?.displayName,
          sourceBranch: build.sourceBranch,
          reason: build.reason,
          project: projectName,
          content: buildText
        });
      }

      console.log(`✅ Indexed ${builds?.length || 0} builds`);
    } catch (error) {
      console.error('Error indexing build history:', error);
      throw error;
    }
  }

  /**
   * Semantic search across Azure DevOps content
   */
  async semanticSearch(query: string, limit: number = 10): Promise<any[]> {
    console.log(`🔍 Performing semantic search: "${query}"`);
    
    try {
      const queryEmbedding = await this.generateEmbedding(query);
      const results: Array<{ item: any; similarity: number }> = [];

      // Search through all indexed content
      for (const [id, embedding] of this.embeddings) {
        const similarity = this.cosineSimilarity(queryEmbedding, embedding);
        const content = this.devopsContent.get(id);
        
        if (content) {
          results.push({ item: content, similarity });
        }
      }

      // Sort by similarity and return top results
      return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(result => ({
          ...result.item,
          similarity: result.similarity
        }));
    } catch (error) {
      console.error('Error performing semantic search:', error);
      throw error;
    }
  }

  /**
   * Get code intelligence insights
   */
  async getCodeIntelligence(projectName: string, repositoryId: string): Promise<any> {
    console.log(`🧠 Generating code intelligence for ${projectName}/${repositoryId}...`);
    
    try {
      // Get recent commit patterns
      const commitResults = await this.semanticSearch(`commits repository ${repositoryId}`, 20);
      const commits = commitResults.filter(r => r.type === 'commit');

      // Analyze commit patterns
      const authors = new Map<string, number>();
      const changePatterns = new Map<string, number>();
      
      commits.forEach(commit => {
        // Count commits by author
        if (commit.author) {
          authors.set(commit.author, (authors.get(commit.author) || 0) + 1);
        }
        
        // Analyze change patterns
        const additions = commit.changeCounts?.Add || 0;
        const deletions = commit.changeCounts?.Delete || 0;
        
        if (additions > 100) changePatterns.set('large-additions', (changePatterns.get('large-additions') || 0) + 1);
        if (deletions > 50) changePatterns.set('large-deletions', (changePatterns.get('large-deletions') || 0) + 1);
      });

      return {
        project: projectName,
        repository: repositoryId,
        analysis: {
          totalCommits: commits.length,
          topAuthors: Array.from(authors.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5),
          changePatterns: Object.fromEntries(changePatterns),
          recentActivity: commits.slice(0, 5).map(c => ({
            id: c.commitId,
            author: c.author,
            message: c.message,
            date: c.date
          }))
        }
      };
    } catch (error) {
      console.error('Error generating code intelligence:', error);
      throw error;
    }
  }

  /**
   * Get work item intelligence
   */
  async getWorkItemIntelligence(projectName: string): Promise<any> {
    console.log(`📊 Generating work item intelligence for ${projectName}...`);
    
    try {
      const workItemResults = await this.semanticSearch(`work items project ${projectName}`, 50);
      const workItems = workItemResults.filter(r => r.type === 'work-item');

      // Analyze work item patterns
      const typeDistribution = new Map<string, number>();
      const stateDistribution = new Map<string, number>();
      const assigneeWorkload = new Map<string, number>();

      workItems.forEach(wi => {
        if (wi.workItemType) {
          typeDistribution.set(wi.workItemType, (typeDistribution.get(wi.workItemType) || 0) + 1);
        }
        if (wi.state) {
          stateDistribution.set(wi.state, (stateDistribution.get(wi.state) || 0) + 1);
        }
        if (wi.assignedTo) {
          assigneeWorkload.set(wi.assignedTo, (assigneeWorkload.get(wi.assignedTo) || 0) + 1);
        }
      });

      return {
        project: projectName,
        analysis: {
          totalWorkItems: workItems.length,
          typeDistribution: Object.fromEntries(typeDistribution),
          stateDistribution: Object.fromEntries(stateDistribution),
          assigneeWorkload: Array.from(assigneeWorkload.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10),
          recentItems: workItems.slice(0, 10).map(wi => ({
            id: wi.id,
            title: wi.title,
            type: wi.workItemType,
            state: wi.state,
            assignedTo: wi.assignedTo
          }))
        }
      };
    } catch (error) {
      console.error('Error generating work item intelligence:', error);
      throw error;
    }
  }

  /**
   * Get pipeline intelligence
   */
  async getPipelineIntelligence(projectName: string): Promise<any> {
    console.log(`🔄 Generating pipeline intelligence for ${projectName}...`);
    
    try {
      const buildResults = await this.semanticSearch(`builds project ${projectName}`, 30);
      const builds = buildResults.filter(r => r.type === 'build');

      // Analyze pipeline patterns
      const successRate = builds.filter(b => b.result === 'succeeded').length / builds.length;
      const failureRate = builds.filter(b => b.result === 'failed').length / builds.length;
      
      const definitionStats = new Map<string, { total: number; succeeded: number; failed: number }>();
      
      builds.forEach(build => {
        if (build.definitionName) {
          const stats = definitionStats.get(build.definitionName) || { total: 0, succeeded: 0, failed: 0 };
          stats.total++;
          if (build.result === 'succeeded') stats.succeeded++;
          if (build.result === 'failed') stats.failed++;
          definitionStats.set(build.definitionName, stats);
        }
      });

      return {
        project: projectName,
        analysis: {
          totalBuilds: builds.length,
          successRate: Math.round(successRate * 100),
          failureRate: Math.round(failureRate * 100),
          definitionStats: Object.fromEntries(definitionStats),
          recentBuilds: builds.slice(0, 10).map(b => ({
            id: b.id,
            definition: b.definitionName,
            status: b.status,
            result: b.result,
            startTime: b.startTime
          }))
        }
      };
    } catch (error) {
      console.error('Error generating pipeline intelligence:', error);
      throw error;
    }
  }

  /**
   * Index all Azure DevOps content for a project
   */
  async indexProject(projectName: string, repositoryId?: string): Promise<void> {
    console.log(`🚀 Starting full indexing for project: ${projectName}`);
    
    try {
      // Index work items
      await this.indexWorkItems(projectName);
      
      // Index build history
      await this.indexBuildHistory(projectName);
      
      // Index Git history if repository specified
      if (repositoryId) {
        await this.indexGitHistory(projectName, repositoryId);
      }
      
      console.log(`✅ Completed indexing for project: ${projectName}`);
    } catch (error) {
      console.error(`❌ Error indexing project ${projectName}:`, error);
      throw error;
    }
  }
}