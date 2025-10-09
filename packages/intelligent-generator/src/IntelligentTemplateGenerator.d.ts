/**
 * Intelligent ARM Template Generator
 * Uses organizational context to generate personalized marketplace solutions
 */
export declare class IntelligentTemplateGenerator {
    private graphService;
    private ragService;
    private templates;
    constructor();
    initialize(): Promise<void>;
    /**
     * Load base ARM templates
     */
    private loadTemplates;
    /**
     * Generate intelligent ARM template based on organizational context
     */
    generateIntelligentTemplate(requirements: TemplateRequirements): Promise<GeneratedTemplate>;
    /**
     * Get organizational context from Graph API
     */
    private getOrganizationalContext;
    /**
     * Get user-specific context and preferences
     */
    private getUserContext;
    /**
     * Generate context-aware ARM template
     */
    private generateContextAwareTemplate;
    /**
     * Generate intelligent parameters based on organizational context
     */
    private generateIntelligentParameters;
    /**
     * Generate intelligent variables with organizational context
     */
    private generateIntelligentVariables;
    /**
     * Generate intelligent resources based on context
     */
    private generateIntelligentResources;
    /**
     * Generate intelligent outputs
     */
    private generateIntelligentOutputs;
    private estimateOrgSize;
    private getGroupType;
    private inferUserPreferences;
    private inferUserPermissions;
    private inferUserExpertise;
    private inferComplianceRequirements;
    private getPreferredLocation;
    private generateOrgPrefix;
    private getRecommendedStorageSku;
    private getRecommendedVmSize;
    private getDataResidencyRequirements;
    private generateResourceGroupResource;
    private generateStorageResources;
    private generateComputeResources;
    private generateNetworkingResources;
    private generateMonitoringResources;
    private generateEncryptionResources;
    private generateIntelligentCreateUi;
    private generateIntelligentDocumentation;
    private generateDeploymentGuide;
    private generateOrganizationalNotes;
    private getDefaultOrgContext;
    private getDefaultUserContext;
}
interface TemplateRequirements {
    solutionType: string;
    description: string;
    requirements: string[];
}
interface GeneratedTemplate {
    mainTemplate: any;
    createUiDefinition: any;
    documentation: string;
    deploymentGuide: string;
    organizationalNotes: string;
}
export {};
//# sourceMappingURL=IntelligentTemplateGenerator.d.ts.map