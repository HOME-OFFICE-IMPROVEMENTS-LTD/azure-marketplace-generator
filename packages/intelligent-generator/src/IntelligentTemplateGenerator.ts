import { GraphService } from '../../graph-mcp-server/src/services/GraphService.js';
import { AuthService } from '../../graph-mcp-server/src/services/AuthService.js';
import { RAGService } from '../../rag-service/src/RAGService.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';

/**
 * Intelligent ARM Template Generator
 * Uses organizational context to generate personalized marketplace solutions
 */
export class IntelligentTemplateGenerator {
  private graphService: GraphService;
  private ragService: RAGService;
  private templates: Map<string, any> = new Map();

  constructor() {
    const authService = new AuthService();
    this.graphService = new GraphService(authService);
    this.ragService = new RAGService();
  }

  async initialize(): Promise<void> {
    console.error('🎯 Initializing Intelligent Template Generator...');
    await this.ragService.initialize();
    await this.loadTemplates();
    console.error('✅ Template generator ready');
  }

  /**
   * Load base ARM templates
   */
  private async loadTemplates(): Promise<void> {
    try {
      const templatesDir = path.join(process.cwd(), 'azure-deployment');
      const mainTemplate = await fs.readFile(path.join(templatesDir, 'mainTemplate.json'), 'utf-8');
      const createUiDefinition = await fs.readFile(path.join(templatesDir, 'createUiDefinition.json'), 'utf-8');
      
      this.templates.set('main', JSON.parse(mainTemplate));
      this.templates.set('createUi', JSON.parse(createUiDefinition));
      
      console.error('✅ Base templates loaded');
    } catch (error) {
      console.error('Warning: Could not load base templates:', error);
    }
  }

  /**
   * Generate intelligent ARM template based on organizational context
   */
  async generateIntelligentTemplate(requirements: TemplateRequirements): Promise<GeneratedTemplate> {
    console.error(`🧠 Generating intelligent template for: ${requirements.solutionType}`);

    // Get organizational context
    const orgContext = await this.getOrganizationalContext();
    
    // Get relevant organizational knowledge
    const relevantKnowledge = await this.ragService.getOrganizationalContext(
      `${requirements.solutionType} ${requirements.description}`,
      5
    );

    // Get user-specific context
    const userContext = await this.getUserContext();

    // Generate template with context
    const template = await this.generateContextAwareTemplate({
      requirements,
      orgContext,
      userContext,
      relevantKnowledge
    });

    return template;
  }

  /**
   * Get organizational context from Graph API
   */
  private async getOrganizationalContext(): Promise<OrganizationalContext> {
    try {
      const [orgInfo, groups, currentUser] = await Promise.all([
        this.graphService.getOrganizationInfo(),
        this.graphService.getOrganizationGroups('all', 20),
        this.graphService.getCurrentUserProfile()
      ]);

      return {
        organization: {
          name: orgInfo.displayName || 'Unknown Organization',
          domain: orgInfo.verifiedDomains?.[0]?.name || '',
          location: {
            country: orgInfo.country,
            city: orgInfo.city,
            state: orgInfo.state
          },
          size: this.estimateOrgSize(groups.length)
        },
        groups: groups.map(g => ({
          id: g.id,
          name: g.displayName,
          type: this.getGroupType(g),
          memberCount: g.memberCount || 0
        })),
        currentUser: {
          name: currentUser.displayName,
          email: currentUser.mail,
          department: currentUser.department,
          role: currentUser.jobTitle
        }
      };
    } catch (error) {
      console.error('Error getting organizational context:', error);
      return this.getDefaultOrgContext();
    }
  }

  /**
   * Get user-specific context and preferences
   */
  private async getUserContext(): Promise<UserContext> {
    try {
      const user = await this.graphService.getCurrentUserProfile();
      const userGroups = await this.graphService.getUserGroups(user.id);

      return {
        preferences: this.inferUserPreferences(user, userGroups),
        permissions: this.inferUserPermissions(userGroups),
        expertise: this.inferUserExpertise(user),
        compliance: this.inferComplianceRequirements(userGroups)
      };
    } catch (error) {
      console.error('Error getting user context:', error);
      return this.getDefaultUserContext();
    }
  }

  /**
   * Generate context-aware ARM template
   */
  private async generateContextAwareTemplate(context: GenerationContext): Promise<GeneratedTemplate> {
    const { requirements, orgContext, userContext, relevantKnowledge } = context;

    // Base template structure
    const template = {
      $schema: "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
      contentVersion: "1.0.0.0",
      metadata: {
        generator: "Azure Marketplace Generator with Organizational Intelligence",
        generatedAt: new Date().toISOString(),
        organization: orgContext.organization.name,
        generatedBy: orgContext.currentUser.name,
        solutionType: requirements.solutionType
      },
      parameters: this.generateIntelligentParameters(requirements, orgContext, userContext),
      variables: this.generateIntelligentVariables(requirements, orgContext, userContext),
      resources: await this.generateIntelligentResources(requirements, orgContext, userContext),
      outputs: this.generateIntelligentOutputs(requirements, orgContext, userContext)
    };

    // Generate CreateUiDefinition with organizational context
    const createUiDefinition = this.generateIntelligentCreateUi(requirements, orgContext, userContext);

    // Generate documentation with organizational knowledge
    const documentation = this.generateIntelligentDocumentation(
      requirements,
      orgContext,
      relevantKnowledge
    );

    return {
      mainTemplate: template,
      createUiDefinition,
      documentation,
      deploymentGuide: this.generateDeploymentGuide(requirements, orgContext, userContext),
      organizationalNotes: this.generateOrganizationalNotes(relevantKnowledge)
    };
  }

  /**
   * Generate intelligent parameters based on organizational context
   */
  private generateIntelligentParameters(
    requirements: TemplateRequirements,
    orgContext: OrganizationalContext,
    userContext: UserContext
  ): any {
    const baseParams = {
      location: {
        type: "string",
        defaultValue: this.getPreferredLocation(orgContext),
        metadata: {
          description: `Deployment location (recommended: ${this.getPreferredLocation(orgContext)} based on organization location)`
        }
      },
      environment: {
        type: "string",
        defaultValue: userContext.preferences.defaultEnvironment || "dev",
        allowedValues: ["dev", "test", "staging", "prod"],
        metadata: {
          description: "Environment type for proper resource sizing and policies"
        }
      },
      organizationPrefix: {
        type: "string",
        defaultValue: this.generateOrgPrefix(orgContext.organization.name),
        metadata: {
          description: "Organization prefix for resource naming convention"
        }
      }
    };

    // Add solution-specific parameters
    switch (requirements.solutionType) {
      case 'storage':
        return {
          ...baseParams,
          storageAccountSku: {
            type: "string",
            defaultValue: this.getRecommendedStorageSku(orgContext.organization.size),
            allowedValues: ["Standard_LRS", "Standard_GRS", "Premium_LRS"],
            metadata: {
              description: `Storage SKU (${this.getRecommendedStorageSku(orgContext.organization.size)} recommended for ${orgContext.organization.size} organizations)`
            }
          }
        };
      
      case 'compute':
        return {
          ...baseParams,
          vmSize: {
            type: "string",
            defaultValue: this.getRecommendedVmSize(orgContext.organization.size),
            metadata: {
              description: `VM size optimized for ${orgContext.organization.size} organizations`
            }
          }
        };
      
      default:
        return baseParams;
    }
  }

  /**
   * Generate intelligent variables with organizational context
   */
  private generateIntelligentVariables(
    requirements: TemplateRequirements,
    orgContext: OrganizationalContext,
    userContext: UserContext
  ): any {
    return {
      namingConvention: `[concat(parameters('organizationPrefix'), '-', parameters('environment'), '-', '${requirements.solutionType}')]`,
      tags: {
        Organization: orgContext.organization.name,
        Department: orgContext.currentUser.department || 'IT',
        CreatedBy: orgContext.currentUser.name,
        Environment: "[parameters('environment')]",
        SolutionType: requirements.solutionType,
        GeneratedAt: new Date().toISOString()
      },
      compliance: {
        dataResidency: this.getDataResidencyRequirements(orgContext),
        encryption: userContext.compliance.requiresEncryption,
        monitoring: userContext.compliance.requiresMonitoring
      }
    };
  }

  /**
   * Generate intelligent resources based on context
   */
  private async generateIntelligentResources(
    requirements: TemplateRequirements,
    orgContext: OrganizationalContext,
    userContext: UserContext
  ): Promise<any[]> {
    const resources = [];

    // Always include resource group tags
    resources.push(this.generateResourceGroupResource());

    // Add solution-specific resources
    switch (requirements.solutionType) {
      case 'storage':
        resources.push(...this.generateStorageResources(requirements, orgContext, userContext));
        break;
      case 'compute':
        resources.push(...this.generateComputeResources(requirements, orgContext, userContext));
        break;
      case 'networking':
        resources.push(...this.generateNetworkingResources(requirements, orgContext, userContext));
        break;
    }

    // Add compliance resources if required
    if (userContext.compliance.requiresMonitoring) {
      resources.push(...this.generateMonitoringResources());
    }

    if (userContext.compliance.requiresEncryption) {
      resources.push(...this.generateEncryptionResources());
    }

    return resources;
  }

  /**
   * Generate intelligent outputs
   */
  private generateIntelligentOutputs(
    requirements: TemplateRequirements,
    orgContext: OrganizationalContext,
    userContext: UserContext
  ): any {
    return {
      deploymentSummary: {
        type: "object",
        value: {
          organization: orgContext.organization.name,
          deployedBy: orgContext.currentUser.name,
          solutionType: requirements.solutionType,
          environment: "[parameters('environment')]",
          location: "[parameters('location')]",
          deploymentTime: "[utcNow()]"
        }
      },
      resourceNamingPattern: {
        type: "string",
        value: "[variables('namingConvention')]"
      },
      complianceStatus: {
        type: "object",
        value: {
          encryptionEnabled: userContext.compliance.requiresEncryption,
          monitoringEnabled: userContext.compliance.requiresMonitoring,
          dataResidency: "[variables('compliance').dataResidency]"
        }
      }
    };
  }

  // Helper methods for context inference and generation
  private estimateOrgSize(groupCount: number): 'small' | 'medium' | 'large' {
    if (groupCount < 10) return 'small';
    if (groupCount < 50) return 'medium';
    return 'large';
  }

  private getGroupType(group: any): string {
    if (group.groupTypes?.includes('Unified')) return 'microsoft365';
    if (group.securityEnabled) return 'security';
    if (group.mailEnabled) return 'distribution';
    return 'other';
  }

  private inferUserPreferences(user: any, groups: any[]): UserPreferences {
    return {
      defaultEnvironment: groups.some(g => g.displayName?.toLowerCase().includes('dev')) ? 'dev' : 'prod',
      preferredRegion: 'eastus', // Could be inferred from org location
      resourceNamingStyle: 'conventional'
    };
  }

  private inferUserPermissions(groups: any[]): string[] {
    const permissions = ['read'];
    
    if (groups.some(g => g.displayName?.toLowerCase().includes('admin'))) {
      permissions.push('admin');
    }
    
    if (groups.some(g => g.displayName?.toLowerCase().includes('dev'))) {
      permissions.push('deploy');
    }
    
    return permissions;
  }

  private inferUserExpertise(user: any): string[] {
    const expertise = [];
    const title = user.jobTitle?.toLowerCase() || '';
    
    if (title.includes('architect')) expertise.push('architecture');
    if (title.includes('dev')) expertise.push('development');
    if (title.includes('ops') || title.includes('admin')) expertise.push('operations');
    if (title.includes('security')) expertise.push('security');
    
    return expertise.length > 0 ? expertise : ['general'];
  }

  private inferComplianceRequirements(groups: any[]): ComplianceRequirements {
    return {
      requiresEncryption: groups.some(g => 
        g.displayName?.toLowerCase().includes('security') ||
        g.displayName?.toLowerCase().includes('compliance')
      ),
      requiresMonitoring: true, // Default to true for enterprise
      dataResidency: 'region' // Could be inferred from org location
    };
  }

  private getPreferredLocation(orgContext: OrganizationalContext): string {
    const country = orgContext.organization.location.country;
    
    // Map countries to preferred Azure regions
    const regionMap: { [key: string]: string } = {
      'United States': 'eastus',
      'United Kingdom': 'uksouth',
      'Germany': 'westeurope',
      'Canada': 'canadacentral',
      'Australia': 'australiaeast'
    };
    
    return regionMap[country] || 'eastus';
  }

  private generateOrgPrefix(orgName: string): string {
    return orgName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 6);
  }

  private getRecommendedStorageSku(orgSize: string): string {
    switch (orgSize) {
      case 'small': return 'Standard_LRS';
      case 'medium': return 'Standard_GRS';
      case 'large': return 'Premium_LRS';
      default: return 'Standard_LRS';
    }
  }

  private getRecommendedVmSize(orgSize: string): string {
    switch (orgSize) {
      case 'small': return 'Standard_B2s';
      case 'medium': return 'Standard_D2s_v3';
      case 'large': return 'Standard_D4s_v3';
      default: return 'Standard_B2s';
    }
  }

  private getDataResidencyRequirements(orgContext: OrganizationalContext): string {
    // Could be enhanced with more sophisticated logic
    return orgContext.organization.location.country === 'Germany' ? 'eu' : 'global';
  }

  // Resource generation methods
  private generateResourceGroupResource(): any {
    return {
      type: "Microsoft.Resources/resourceGroups",
      apiVersion: "2021-04-01",
      name: "[variables('namingConvention')]",
      location: "[parameters('location')]",
      tags: "[variables('tags')]"
    };
  }

  private generateStorageResources(requirements: TemplateRequirements, orgContext: OrganizationalContext, userContext: UserContext): any[] {
    // Implementation for storage resources
    return [];
  }

  private generateComputeResources(requirements: TemplateRequirements, orgContext: OrganizationalContext, userContext: UserContext): any[] {
    // Implementation for compute resources
    return [];
  }

  private generateNetworkingResources(requirements: TemplateRequirements, orgContext: OrganizationalContext, userContext: UserContext): any[] {
    // Implementation for networking resources
    return [];
  }

  private generateMonitoringResources(): any[] {
    // Implementation for monitoring resources
    return [];
  }

  private generateEncryptionResources(): any[] {
    // Implementation for encryption resources
    return [];
  }

  private generateIntelligentCreateUi(requirements: TemplateRequirements, orgContext: OrganizationalContext, userContext: UserContext): any {
    // Implementation for CreateUiDefinition
    return {
      $schema: "https://schema.management.azure.com/schemas/0.1.2-preview/CreateUIDefinition.MultiVm.json#",
      handler: "Microsoft.Azure.CreateUIDef",
      version: "0.1.2-preview",
      parameters: {
        basics: [
          {
            name: "organizationInfo",
            type: "Microsoft.Common.InfoBox",
            visible: true,
            options: {
              icon: "Info",
              text: `Deploying for: ${orgContext.organization.name} | User: ${orgContext.currentUser.name}`
            }
          }
        ]
      }
    };
  }

  private generateIntelligentDocumentation(requirements: TemplateRequirements, orgContext: OrganizationalContext, relevantKnowledge: string): string {
    return `# ${requirements.solutionType} Solution for ${orgContext.organization.name}

## Generated Template Information
- **Solution Type**: ${requirements.solutionType}
- **Generated For**: ${orgContext.organization.name}
- **Generated By**: ${orgContext.currentUser.name}
- **Generated At**: ${new Date().toISOString()}

## Organizational Context
- **Organization Size**: ${orgContext.organization.size}
- **Location**: ${orgContext.organization.location.city}, ${orgContext.organization.location.country}
- **Groups**: ${orgContext.groups.length} active groups

## Relevant Organizational Knowledge
${relevantKnowledge}

## Deployment Instructions
[Generated deployment instructions would be here]
`;
  }

  private generateDeploymentGuide(requirements: TemplateRequirements, orgContext: OrganizationalContext, userContext: UserContext): string {
    return `# Deployment Guide\n\nInstructions specific to ${orgContext.organization.name}...`;
  }

  private generateOrganizationalNotes(relevantKnowledge: string): string {
    return `# Organizational Notes\n\n${relevantKnowledge}`;
  }

  private getDefaultOrgContext(): OrganizationalContext {
    return {
      organization: {
        name: 'Default Organization',
        domain: '',
        location: { country: 'United States', city: '', state: '' },
        size: 'medium'
      },
      groups: [],
      currentUser: {
        name: 'Unknown User',
        email: '',
        department: '',
        role: ''
      }
    };
  }

  private getDefaultUserContext(): UserContext {
    return {
      preferences: {
        defaultEnvironment: 'dev',
        preferredRegion: 'eastus',
        resourceNamingStyle: 'conventional'
      },
      permissions: ['read'],
      expertise: ['general'],
      compliance: {
        requiresEncryption: false,
        requiresMonitoring: false,
        dataResidency: 'global'
      }
    };
  }
}

// Type definitions
interface TemplateRequirements {
  solutionType: string;
  description: string;
  requirements: string[];
}

interface OrganizationalContext {
  organization: {
    name: string;
    domain: string;
    location: {
      country: string;
      city: string;
      state: string;
    };
    size: 'small' | 'medium' | 'large';
  };
  groups: Array<{
    id: string;
    name: string;
    type: string;
    memberCount: number;
  }>;
  currentUser: {
    name: string;
    email: string;
    department: string;
    role: string;
  };
}

interface UserContext {
  preferences: UserPreferences;
  permissions: string[];
  expertise: string[];
  compliance: ComplianceRequirements;
}

interface UserPreferences {
  defaultEnvironment: string;
  preferredRegion: string;
  resourceNamingStyle: string;
}

interface ComplianceRequirements {
  requiresEncryption: boolean;
  requiresMonitoring: boolean;
  dataResidency: string;
}

interface GenerationContext {
  requirements: TemplateRequirements;
  orgContext: OrganizationalContext;
  userContext: UserContext;
  relevantKnowledge: string;
}

interface GeneratedTemplate {
  mainTemplate: any;
  createUiDefinition: any;
  documentation: string;
  deploymentGuide: string;
  organizationalNotes: string;
}