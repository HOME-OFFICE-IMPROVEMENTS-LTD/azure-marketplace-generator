import { AzureOpenAI } from '@azure/openai';
import { DefaultAzureCredential } from '@azure/identity';
import { GraphService } from '../../graph-mcp-server/src/services/GraphService.js';
import { AuthService } from '../../graph-mcp-server/src/services/AuthService.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import cheerio from 'cheerio';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import NodeCache from 'node-cache';
import { z } from 'zod';

/**
 * RAG Service for Organizational Knowledge
 * Provides semantic search and embeddings for SharePoint/Teams content
 */
export class RAGService {
  private openaiClient: AzureOpenAI;
  private graphService: GraphService;
  private cache: NodeCache;
  private embeddings: Map<string, number[]> = new Map();
  private documents: Map<string, any> = new Map();

  constructor() {
    // Initialize Azure OpenAI client with default credentials
    this.openaiClient = new AzureOpenAI({
      endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
      apiVersion: '2024-02-01',
      credential: new DefaultAzureCredential()
    });

    // Initialize Graph service for content retrieval
    const authService = new AuthService();
    this.graphService = new GraphService(authService);
    
    // Cache for 1 hour by default
    this.cache = new NodeCache({ stdTTL: 3600 });
  }

  /**
   * Initialize RAG service
   */
  async initialize(): Promise<void> {
    console.error('🧠 Initializing RAG service...');
    
    // Test Azure OpenAI connection
    try {
      const testEmbedding = await this.generateEmbedding('test');
      console.error('✅ Azure OpenAI connection successful');
    } catch (error) {
      console.error('❌ Azure OpenAI connection failed:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for text content
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const cacheKey = `embedding:${Buffer.from(text).toString('base64').slice(0, 50)}`;
    const cached = this.cache.get<number[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await this.openaiClient.getEmbeddings(
        process.env.AZURE_OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
        [text.slice(0, 8000)] // Limit text length for embeddings
      );

      const embedding = response.data[0].embedding;
      this.cache.set(cacheKey, embedding);
      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Extract text content from various file types
   */
  async extractTextContent(content: Buffer, filename: string): Promise<string> {
    const ext = path.extname(filename).toLowerCase();
    
    try {
      switch (ext) {
        case '.pdf':
          const pdfData = await pdfParse(content);
          return pdfData.text;
        
        case '.docx':
          const docxResult = await mammoth.extractRawText({ buffer: content });
          return docxResult.value;
        
        case '.html':
        case '.htm':
          const $ = cheerio.load(content.toString());
          return $.text();
        
        case '.txt':
        case '.md':
          return content.toString('utf-8');
        
        default:
          return content.toString('utf-8').slice(0, 10000); // Fallback with limit
      }
    } catch (error) {
      console.error(`Error extracting text from ${filename}:`, error);
      return '';
    }
  }

  /**
   * Index SharePoint documents for semantic search
   */
  async indexSharePointContent(siteId?: string, limit: number = 50): Promise<void> {
    console.error('📚 Indexing SharePoint content...');
    
    try {
      // Search for documents in SharePoint
      const documents = await this.graphService.searchSharePointContent(
        '*', // Search all content
        siteId,
        'documents',
        limit
      );

      let indexed = 0;
      for (const doc of documents) {
        try {
          // Skip if already indexed
          if (this.documents.has(doc.id)) {
            continue;
          }

          let textContent = '';
          
          // Try to get document content if it's a supported type
          if (doc.webUrl && this.isIndexableDocument(doc.name)) {
            // For now, use summary and name for indexing
            // In production, you'd want to download and extract full content
            textContent = `${doc.name} ${doc.summary || ''} ${doc.contentType || ''}`;
          } else {
            textContent = `${doc.name} ${doc.summary || ''}`;
          }

          if (textContent.trim()) {
            // Generate embedding
            const embedding = await this.generateEmbedding(textContent);
            
            // Store document and embedding
            this.documents.set(doc.id, {
              ...doc,
              textContent,
              type: 'sharepoint',
              indexed: new Date().toISOString()
            });
            
            this.embeddings.set(doc.id, embedding);
            indexed++;
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error(`Error indexing document ${doc.name}:`, error);
        }
      }

      console.error(`✅ Indexed ${indexed} SharePoint documents`);
    } catch (error) {
      console.error('Error indexing SharePoint content:', error);
      throw error;
    }
  }

  /**
   * Index Teams conversations for semantic search
   */
  async indexTeamsContent(teamId?: string, limit: number = 100): Promise<void> {
    console.error('💬 Indexing Teams content...');
    
    try {
      const content = await this.graphService.getTeamsContent(
        teamId,
        undefined, // all channels
        undefined, // no query filter
        'all',
        limit
      );

      let indexed = 0;
      for (const item of content) {
        try {
          // Skip if already indexed
          if (this.documents.has(item.id)) {
            continue;
          }

          let textContent = '';
          
          if (item.type === 'message' && item.content) {
            // Clean HTML from message content
            const $ = cheerio.load(item.content);
            textContent = $.text().trim();
          } else if (item.type === 'file' && item.name) {
            textContent = item.name;
          }

          if (textContent && textContent.length > 10) {
            // Generate embedding
            const embedding = await this.generateEmbedding(textContent);
            
            // Store document and embedding
            this.documents.set(item.id, {
              ...item,
              textContent,
              type: 'teams',
              indexed: new Date().toISOString()
            });
            
            this.embeddings.set(item.id, embedding);
            indexed++;
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error(`Error indexing Teams content ${item.id}:`, error);
        }
      }

      console.error(`✅ Indexed ${indexed} Teams items`);
    } catch (error) {
      console.error('Error indexing Teams content:', error);
      throw error;
    }
  }

  /**
   * Perform semantic search across indexed content
   */
  async semanticSearch(query: string, limit: number = 10, contentType?: 'sharepoint' | 'teams'): Promise<any[]> {
    if (this.embeddings.size === 0) {
      throw new Error('No content indexed. Run indexing first.');
    }

    try {
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Calculate similarities
      const similarities: Array<{ id: string; score: number; document: any }> = [];
      
      for (const [docId, docEmbedding] of this.embeddings.entries()) {
        const document = this.documents.get(docId);
        
        // Filter by content type if specified
        if (contentType && document?.type !== contentType) {
          continue;
        }
        
        const similarity = this.cosineSimilarity(queryEmbedding, docEmbedding);
        similarities.push({ id: docId, score: similarity, document });
      }
      
      // Sort by similarity score and return top results
      return similarities
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(result => ({
          ...result.document,
          similarityScore: result.score
        }));
        
    } catch (error) {
      console.error('Error performing semantic search:', error);
      throw error;
    }
  }

  /**
   * Get organizational knowledge for context
   */
  async getOrganizationalContext(topic: string, limit: number = 5): Promise<string> {
    try {
      const results = await this.semanticSearch(topic, limit);
      
      let context = `## Organizational Knowledge for: ${topic}\n\n`;
      
      for (const result of results) {
        context += `### ${result.name || result.id}\n`;
        context += `**Source**: ${result.type === 'sharepoint' ? 'SharePoint' : 'Teams'}\n`;
        context += `**Relevance**: ${Math.round(result.similarityScore * 100)}%\n`;
        
        if (result.textContent) {
          context += `**Content**: ${result.textContent.slice(0, 300)}...\n`;
        }
        
        if (result.webUrl) {
          context += `**Link**: ${result.webUrl}\n`;
        }
        
        context += '\n---\n\n';
      }
      
      return context;
    } catch (error) {
      console.error('Error getting organizational context:', error);
      return `Error retrieving organizational context: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vector dimensions must match');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Check if document type is indexable
   */
  private isIndexableDocument(filename: string): boolean {
    const indexableExtensions = ['.pdf', '.docx', '.txt', '.md', '.html', '.htm'];
    const ext = path.extname(filename).toLowerCase();
    return indexableExtensions.includes(ext);
  }

  /**
   * Get indexing statistics
   */
  getStats(): { totalDocuments: number; totalEmbeddings: number; cacheSize: number } {
    return {
      totalDocuments: this.documents.size,
      totalEmbeddings: this.embeddings.size,
      cacheSize: this.cache.keys().length
    };
  }

  /**
   * Clear all indexed content
   */
  clearIndex(): void {
    this.documents.clear();
    this.embeddings.clear();
    this.cache.flushAll();
    console.error('🗑️ RAG index cleared');
  }
}