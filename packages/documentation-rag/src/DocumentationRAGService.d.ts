import { RAGService } from '../../rag-service/src/RAGService.js';
/**
 * Documentation RAG Service
 * Specialized for Azure Marketplace documentation and best practices
 */
export declare class DocumentationRAGService extends RAGService {
    private documentationSources;
    private bestPractices;
    constructor();
    initialize(): Promise<void>;
    /**
     * Index Azure Marketplace documentation
     */
    indexAzureDocumentation(): Promise<void>;
    /**
     * Index project-specific best practices
     */
    indexBestPractices(): Promise<void>;
    /**
     * Index existing project documentation
     */
    indexProjectDocumentation(): Promise<void>;
    /**
     * Get documentation-specific guidance for a topic
     */
    getDocumentationGuidance(topic: string, category?: string): Promise<string>;
    /**
     * Get best practices for a specific area
     */
    getBestPractices(area: string): Promise<string>;
    /**
     * Generate comprehensive documentation for a template
     */
    generateTemplateDocumentation(templateContext: any): Promise<string>;
    /**
     * Get documentation statistics
     */
    getDocumentationStats(): any;
}
//# sourceMappingURL=DocumentationRAGService.d.ts.map