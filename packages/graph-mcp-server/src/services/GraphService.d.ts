import { AuthService } from './AuthService.js';
/**
 * Microsoft Graph Service
 * Provides high-level Graph API operations for organizational context
 */
export declare class GraphService {
    private authService;
    constructor(authService: AuthService);
    getCurrentUserProfile(): Promise<{
        id: any;
        displayName: any;
        mail: any;
        userPrincipalName: any;
        jobTitle: any;
        department: any;
        officeLocation: any;
        businessPhones: any;
        mobilePhone: any;
    }>;
    searchUsers(query: string, limit?: number): Promise<any>;
    getOrganizationGroups(type?: string, limit?: number): Promise<any>;
    getUserGroups(userId: string): Promise<any>;
    getOrganizationInfo(): Promise<any>;
    searchSharePointContent(query: string, siteId?: string, contentType?: string, limit?: number): Promise<{
        id: any;
        name: any;
        webUrl: any;
        summary: any;
        contentType: any;
        lastModified: any;
        createdBy: any;
    }[]>;
    getTeamsContent(teamId?: string, channelId?: string, query?: string, contentType?: string, limit?: number): Promise<any[]>;
}
//# sourceMappingURL=GraphService.d.ts.map