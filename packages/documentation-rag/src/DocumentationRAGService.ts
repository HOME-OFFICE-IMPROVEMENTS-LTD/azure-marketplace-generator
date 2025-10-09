import { RAGService } from '../../rag-service/src/RAGService.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AzureOpenAI } from '@azure/openai';
import { DefaultAzureCredential } from '@azure/identity';

/**
 * Documentation RAG Service
 * Specialized for Azure Marketplace documentation and best practices
 */
export class DocumentationRAGService extends RAGService {
  private documentationSources: Map<string, any> = new Map();
  private bestPractices: Map<string, any> = new Map();

  constructor() {
    super();
  }

  async initialize(): Promise<void> {
    await super.initialize();
    console.error('📚 Initializing Documentation RAG Service...');
    
    await this.indexAzureDocumentation();
    await this.indexBestPractices();
    await this.indexProjectDocumentation();
    
    console.error('✅ Documentation RAG Service ready');
  }

  /**
   * Index Azure Marketplace documentation
   */
  async indexAzureDocumentation(): Promise<void> {
    console.error('📖 Indexing Azure Marketplace documentation...');

    // Azure Marketplace documentation sources
    const azureDocSources = [
      {
        title: 'Azure Resource Manager Templates',
        content: `
        Azure Resource Manager (ARM) templates are JSON files that define the infrastructure and configuration for your project.
        ARM templates use declarative syntax, meaning you describe what you want to deploy without writing the sequence of programming commands to create it.
        
        Key concepts:
        - Resources: Items you can deploy through Azure
        - Parameters: Values passed into the template during deployment
        - Variables: Values constructed from parameters and other variables
        - Functions: Built-in template functions that help construct values
        - Outputs: Values returned after deployment
        
        Best practices:
        - Use parameters for values that vary between deployments
        - Use variables for complex expressions used multiple times
        - Follow naming conventions for resources
        - Include metadata for documentation
        `,
        category: 'arm-templates',
        url: 'https://docs.microsoft.com/en-us/azure/azure-resource-manager/templates/'
      },
      {
        title: 'Azure Marketplace Publishing Guide',
        content: `
        Azure Marketplace is a commercial marketplace for applications and services built on Microsoft Azure.
        It enables vendors to sell their solutions to Azure customers.
        
        Publishing requirements:
        - Valid Azure subscription
        - Registered Partner Center account
        - Compliance with marketplace policies
        - Technical requirements met
        
        Solution types:
        - Virtual Machine offers
        - Container offers
        - Azure Application offers (Solution Templates and Managed Applications)
        - SaaS offers
        - Consulting Service offers
        
        Best practices:
        - Clear and compelling offer description
        - Comprehensive documentation
        - Strong technical support
        - Regular updates and maintenance
        `,
        category: 'marketplace',
        url: 'https://docs.microsoft.com/en-us/azure/marketplace/'
      },
      {
        title: 'Azure Managed Applications',
        content: `
        Azure Managed Applications enable you to offer cloud solutions that are easy for consumers to deploy and operate.
        
        Key components:
        - mainTemplate.json: ARM template defining Azure resources
        - createUiDefinition.json: UI elements for Azure portal
        - Application definition: Package containing template files
        
        Benefits:
        - Simplified deployment for customers
        - Ongoing management and support
        - Controlled resource access
        - Automatic updates
        
        Use cases:
        - Enterprise software solutions
        - ISV applications
        - Internal IT solutions
        - Partner solutions
        `,
        category: 'managed-apps',
        url: 'https://docs.microsoft.com/en-us/azure/azure-resource-manager/managed-applications/'
      },
      {
        title: 'Azure Security Best Practices',
        content: `
        Security is paramount in Azure deployments. Follow these best practices:
        
        Identity and Access:
        - Use Azure Active Directory for authentication
        - Implement role-based access control (RBAC)
        - Enable multi-factor authentication
        - Use managed identities for Azure resources
        
        Data Protection:
        - Encrypt data at rest and in transit
        - Use Azure Key Vault for secrets management
        - Implement data classification
        - Regular backup and disaster recovery
        
        Network Security:
        - Use Network Security Groups (NSGs)
        - Implement Azure Firewall
        - Use private endpoints
        - Monitor network traffic
        
        Monitoring and Logging:
        - Enable Azure Monitor
        - Use Azure Security Center
        - Implement Azure Sentinel
        - Regular security assessments
        `,
        category: 'security',
        url: 'https://docs.microsoft.com/en-us/azure/security/'
      }
    ];

    for (const doc of azureDocSources) {
      try {
        const embedding = await this.generateEmbedding(doc.content);
        const docId = `azure-doc-${doc.category}-${Date.now()}`;
        
        this.documentationSources.set(docId, {
          ...doc,
          type: 'azure-documentation',
          indexed: new Date().toISOString()
        });
        
        this.embeddings.set(docId, embedding);
      } catch (error) {
        console.error(`Error indexing Azure doc ${doc.title}:`, error);
      }
    }

    console.error(`✅ Indexed ${azureDocSources.length} Azure documentation sources`);
  }

  /**
   * Index project-specific best practices
   */
  async indexBestPractices(): Promise<void> {
    console.error('🎯 Indexing best practices...');

    const bestPracticesContent = [
      {
        title: 'ARM Template Best Practices',
        content: `
        1. Template Structure:
        - Use consistent parameter naming
        - Group related parameters
        - Provide meaningful descriptions
        - Use appropriate parameter types and constraints
        
        2. Resource Naming:
        - Follow organizational naming conventions
        - Include environment indicators
        - Use descriptive names
        - Avoid hardcoded names
        
        3. Security:
        - Never include secrets in templates
        - Use Key Vault references
        - Implement least privilege access
        - Enable diagnostic logging
        
        4. Maintainability:
        - Use nested templates for complex deployments
        - Implement proper versioning
        - Include comprehensive metadata
        - Document all parameters and variables
        
        5. Testing:
        - Validate templates before deployment
        - Test in development environment first
        - Use ARM Template Toolkit (arm-ttk)
        - Implement automated testing
        `,
        category: 'arm-best-practices',
        priority: 'high'
      },
      {
        title: 'Marketplace Solution Design',
        content: `
        1. User Experience:
        - Simple and intuitive deployment
        - Clear parameter descriptions
        - Logical parameter grouping
        - Helpful validation messages
        
        2. Resource Organization:
        - Logical resource grouping
        - Proper dependency management
        - Efficient resource deployment order
        - Clean resource naming
        
        3. Configuration Management:
        - Use parameters for customization
        - Provide sensible defaults
        - Support multiple environments
        - Enable post-deployment configuration
        
        4. Monitoring and Diagnostics:
        - Enable built-in monitoring
        - Provide custom dashboards
        - Implement alerting
        - Include troubleshooting guides
        
        5. Documentation:
        - Comprehensive README
        - Deployment instructions
        - Configuration guidelines
        - Troubleshooting section
        `,
        category: 'solution-design',
        priority: 'high'
      },
      {
        title: 'Organizational Compliance',
        content: `
        1. Data Governance:
        - Understand data classification requirements
        - Implement proper data retention policies
        - Ensure data residency compliance
        - Enable data encryption
        
        2. Access Control:
        - Implement role-based access
        - Use Azure AD integration
        - Enable audit logging
        - Regular access reviews
        
        3. Cost Management:
        - Implement cost controls
        - Use resource tagging
        - Monitor spending patterns
        - Optimize resource usage
        
        4. Backup and Recovery:
        - Implement backup strategies
        - Test recovery procedures
        - Document recovery processes
        - Meet RTO/RPO requirements
        `,
        category: 'compliance',
        priority: 'medium'
      }
    ];

    for (const practice of bestPracticesContent) {
      try {
        const embedding = await this.generateEmbedding(practice.content);
        const practiceId = `best-practice-${practice.category}-${Date.now()}`;
        
        this.bestPractices.set(practiceId, {
          ...practice,
          type: 'best-practice',
          indexed: new Date().toISOString()
        });
        
        this.embeddings.set(practiceId, embedding);
      } catch (error) {
        console.error(`Error indexing best practice ${practice.title}:`, error);
      }
    }

    console.error(`✅ Indexed ${bestPracticesContent.length} best practices`);
  }

  /**
   * Index existing project documentation
   */
  async indexProjectDocumentation(): Promise<void> {
    console.error('📂 Indexing project documentation...');

    try {
      const docsDir = path.join(process.cwd(), 'docs');
      const readmeFile = path.join(process.cwd(), 'README.md');
      
      const docFiles = [];
      
      // Try to read main README
      try {
        const readmeContent = await fs.readFile(readmeFile, 'utf-8');
        docFiles.push({
          title: 'Project README',
          content: readmeContent,
          category: 'project-docs',
          source: 'README.md'
        });
      } catch {
        // README not found, skip
      }

      // Try to read docs directory
      try {
        const files = await fs.readdir(docsDir);
        for (const file of files.slice(0, 10)) { // Limit to first 10 files
          if (file.endsWith('.md')) {
            try {
              const content = await fs.readFile(path.join(docsDir, file), 'utf-8');
              docFiles.push({
                title: path.basename(file, '.md'),
                content: content,
                category: 'project-docs',
                source: `docs/${file}`
              });
            } catch (error) {
              console.error(`Error reading ${file}:`, error);
            }
          }
        }
      } catch {
        // Docs directory not found, skip
      }

      // Index the documentation files
      for (const doc of docFiles) {
        try {
          if (doc.content && doc.content.length > 100) {
            const embedding = await this.generateEmbedding(doc.content);
            const docId = `project-doc-${doc.source.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
            
            this.documentationSources.set(docId, {
              ...doc,
              type: 'project-documentation',
              indexed: new Date().toISOString()
            });
            
            this.embeddings.set(docId, embedding);
          }
        } catch (error) {
          console.error(`Error indexing project doc ${doc.title}:`, error);
        }
      }

      console.error(`✅ Indexed ${docFiles.length} project documentation files`);
    } catch (error) {
      console.error('Error indexing project documentation:', error);
    }
  }

  /**
   * Get documentation-specific guidance for a topic
   */
  async getDocumentationGuidance(topic: string, category?: string): Promise<string> {
    try {
      // Search documentation sources
      const results = await this.semanticSearch(topic, 5);
      
      // Filter by category if specified
      const filteredResults = category 
        ? results.filter(r => r.category === category)
        : results;

      if (filteredResults.length === 0) {
        return `No specific documentation found for: ${topic}`;
      }

      let guidance = `# Documentation Guidance: ${topic}\n\n`;
      
      for (const result of filteredResults.slice(0, 3)) {
        guidance += `## ${result.title}\n`;
        guidance += `**Category**: ${result.category}\n`;
        guidance += `**Relevance**: ${Math.round(result.similarityScore * 100)}%\n`;
        
        if (result.url) {
          guidance += `**Reference**: ${result.url}\n`;
        }
        
        guidance += `**Content**:\n${result.content.slice(0, 500)}...\n\n`;
        guidance += '---\n\n';
      }
      
      return guidance;
    } catch (error) {
      console.error('Error getting documentation guidance:', error);
      return `Error retrieving documentation guidance: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Get best practices for a specific area
   */
  async getBestPractices(area: string): Promise<string> {
    try {
      const results = [];
      
      // Search best practices
      for (const [id, practice] of this.bestPractices.entries()) {
        if (practice.category.includes(area.toLowerCase()) || 
            practice.content.toLowerCase().includes(area.toLowerCase())) {
          results.push({
            ...practice,
            id
          });
        }
      }

      if (results.length === 0) {
        return `No best practices found for: ${area}`;
      }

      let practices = `# Best Practices: ${area}\n\n`;
      
      for (const practice of results.slice(0, 3)) {
        practices += `## ${practice.title}\n`;
        practices += `**Priority**: ${practice.priority}\n`;
        practices += `**Content**:\n${practice.content}\n\n`;
        practices += '---\n\n';
      }
      
      return practices;
    } catch (error) {
      console.error('Error getting best practices:', error);
      return `Error retrieving best practices: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Generate comprehensive documentation for a template
   */
  async generateTemplateDocumentation(templateContext: any): Promise<string> {
    const { solutionType, requirements, organizationName } = templateContext;
    
    try {
      // Get relevant documentation and best practices
      const [documentation, bestPractices, compliance] = await Promise.all([
        this.getDocumentationGuidance(solutionType),
        this.getBestPractices(solutionType),
        this.getBestPractices('compliance')
      ]);

      return `# ${solutionType} Solution Documentation
## Generated for: ${organizationName}

### Solution Overview
${requirements?.description || 'Custom Azure marketplace solution'}

### Requirements
${requirements?.requirements?.map((req: string) => `- ${req}`).join('\n') || 'No specific requirements listed'}

${documentation}

${bestPractices}

${compliance}

### Deployment Instructions
1. Review the ARM template and createUiDefinition
2. Ensure all required parameters are configured
3. Deploy to a test environment first
4. Validate all resources are created correctly
5. Deploy to production environment

### Post-Deployment
1. Verify all services are running
2. Configure monitoring and alerting
3. Test functionality end-to-end
4. Update documentation as needed

### Support
For support with this solution, please contact your IT department or refer to the organizational knowledge base.

Generated at: ${new Date().toISOString()}
`;
    } catch (error) {
      console.error('Error generating template documentation:', error);
      return `Error generating documentation: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Get documentation statistics
   */
  getDocumentationStats(): any {
    return {
      ...this.getStats(),
      azureDocSources: Array.from(this.documentationSources.values()).filter(d => d.type === 'azure-documentation').length,
      bestPractices: this.bestPractices.size,
      projectDocs: Array.from(this.documentationSources.values()).filter(d => d.type === 'project-documentation').length
    };
  }
}