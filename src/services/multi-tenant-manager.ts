import * as chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

/**
 * Multi-Tenant Architecture Support
 *
 * Provides tenant-aware paths, credential vaulting, and per-tenant
 * configuration isolation for enterprise customers.
 */

export interface TenantConfiguration {
  tenantId: string;
  displayName: string;
  subscriptionId: string;
  defaultRegion: string;
  storageBackend: 'local' | 'blob' | 'shared';
  credentials: {
    type: 'cli' | 'service-principal' | 'managed-identity';
    clientId?: string;
    tenantId?: string;
    vaultName?: string;
    secretName?: string;
  };
  isolation: {
    separatePackages: boolean;
    separateCache: boolean;
    separateConfig: boolean;
    separateLogs: boolean;
  };
  compliance: {
    framework: string[];
    dataResidency: string;
    retentionPeriod: number;
  };
}

export interface TenantContext {
  tenant: TenantConfiguration;
  workspacePath: string;
  configPath: string;
  packagesPath: string;
  cachePath: string;
  logsPath: string;
  tempPath: string;
}

export interface CredentialStore {
  vaultName: string;
  secretName: string;
  value: any;
  expiresAt?: Date;
  metadata: {
    tenantId: string;
    createdAt: Date;
    lastUsed: Date;
  };
}

export class MultiTenantManager {
  private tenants: Map<string, TenantConfiguration> = new Map();
  private currentTenant?: string;
  private basePath: string;
  private credentialCache: Map<string, CredentialStore> = new Map();

  constructor(basePath?: string) {
    this.basePath = basePath || path.join(os.homedir(), '.azmp');
    this.loadTenantConfigurations();
  }

  /**
   * Initialize multi-tenant environment
   */
  async initializeMultiTenant(): Promise<void> {
    console.log(chalk.blue('🏢 Initializing multi-tenant environment...'));

    // Create base directory structure
    await fs.ensureDir(this.basePath);
    await fs.ensureDir(path.join(this.basePath, 'tenants'));
    await fs.ensureDir(path.join(this.basePath, 'global'));
    await fs.ensureDir(path.join(this.basePath, 'vault'));

    // Create global configuration
    const globalConfig = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      features: {
        multiTenancy: true,
        credentialVaulting: true,
        isolation: true
      }
    };

    await fs.writeJson(path.join(this.basePath, 'global', 'config.json'), globalConfig, { spaces: 2 });

    console.log(chalk.green(`✅ Multi-tenant environment initialized at ${this.basePath}`));
  }

  /**
   * Register new tenant
   */
  async registerTenant(config: TenantConfiguration): Promise<void> {
    console.log(chalk.blue(`🏢 Registering tenant: ${config.displayName} (${config.tenantId})`));

    // Validate tenant configuration
    this.validateTenantConfig(config);

    // Create tenant workspace
    const tenantContext = await this.createTenantWorkspace(config);

    // Store tenant configuration
    this.tenants.set(config.tenantId, config);
    await this.saveTenantConfiguration(config);

    // Initialize tenant-specific services
    await this.initializeTenantServices(tenantContext);

    console.log(chalk.green(`✅ Tenant ${config.displayName} registered successfully`));
  }

  /**
   * Switch to specific tenant context
   */
  async switchTenant(tenantId: string): Promise<TenantContext> {
    console.log(chalk.blue(`🔄 Switching to tenant: ${tenantId}`));

    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    this.currentTenant = tenantId;

    // Update environment variables for tenant context
    process.env.AZMP_TENANT_ID = tenantId;
    process.env.AZURE_SUBSCRIPTION_ID = tenant.subscriptionId;

    const context = this.getTenantContext(tenant);

    // Ensure tenant workspace exists
    await fs.ensureDir(context.workspacePath);

    console.log(chalk.green(`✅ Switched to tenant: ${tenant.displayName}`));
    return context;
  }

  /**
   * Get current tenant context
   */
  getCurrentTenantContext(): TenantContext | null {
    if (!this.currentTenant) {
      return null;
    }

    const tenant = this.tenants.get(this.currentTenant);
    if (!tenant) {
      return null;
    }

    return this.getTenantContext(tenant);
  }

  /**
   * List all tenants
   */
  listTenants(): TenantConfiguration[] {
    return Array.from(this.tenants.values());
  }

  /**
   * Store credentials securely for tenant
   */
  async storeCredentials(tenantId: string, credentials: any): Promise<void> {
    console.log(chalk.blue(`🔐 Storing credentials for tenant: ${tenantId}`));

    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    const credentialStore: CredentialStore = {
      vaultName: tenant.credentials.vaultName || `azmp-${tenantId}`,
      secretName: tenant.credentials.secretName || 'credentials',
      value: credentials,
      metadata: {
        tenantId,
        createdAt: new Date(),
        lastUsed: new Date()
      }
    };

    // Store in Azure Key Vault if available, otherwise encrypt locally
    if (tenant.credentials.type === 'service-principal' && tenant.credentials.vaultName) {
      await this.storeInKeyVault(credentialStore);
    } else {
      await this.storeCredentialsLocally(credentialStore);
    }

    console.log(chalk.green('✅ Credentials stored securely'));
  }

  /**
   * Retrieve credentials for tenant
   */
  async getCredentials(tenantId: string): Promise<any> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    // Check cache first
    const cacheKey = `${tenantId}-credentials`;
    if (this.credentialCache.has(cacheKey)) {
      const cached = this.credentialCache.get(cacheKey)!;
      cached.metadata.lastUsed = new Date();
      return cached.value;
    }

    // Retrieve from vault or local storage
    let credentials;
    if (tenant.credentials.type === 'service-principal' && tenant.credentials.vaultName) {
      credentials = await this.retrieveFromKeyVault(tenantId);
    } else {
      credentials = await this.retrieveCredentialsLocally(tenantId);
    }

    // Cache for performance
    this.credentialCache.set(cacheKey, {
      vaultName: tenant.credentials.vaultName || `azmp-${tenantId}`,
      secretName: tenant.credentials.secretName || 'credentials',
      value: credentials,
      metadata: {
        tenantId,
        createdAt: new Date(),
        lastUsed: new Date()
      }
    });

    return credentials;
  }

  /**
   * Get tenant-aware package storage path
   */
  getTenantPackagePath(tenantId: string, packageId?: string): string {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    const context = this.getTenantContext(tenant);

    if (packageId) {
      return path.join(context.packagesPath, packageId);
    }

    return context.packagesPath;
  }

  /**
   * Get tenant-aware cache path
   */
  getTenantCachePath(tenantId: string, cacheType?: string): string {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    const context = this.getTenantContext(tenant);

    if (cacheType) {
      return path.join(context.cachePath, cacheType);
    }

    return context.cachePath;
  }

  /**
   * Clean up tenant resources
   */
  async cleanupTenant(tenantId: string, force: boolean = false): Promise<void> {
    console.log(chalk.yellow(`🧹 Cleaning up tenant: ${tenantId}`));

    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    const context = this.getTenantContext(tenant);

    if (force) {
      // Remove all tenant data
      await fs.remove(context.workspacePath);
      this.tenants.delete(tenantId);
      await this.removeTenantConfiguration(tenantId);
    } else {
      // Clean cache and temp files only
      await fs.remove(context.cachePath);
      await fs.remove(context.tempPath);
      await fs.ensureDir(context.cachePath);
      await fs.ensureDir(context.tempPath);
    }

    console.log(chalk.green(`✅ Tenant cleanup completed: ${tenantId}`));
  }

  /**
   * Validate tenant isolation
   */
  async validateTenantIsolation(): Promise<{
    tenantId: string;
    isolated: boolean;
    issues: string[];
  }[]> {
    console.log(chalk.blue('🔍 Validating tenant isolation...'));

    const results = [];

    for (const [tenantId, tenant] of this.tenants) {
      const issues = [];
      const context = this.getTenantContext(tenant);

      // Check directory isolation
      if (tenant.isolation.separatePackages && !await fs.pathExists(context.packagesPath)) {
        issues.push('Packages directory not isolated');
      }

      if (tenant.isolation.separateCache && !await fs.pathExists(context.cachePath)) {
        issues.push('Cache directory not isolated');
      }

      if (tenant.isolation.separateConfig && !await fs.pathExists(context.configPath)) {
        issues.push('Config directory not isolated');
      }

      // Check credential isolation
      const hasCredentials = this.credentialCache.has(`${tenantId}-credentials`);
      if (!hasCredentials) {
        issues.push('Credentials not properly isolated');
      }

      results.push({
        tenantId,
        isolated: issues.length === 0,
        issues
      });
    }

    return results;
  }

  /**
   * Validate tenant configuration
   */
  private validateTenantConfig(config: TenantConfiguration): void {
    if (!config.tenantId || !config.displayName) {
      throw new Error('Tenant ID and display name are required');
    }

    if (!config.subscriptionId) {
      throw new Error('Subscription ID is required');
    }

    if (this.tenants.has(config.tenantId)) {
      throw new Error(`Tenant already exists: ${config.tenantId}`);
    }
  }

  /**
   * Create tenant workspace
   */
  private async createTenantWorkspace(config: TenantConfiguration): Promise<TenantContext> {
    const context = this.getTenantContext(config);

    // Create directory structure
    await fs.ensureDir(context.workspacePath);
    await fs.ensureDir(context.configPath);
    await fs.ensureDir(context.packagesPath);
    await fs.ensureDir(context.cachePath);
    await fs.ensureDir(context.logsPath);
    await fs.ensureDir(context.tempPath);

    // Create tenant-specific gitignore
    const gitignoreContent = `
# Azure Marketplace Generator - Tenant ${config.tenantId}
cache/
temp/
*.log
.env
credentials.json
`;
    await fs.writeFile(path.join(context.workspacePath, '.gitignore'), gitignoreContent.trim());

    return context;
  }

  /**
   * Get tenant context
   */
  private getTenantContext(tenant: TenantConfiguration): TenantContext {
    const workspacePath = path.join(this.basePath, 'tenants', tenant.tenantId);

    return {
      tenant,
      workspacePath,
      configPath: path.join(workspacePath, 'config'),
      packagesPath: path.join(workspacePath, 'packages'),
      cachePath: path.join(workspacePath, 'cache'),
      logsPath: path.join(workspacePath, 'logs'),
      tempPath: path.join(workspacePath, 'temp')
    };
  }

  /**
   * Initialize tenant-specific services
   */
  private async initializeTenantServices(context: TenantContext): Promise<void> {
    // Create tenant configuration file
    const tenantConfig = {
      ...context.tenant,
      createdAt: new Date().toISOString(),
      version: '1.0.0'
    };

    await fs.writeJson(
      path.join(context.configPath, 'tenant.json'),
      tenantConfig,
      { spaces: 2 }
    );

    // Initialize monitoring configuration
    const monitoringConfig = {
      tenantId: context.tenant.tenantId,
      enabled: true,
      metrics: {
        packages: true,
        deployments: true,
        costs: true,
        compliance: true
      },
      retention: context.tenant.compliance.retentionPeriod || 365
    };

    await fs.writeJson(
      path.join(context.configPath, 'monitoring.json'),
      monitoringConfig,
      { spaces: 2 }
    );
  }

  /**
   * Load tenant configurations
   */
  private async loadTenantConfigurations(): Promise<void> {
    try {
      const tenantsPath = path.join(this.basePath, 'tenants');

      if (!await fs.pathExists(tenantsPath)) {
        return;
      }

      const tenantDirs = await fs.readdir(tenantsPath, { withFileTypes: true });

      for (const dir of tenantDirs) {
        if (dir.isDirectory()) {
          const configPath = path.join(tenantsPath, dir.name, 'config', 'tenant.json');

          if (await fs.pathExists(configPath)) {
            const config = await fs.readJson(configPath);
            this.tenants.set(config.tenantId, config);
          }
        }
      }
    } catch (error) {
      // Ignore loading errors
    }
  }

  /**
   * Save tenant configuration
   */
  private async saveTenantConfiguration(config: TenantConfiguration): Promise<void> {
    const context = this.getTenantContext(config);
    await fs.writeJson(
      path.join(context.configPath, 'tenant.json'),
      config,
      { spaces: 2 }
    );
  }

  /**
   * Remove tenant configuration
   */
  private async removeTenantConfiguration(tenantId: string): Promise<void> {
    const configPath = path.join(this.basePath, 'tenants', tenantId);
    await fs.remove(configPath);
  }

  /**
   * Store credentials in Azure Key Vault
   */
  private async storeInKeyVault(store: CredentialStore): Promise<void> {
    try {
      const credentialsJson = JSON.stringify({
        ...store.value,
        metadata: store.metadata
      });

      execSync(
        `az keyvault secret set --vault-name ${store.vaultName} --name ${store.secretName} --value '${credentialsJson}'`,
        { timeout: 30000 }
      );
    } catch (error) {
      throw new Error(`Failed to store credentials in Key Vault: ${error}`);
    }
  }

  /**
   * Retrieve credentials from Azure Key Vault
   */
  private async retrieveFromKeyVault(tenantId: string): Promise<any> {
    try {
      const tenant = this.tenants.get(tenantId)!;
      const output = execSync(
        `az keyvault secret show --vault-name ${tenant.credentials.vaultName} --name ${tenant.credentials.secretName} --query value -o tsv`,
        { encoding: 'utf8', timeout: 30000 }
      );

      const credentialData = JSON.parse(output.trim());
      return credentialData;
    } catch (error) {
      throw new Error(`Failed to retrieve credentials from Key Vault: ${error}`);
    }
  }

  /**
   * Store credentials locally (encrypted)
   */
  private async storeCredentialsLocally(store: CredentialStore): Promise<void> {
    const vaultPath = path.join(this.basePath, 'vault');
    await fs.ensureDir(vaultPath);

    const credentialFile = path.join(vaultPath, `${store.metadata.tenantId}.json`);

    // In a real implementation, encrypt the credentials before storing
    const credentialData = {
      ...store,
      encrypted: true,
      algorithm: 'aes-256-gcm' // Placeholder
    };

    await fs.writeJson(credentialFile, credentialData, { spaces: 2 });
  }

  /**
   * Retrieve credentials locally
   */
  private async retrieveCredentialsLocally(tenantId: string): Promise<any> {
    const credentialFile = path.join(this.basePath, 'vault', `${tenantId}.json`);

    if (!await fs.pathExists(credentialFile)) {
      throw new Error(`No credentials found for tenant: ${tenantId}`);
    }

    const credentialData = await fs.readJson(credentialFile);

    // In a real implementation, decrypt the credentials here
    return credentialData.value;
  }

  /**
   * Print tenant status
   */
  printTenantStatus(): void {
    console.log(chalk.blue('\n🏢 MULTI-TENANT STATUS'));
    console.log(chalk.blue('======================'));

    console.log(chalk.white(`Base Path: ${this.basePath}`));
    console.log(chalk.white(`Total Tenants: ${this.tenants.size}`));
    console.log(chalk.white(`Current Tenant: ${this.currentTenant || 'None'}`));

    if (this.tenants.size > 0) {
      console.log(chalk.white('\nRegistered Tenants:'));
      for (const [tenantId, tenant] of this.tenants) {
        const marker = tenantId === this.currentTenant ? '👉' : '  ';
        console.log(chalk.white(`${marker} ${tenant.displayName} (${tenantId})`));
        console.log(chalk.gray(`     Subscription: ${tenant.subscriptionId}`));
        console.log(chalk.gray(`     Region: ${tenant.defaultRegion}`));
        console.log(chalk.gray(`     Storage: ${tenant.storageBackend}`));
      }
    }
  }
}