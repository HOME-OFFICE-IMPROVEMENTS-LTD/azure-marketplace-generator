import { DefaultAzureCredential, ChainedTokenCredential, AzureCliCredential } from '@azure/identity';
import { Client } from '@microsoft/msgraph-sdk';
import { TokenCredentialAuthenticationProvider } from '@microsoft/msgraph-sdk/lib/src/authentication/TokenCredentialAuthenticationProvider.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Authentication Service for Microsoft Graph
 * Leverages existing Azure CLI authentication infrastructure
 */
export class AuthService {
  private credential: ChainedTokenCredential;
  private graphClient: Client | null = null;

  constructor() {
    // Use Azure CLI credential first (matches your azure-auth-helper.sh workflow)
    // Fall back to other methods if needed
    this.credential = new ChainedTokenCredential(
      new AzureCliCredential(),
      new DefaultAzureCredential()
    );
  }

  async initialize(): Promise<void> {
    try {
      // Test authentication
      const token = await this.credential.getToken(['https://graph.microsoft.com/.default']);
      console.error('✅ Authentication successful, token acquired');
      
      // Initialize Graph client
      const authProvider = new TokenCredentialAuthenticationProvider(
        this.credential,
        { scopes: ['https://graph.microsoft.com/.default'] }
      );
      
      this.graphClient = Client.initWithMiddleware({ authProvider });
      console.error('✅ Microsoft Graph client initialized');
      
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      console.error('💡 Try running: azmp auth --fix-mfa');
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getGraphClient(): Client {
    if (!this.graphClient) {
      throw new Error('Graph client not initialized. Call initialize() first.');
    }
    return this.graphClient;
  }

  async validateAuthentication(): Promise<boolean> {
    try {
      const token = await this.credential.getToken(['https://graph.microsoft.com/.default']);
      return !!token;
    } catch {
      return false;
    }
  }
}