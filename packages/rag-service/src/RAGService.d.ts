/**
 * RAG Service for Organizational Knowledge
 * Provides semantic search and embeddings for SharePoint/Teams content
 */
export declare class RAGService {
    private openaiClient;
    private graphService;
    private cache;
    private embeddings;
    private documents;
    constructor();
    /**
     * Initialize RAG service
     */
    initialize(): Promise<void>;
    /**
     * Generate embeddings for text content
     */
    generateEmbedding(text: string): Promise<number[]>;
    /**
     * Extract text content from various file types
     */
    extractTextContent(content: Buffer, filename: string): Promise<string>;
    /**
     * Index SharePoint documents for semantic search
     */
    indexSharePointContent(siteId?: string, limit?: number): Promise<void>;
    /**
     * Index Teams conversations for semantic search
     */
    indexTeamsContent(teamId?: string, limit?: number): Promise<void>;
    /**
     * Perform semantic search across indexed content
     */
    semanticSearch(query: string, limit?: number, contentType?: 'sharepoint' | 'teams'): Promise<any[]>;
    /**
     * Get organizational knowledge for context
     */
    getOrganizationalContext(topic: string, limit?: number): Promise<string>;
    /**
     * Calculate cosine similarity between two vectors
     */
    private cosineSimilarity;
    /**
     * Check if document type is indexable
     */
    private isIndexableDocument;
    /**
     * Get indexing statistics
     */
    getStats(): {
        totalDocuments: number;
        totalEmbeddings: number;
        cacheSize: number;
    };
    /**
     * Clear all indexed content
     */
    clearIndex(): void;
}
//# sourceMappingURL=RAGService.d.ts.map