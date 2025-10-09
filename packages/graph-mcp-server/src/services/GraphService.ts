import { AuthService } from './AuthService.js';

/**
 * Microsoft Graph Service
 * Provides high-level Graph API operations for organizational context
 */
export class GraphService {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  async getCurrentUserProfile() {
    const client = this.authService.getGraphClient();
    try {
      const user = await client.api('/me').get();
      return {
        id: user.id,
        displayName: user.displayName,
        mail: user.mail,
        userPrincipalName: user.userPrincipalName,
        jobTitle: user.jobTitle,
        department: user.department,
        officeLocation: user.officeLocation,
        businessPhones: user.businessPhones,
        mobilePhone: user.mobilePhone
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  async searchUsers(query: string, limit: number = 10) {
    const client = this.authService.getGraphClient();
    try {
      const users = await client.api('/users')
        .search(`"displayName:${query}" OR "mail:${query}"`)
        .top(limit)
        .select('id,displayName,mail,userPrincipalName,jobTitle,department')
        .get();
      
      return users.value || [];
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  async getOrganizationGroups(type: string = 'all', limit: number = 20) {
    const client = this.authService.getGraphClient();
    try {
      let filter = '';
      if (type !== 'all') {
        switch (type) {
          case 'security':
            filter = "groupTypes/any(c:c eq 'DynamicMembership') or securityEnabled eq true";
            break;
          case 'microsoft365':
            filter = "groupTypes/any(c:c eq 'Unified')";
            break;
          case 'distribution':
            filter = "mailEnabled eq true and securityEnabled eq false";
            break;
        }
      }

      const request = client.api('/groups')
        .top(limit)
        .select('id,displayName,description,groupTypes,mailEnabled,securityEnabled,mail');
      
      if (filter) {
        request.filter(filter);
      }

      const groups = await request.get();
      return groups.value || [];
    } catch (error) {
      console.error('Error getting organization groups:', error);
      throw error;
    }
  }

  async getUserGroups(userId: string) {
    const client = this.authService.getGraphClient();
    try {
      const groups = await client.api(`/users/${userId}/memberOf`)
        .select('id,displayName,description,groupTypes,mailEnabled,securityEnabled')
        .get();
      
      return groups.value || [];
    } catch (error) {
      console.error('Error getting user groups:', error);
      throw error;
    }
  }

  async getOrganizationInfo() {
    const client = this.authService.getGraphClient();
    try {
      const organization = await client.api('/organization')
        .select('id,displayName,verifiedDomains,businessPhones,city,country,postalCode,state,street')
        .get();
      
      return organization.value?.[0] || {};
    } catch (error) {
      console.error('Error getting organization info:', error);
      throw error;
    }
  }

  async searchSharePointContent(query: string, siteId?: string, contentType: string = 'all', limit: number = 10) {
    const client = this.authService.getGraphClient();
    try {
      let searchQuery = query;
      
      // Add content type filters
      if (contentType !== 'all') {
        switch (contentType) {
          case 'documents':
            searchQuery += ' contentclass:STS_ListItem_DocumentLibrary';
            break;
          case 'pages':
            searchQuery += ' contentclass:STS_Web OR contentclass:STS_Site';
            break;
          case 'lists':
            searchQuery += ' contentclass:STS_List';
            break;
        }
      }

      const searchRequest = {
        requests: [{
          entityTypes: ['driveItem', 'site', 'listItem'],
          query: {
            queryString: searchQuery
          },
          from: 0,
          size: limit
        }]
      };

      const searchResults = await client.api('/search/query').post(searchRequest);
      
      // Process search results
      const results = [];
      for (const response of searchResults.value || []) {
        for (const hit of response.hitsContainers?.[0]?.hits || []) {
          results.push({
            id: hit.resource.id,
            name: hit.resource.name,
            webUrl: hit.resource.webUrl,
            summary: hit.summary,
            contentType: hit.resource['@odata.type'],
            lastModified: hit.resource.lastModifiedDateTime,
            createdBy: hit.resource.createdBy?.user?.displayName
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error searching SharePoint content:', error);
      throw error;
    }
  }

  async getTeamsContent(teamId?: string, channelId?: string, query?: string, contentType: string = 'all', limit: number = 10): Promise<any[]> {
    const client = this.authService.getGraphClient();
    try {
      const results = [];

      if (teamId) {
        // Get specific team content
        if (contentType === 'messages' || contentType === 'all') {
          const channels = channelId ? [{ id: channelId }] : 
            (await client.api(`/teams/${teamId}/channels`).get()).value;

          for (const channel of channels.slice(0, 3)) { // Limit channels to avoid rate limits
            try {
              const messages = await client.api(`/teams/${teamId}/channels/${channel.id}/messages`)
                .top(Math.min(limit, 20))
                .expand('replies')
                .get();

              for (const message of messages.value || []) {
                if (!query || message.body?.content?.toLowerCase().includes(query.toLowerCase())) {
                  results.push({
                    type: 'message',
                    id: message.id,
                    content: message.body?.content,
                    from: message.from?.user?.displayName,
                    createdDateTime: message.createdDateTime,
                    teamId: teamId,
                    channelId: channel.id,
                    channelName: channel.displayName
                  });
                }
              }
            } catch (err) {
              console.error(`Error getting messages for channel ${channel.id}:`, err);
            }
          }
        }

        if (contentType === 'files' || contentType === 'all') {
          try {
            const drives = await client.api(`/groups/${teamId}/drives`).get();
            for (const drive of drives.value || []) {
              const items = await client.api(`/drives/${drive.id}/root/children`)
                .top(limit)
                .get();
              
              for (const item of items.value || []) {
                if (!query || item.name?.toLowerCase().includes(query.toLowerCase())) {
                  results.push({
                    type: 'file',
                    id: item.id,
                    name: item.name,
                    webUrl: item.webUrl,
                    size: item.size,
                    lastModified: item.lastModifiedDateTime,
                    driveId: drive.id,
                    teamId: teamId
                  });
                }
              }
            }
          } catch (err) {
            console.error(`Error getting files for team ${teamId}:`, err);
          }
        }
      } else {
        // Search across all teams
        const teams = await client.api('/me/joinedTeams').get();
        
        for (const team of (teams.value || []).slice(0, 5)) { // Limit to 5 teams
          const teamContent: any[] = await this.getTeamsContent(team.id, undefined, query, contentType, Math.ceil(limit / 5));
          results.push(...teamContent);
        }
      }

      return results.slice(0, limit);
    } catch (error) {
      console.error('Error getting Teams content:', error);
      throw error;
    }
  }
}