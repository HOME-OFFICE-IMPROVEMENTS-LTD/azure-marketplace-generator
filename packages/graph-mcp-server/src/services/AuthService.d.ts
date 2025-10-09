import { Client } from '@microsoft/msgraph-sdk';
/**
 * Authentication Service for Microsoft Graph
 * Leverages existing Azure CLI authentication infrastructure
 */
export declare class AuthService {
    private credential;
    private graphClient;
    constructor();
    initialize(): Promise<void>;
    getGraphClient(): Client;
    validateAuthentication(): Promise<boolean>;
}
//# sourceMappingURL=AuthService.d.ts.map