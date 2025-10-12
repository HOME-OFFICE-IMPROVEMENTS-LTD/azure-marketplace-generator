import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';
import chalk from 'chalk';

export interface AzureKeyVaultConfig {
  keyVaultUrl: string;
  tenantId?: string;
  subscriptionId?: string;
}

export interface SecretNames {
  // Azure DevOps
  AZURE_DEVOPS_PAT: string;
  AZURE_DEVOPS_ORG_URL: string;

  // GitHub
  GITHUB_TOKEN: string;
  GITHUB_ORG: string;

  // Azure
  AZURE_CLIENT_ID?: string;
  AZURE_CLIENT_SECRET?: string;
  AZURE_TENANT_ID: string;
  AZURE_SUBSCRIPTION_ID: string;

  // Partner Center
  PARTNER_CENTER_CLIENT_ID?: string;
  PARTNER_CENTER_CLIENT_SECRET?: string;
  PARTNER_CENTER_TENANT_ID?: string;

  // Monitoring & Analytics
  APPLICATION_INSIGHTS_KEY?: string;
  LOG_ANALYTICS_WORKSPACE_ID?: string;
}

export class AzureKeyVaultService {
  private client: SecretClient;
  private config: AzureKeyVaultConfig;
  private secretsCache: Map<string, { value: string; expires: Date }> = new Map();
  private readonly CACHE_TTL_MINUTES = 15; // Cache secrets for 15 minutes

  constructor(config: AzureKeyVaultConfig) {
    this.config = config;

    // Use DefaultAzureCredential for authentication
    // This supports: Managed Identity, Azure CLI, Visual Studio, etc.
    const credential = new DefaultAzureCredential();
    this.client = new SecretClient(config.keyVaultUrl, credential);
  }

  /**
   * Get a secret from Azure Key Vault with caching
   */
  async getSecret(secretName: string): Promise<string | null> {
    try {
      // Check cache first
      const cached = this.secretsCache.get(secretName);
      if (cached && cached.expires > new Date()) {
        return cached.value;
      }

      console.log(chalk.blue(`🔐 Retrieving secret: ${secretName} from Key Vault`));

      const secret = await this.client.getSecret(secretName);
      const value = secret.value;

      if (!value) {
        console.warn(chalk.yellow(`⚠️  Secret ${secretName} exists but has no value`));
        return null;
      }

      // Cache the secret
      const expires = new Date();
      expires.setMinutes(expires.getMinutes() + this.CACHE_TTL_MINUTES);
      this.secretsCache.set(secretName, { value, expires });

      return value;
    } catch (error: any) {
      if (error.code === 'SecretNotFound') {
        console.warn(chalk.yellow(`⚠️  Secret not found in Key Vault: ${secretName}`));
        return null;
      } else if (error.code === 'Forbidden') {
        console.error(chalk.red(`❌ Access denied to Key Vault secret: ${secretName}`));
        console.error(chalk.red('   Ensure the application has proper permissions to the Key Vault'));
        throw error;
      } else {
        console.error(chalk.red(`❌ Failed to retrieve secret ${secretName}:`), error.message);
        throw error;
      }
    }
  }

  /**
   * Get multiple secrets at once
   */
  async getSecrets(secretNames: string[]): Promise<Record<string, string | null>> {
    const results: Record<string, string | null> = {};

    const promises = secretNames.map(async (name) => {
      const value = await this.getSecret(name);
      results[name] = value;
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Get all required secrets for Azure Marketplace Generator
   */
  async getAllMarketplaceSecrets(secretNames: SecretNames): Promise<Record<string, string | null>> {
    const requiredSecrets = [
      secretNames.AZURE_DEVOPS_PAT,
      secretNames.AZURE_DEVOPS_ORG_URL,
      secretNames.GITHUB_TOKEN,
      secretNames.GITHUB_ORG,
      secretNames.AZURE_TENANT_ID,
      secretNames.AZURE_SUBSCRIPTION_ID
    ];

    const optionalSecrets = [
      secretNames.AZURE_CLIENT_ID,
      secretNames.AZURE_CLIENT_SECRET,
      secretNames.PARTNER_CENTER_CLIENT_ID,
      secretNames.PARTNER_CENTER_CLIENT_SECRET,
      secretNames.PARTNER_CENTER_TENANT_ID,
      secretNames.APPLICATION_INSIGHTS_KEY,
      secretNames.LOG_ANALYTICS_WORKSPACE_ID
    ].filter((name): name is string => name !== undefined); // Type guard filter

    const allSecrets = [...requiredSecrets, ...optionalSecrets];
    const secrets = await this.getSecrets(allSecrets);

    // Validate required secrets
    const missingRequired = requiredSecrets.filter(name => !secrets[name]);
    if (missingRequired.length > 0) {
      console.error(chalk.red('❌ Missing required secrets from Key Vault:'));
      missingRequired.forEach(secret => {
        console.error(chalk.red(`   • ${secret}`));
      });
      throw new Error(`Missing required secrets: ${missingRequired.join(', ')}`);
    }

    return secrets;
  }

  /**
   * Test Key Vault connectivity and permissions
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log(chalk.blue('🔐 Testing Key Vault connectivity...'));

      // Try to list secrets (minimal permission test)
      const secretIterator = this.client.listPropertiesOfSecrets();
      await secretIterator.next();

      console.log(chalk.green('✅ Key Vault connection successful'));
      return true;
    } catch (error: any) {
      console.error(chalk.red('❌ Key Vault connection failed:'), error.message);
      return false;
    }
  }

  /**
   * Clear the secrets cache
   */
  clearCache(): void {
    this.secretsCache.clear();
    console.log(chalk.blue('🧹 Key Vault secrets cache cleared'));
  }

  /**
   * Get Key Vault configuration
   */
  getConfig(): AzureKeyVaultConfig {
    return { ...this.config };
  }

  /**
   * Create environment variables from Key Vault secrets
   * This is useful for services that expect environment variables
   */
  async loadSecretsToEnvironment(secretNames: SecretNames): Promise<void> {
    console.log(chalk.blue('🔐 Loading secrets to environment variables...'));

    const secrets = await this.getAllMarketplaceSecrets(secretNames);

    // Map secrets to environment variable names
    const envMapping: Record<string, string> = {
      [secretNames.AZURE_DEVOPS_PAT]: 'AZURE_DEVOPS_PAT',
      [secretNames.AZURE_DEVOPS_ORG_URL]: 'AZURE_DEVOPS_ORG_URL',
      [secretNames.GITHUB_TOKEN]: 'GITHUB_TOKEN',
      [secretNames.GITHUB_ORG]: 'GITHUB_ORG',
      [secretNames.AZURE_TENANT_ID]: 'AZURE_TENANT_ID',
      [secretNames.AZURE_SUBSCRIPTION_ID]: 'AZURE_SUBSCRIPTION_ID'
    };

    // Add optional secrets if they exist
    if (secretNames.AZURE_CLIENT_ID) envMapping[secretNames.AZURE_CLIENT_ID] = 'AZURE_CLIENT_ID';
    if (secretNames.AZURE_CLIENT_SECRET) envMapping[secretNames.AZURE_CLIENT_SECRET] = 'AZURE_CLIENT_SECRET';
    if (secretNames.PARTNER_CENTER_CLIENT_ID) envMapping[secretNames.PARTNER_CENTER_CLIENT_ID] = 'PARTNER_CENTER_CLIENT_ID';
    if (secretNames.PARTNER_CENTER_CLIENT_SECRET) envMapping[secretNames.PARTNER_CENTER_CLIENT_SECRET] = 'PARTNER_CENTER_CLIENT_SECRET';
    if (secretNames.PARTNER_CENTER_TENANT_ID) envMapping[secretNames.PARTNER_CENTER_TENANT_ID] = 'PARTNER_CENTER_TENANT_ID';
    if (secretNames.APPLICATION_INSIGHTS_KEY) envMapping[secretNames.APPLICATION_INSIGHTS_KEY] = 'APPLICATION_INSIGHTS_KEY';
    if (secretNames.LOG_ANALYTICS_WORKSPACE_ID) envMapping[secretNames.LOG_ANALYTICS_WORKSPACE_ID] = 'LOG_ANALYTICS_WORKSPACE_ID';

    let loadedCount = 0;
    for (const [secretName, envVarName] of Object.entries(envMapping)) {
      const value = secrets[secretName];
      if (value) {
        process.env[envVarName] = value;
        loadedCount++;
      }
    }

    console.log(chalk.green(`✅ Loaded ${loadedCount} secrets to environment variables`));
  }
}

/**
 * Factory function to create AzureKeyVaultService with configuration from environment
 */
export function createKeyVaultService(): AzureKeyVaultService {
  const keyVaultUrl = process.env.AZURE_KEYVAULT_URL;

  if (!keyVaultUrl) {
    throw new Error('AZURE_KEYVAULT_URL environment variable is required');
  }

  const config: AzureKeyVaultConfig = {
    keyVaultUrl,
    tenantId: process.env.AZURE_TENANT_ID,
    subscriptionId: process.env.AZURE_SUBSCRIPTION_ID
  };

  return new AzureKeyVaultService(config);
}

/**
 * Default secret names configuration for HOME-OFFICE-IMPROVEMENTS-LTD
 */
export const DEFAULT_SECRET_NAMES: SecretNames = {
  // Azure DevOps
  AZURE_DEVOPS_PAT: 'azmp-azure-devops-pat',
  AZURE_DEVOPS_ORG_URL: 'azmp-azure-devops-org-url',

  // GitHub
  GITHUB_TOKEN: 'azmp-github-token',
  GITHUB_ORG: 'azmp-github-org',

  // Azure
  AZURE_CLIENT_ID: 'azmp-azure-client-id',
  AZURE_CLIENT_SECRET: 'azmp-azure-client-secret',
  AZURE_TENANT_ID: 'azmp-azure-tenant-id',
  AZURE_SUBSCRIPTION_ID: 'azmp-azure-subscription-id',

  // Partner Center
  PARTNER_CENTER_CLIENT_ID: 'azmp-partner-center-client-id',
  PARTNER_CENTER_CLIENT_SECRET: 'azmp-partner-center-client-secret',
  PARTNER_CENTER_TENANT_ID: 'azmp-partner-center-tenant-id',

  // Monitoring & Analytics
  APPLICATION_INSIGHTS_KEY: 'azmp-application-insights-key',
  LOG_ANALYTICS_WORKSPACE_ID: 'azmp-log-analytics-workspace-id'
};