import { ServiceBase } from './base/ServiceBase';
import { ActionConfig, ReactionConfig, ServiceAuthData } from '../types/area';
import {
  NotionAuthData,
  NotionDatabase,
  NotionDatabaseItem,
  NotionPage,
  NotionDatabaseQueryResponse,
  CreateDatabaseItemParams,
  UpdateDatabaseItemParams,
  CreatePageParams,
} from '../types/notion';
import { getNotionHeaders, NOTION_API_VERSION } from '../config/notion';
import axios, { AxiosInstance } from 'axios';

export class NotionService extends ServiceBase {
  private clients: Map<string, AxiosInstance> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private lastCheckedTimestamps: Map<string, Date> = new Map();

  constructor() {
    super({
      name: 'notion',
      displayName: 'Notion',
      description: 'Integrate with Notion to manage databases and pages',
      authType: 'oauth2',
      baseUrl: 'https://api.notion.com/v1',
      scopes: [],
    });
  }

  // Initialize service
  async initialize(): Promise<void> {
    console.log('NotionService initialized');
  }

  // Cleanup resources
  async destroy(): Promise<void> {
    // Clear all polling intervals
    this.pollingIntervals.forEach((interval) => clearInterval(interval));
    this.pollingIntervals.clear();
    this.clients.clear();
    console.log('NotionService destroyed');
  }

  // Define 4 Actions (Triggers)
  getActions(): ActionConfig[] {
    return [
      {
        name: 'database_item_created',
        displayName: 'New Database Item Created',
        description: 'Triggers when a new item is added to a Notion database',
        parameters: [
          {
            name: 'databaseId',
            type: 'string',
            required: true,
            description: 'The ID of the Notion database to monitor',
            placeholder: 'abc123def456...',
          },
        ],
      },
      {
        name: 'database_item_updated',
        displayName: 'Database Item Updated',
        description: 'Triggers when an item in a Notion database is updated',
        parameters: [
          {
            name: 'databaseId',
            type: 'string',
            required: true,
            description: 'The ID of the Notion database to monitor',
            placeholder: 'abc123def456...',
          },
        ],
      },
      {
        name: 'page_created',
        displayName: 'New Page Created',
        description: 'Triggers when a new page is created in Notion',
        parameters: [
          {
            name: 'parentPageId',
            type: 'string',
            required: false,
            description: 'Optional: Monitor pages created under a specific parent page',
            placeholder: 'Leave empty to monitor all pages',
          },
        ],
      },
      {
        name: 'database_property_changed',
        displayName: 'Database Property Changed',
        description: 'Triggers when a specific property of a database item changes',
        parameters: [
          {
            name: 'databaseId',
            type: 'string',
            required: true,
            description: 'The ID of the Notion database to monitor',
            placeholder: 'abc123def456...',
          },
          {
            name: 'propertyName',
            type: 'string',
            required: true,
            description: 'The name of the property to monitor',
            placeholder: 'Status',
          },
        ],
      },
    ];
  }

  // Define 3 Reactions
  getReactions(): ReactionConfig[] {
    return [
      {
        name: 'create_database_item',
        displayName: 'Create Database Item',
        description: 'Create a new item in a Notion database',
        parameters: [
          {
            name: 'databaseId',
            type: 'string',
            required: true,
            description: 'The ID of the database where the item will be created',
            placeholder: 'abc123def456...',
          },
          {
            name: 'title',
            type: 'string',
            required: true,
            description: 'The title of the new item',
            placeholder: 'New Task',
          },
          {
            name: 'properties',
            type: 'string',
            required: false,
            description: 'Additional properties as JSON (e.g., {"Status": "In Progress"})',
            placeholder: '{"Status": "To Do"}',
          },
        ],
      },
      {
        name: 'update_database_item',
        displayName: 'Update Database Item',
        description: 'Update an existing item in a Notion database',
        parameters: [
          {
            name: 'pageId',
            type: 'string',
            required: true,
            description: 'The ID of the page/item to update',
            placeholder: 'Use {{pageId}} from trigger data',
          },
          {
            name: 'properties',
            type: 'string',
            required: true,
            description: 'Properties to update as JSON (e.g., {"Status": "Done"})',
            placeholder: '{"Status": "Completed"}',
          },
        ],
      },
      {
        name: 'create_page',
        displayName: 'Create Page',
        description: 'Create a new page in Notion',
        parameters: [
          {
            name: 'parentPageId',
            type: 'string',
            required: false,
            description: 'Optional: ID of the parent page',
            placeholder: 'Leave empty for root level',
          },
          {
            name: 'title',
            type: 'string',
            required: true,
            description: 'The title of the new page',
            placeholder: 'Meeting Notes',
          },
          {
            name: 'content',
            type: 'string',
            required: false,
            description: 'The content of the page',
            placeholder: 'Page content here...',
          },
        ],
      },
    ];
  }

  // Authentication
  async authenticate(userId: string, authData: NotionAuthData): Promise<boolean> {
    try {
      const client = axios.create({
        baseURL: this.config.baseUrl,
        headers: getNotionHeaders(authData.access_token),
      });

      // Test the authentication by fetching user info
      await client.post('/search', {
        filter: { property: 'object', value: 'database' },
        page_size: 1,
      });

      // Store auth data
      const serviceAuthData: ServiceAuthData = {
        userId,
        serviceId: 'notion',
        accessToken: authData.access_token,
        metadata: {
          bot_id: authData.bot_id,
          workspace_id: authData.workspace_id,
          workspace_name: authData.workspace_name,
        },
      };

      this.setAuthData(userId, serviceAuthData);
      this.clients.set(userId, client);

      console.log(`Notion authenticated for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Notion authentication failed:', error);
      return false;
    }
  }

  async isAuthenticated(userId: string): Promise<boolean> {
    return this.clients.has(userId);
  }

  async refreshAuth(userId: string): Promise<boolean> {
    // Notion tokens don't expire, so we just check if we have the client
    return this.isAuthenticated(userId);
  }

  // Start listening for actions
  async startListening(
    userId: string,
    actionId: string,
    parameters: Record<string, any>
  ): Promise<void> {
    const key = `${userId}:${actionId}:${JSON.stringify(parameters)}`;

    // Don't start if already listening
    if (this.pollingIntervals.has(key)) {
      return;
    }

    // Set initial timestamp
    this.lastCheckedTimestamps.set(key, new Date());

    // Poll every 60 seconds
    const interval = setInterval(async () => {
      try {
        await this.checkForTrigger(userId, actionId, parameters, key);
      } catch (error) {
        console.error(`Error checking trigger for ${key}:`, error);
      }
    }, 60000);

    this.pollingIntervals.set(key, interval);
    console.log(`Started listening for ${actionId} with key ${key}`);
  }

  // Stop listening for actions
  async stopListening(userId: string, actionId: string): Promise<void> {
    // Find and clear all intervals matching this user and action
    const keysToRemove: string[] = [];

    this.pollingIntervals.forEach((interval, key) => {
      if (key.startsWith(`${userId}:${actionId}:`)) {
        clearInterval(interval);
        keysToRemove.push(key);
      }
    });

    keysToRemove.forEach((key) => {
      this.pollingIntervals.delete(key);
      this.lastCheckedTimestamps.delete(key);
    });

    console.log(`Stopped listening for ${actionId} for user ${userId}`);
  }

  // Check for action triggers
  private async checkForTrigger(
    userId: string,
    actionId: string,
    parameters: Record<string, any>,
    key: string
  ): Promise<void> {
    const client = this.clients.get(userId);
    if (!client) {
      console.error(`No client found for user ${userId}`);
      return;
    }

    const lastChecked = this.lastCheckedTimestamps.get(key) || new Date();

    switch (actionId) {
      case 'database_item_created':
        await this.checkDatabaseItemCreated(userId, parameters.databaseId, lastChecked);
        break;

      case 'database_item_updated':
        await this.checkDatabaseItemUpdated(userId, parameters.databaseId, lastChecked);
        break;

      case 'page_created':
        await this.checkPageCreated(userId, parameters.parentPageId, lastChecked);
        break;

      case 'database_property_changed':
        await this.checkDatabasePropertyChanged(
          userId,
          parameters.databaseId,
          parameters.propertyName,
          lastChecked
        );
        break;
    }

    this.lastCheckedTimestamps.set(key, new Date());
  }

  // Check for new database items
  private async checkDatabaseItemCreated(
    userId: string,
    databaseId: string,
    lastChecked: Date
  ): Promise<void> {
    const client = this.clients.get(userId);
    if (!client) return;

    try {
      const response = await client.post<NotionDatabaseQueryResponse>(
        `/databases/${databaseId}/query`,
        {
          filter: {
            timestamp: 'created_time',
            created_time: {
              after: lastChecked.toISOString(),
            },
          },
          sorts: [{ timestamp: 'created_time', direction: 'descending' }],
        }
      );

      response.data.results.forEach((item) => {
        this.emitActionTrigger({
          serviceId: 'notion',
          actionId: 'database_item_created',
          userId,
          data: {
            pageId: item.id,
            databaseId,
            properties: item.properties,
            url: item.url,
            createdTime: item.created_time,
          },
          timestamp: new Date(),
        });
      });
    } catch (error) {
      console.error('Error checking database item created:', error);
    }
  }

  // Check for updated database items
  private async checkDatabaseItemUpdated(
    userId: string,
    databaseId: string,
    lastChecked: Date
  ): Promise<void> {
    const client = this.clients.get(userId);
    if (!client) return;

    try {
      const response = await client.post<NotionDatabaseQueryResponse>(
        `/databases/${databaseId}/query`,
        {
          filter: {
            timestamp: 'last_edited_time',
            last_edited_time: {
              after: lastChecked.toISOString(),
            },
          },
          sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
        }
      );

      response.data.results.forEach((item) => {
        this.emitActionTrigger({
          serviceId: 'notion',
          actionId: 'database_item_updated',
          userId,
          data: {
            pageId: item.id,
            databaseId,
            properties: item.properties,
            url: item.url,
            lastEditedTime: item.last_edited_time,
          },
          timestamp: new Date(),
        });
      });
    } catch (error) {
      console.error('Error checking database item updated:', error);
    }
  }

  // Check for new pages created
  private async checkPageCreated(
    userId: string,
    parentPageId: string | undefined,
    lastChecked: Date
  ): Promise<void> {
    const client = this.clients.get(userId);
    if (!client) return;

    try {
      const searchFilter: any = {
        filter: {
          value: 'page',
          property: 'object',
        },
        sort: {
          direction: 'descending',
          timestamp: 'last_edited_time',
        },
      };

      const response = await client.post('/search', searchFilter);

      const pages = response.data.results.filter((page: NotionPage) => {
        const createdTime = new Date(page.created_time);
        const matchesTime = createdTime > lastChecked;
        const matchesParent = !parentPageId || page.parent.page_id === parentPageId;
        return matchesTime && matchesParent;
      });

      pages.forEach((page: NotionPage) => {
        this.emitActionTrigger({
          serviceId: 'notion',
          actionId: 'page_created',
          userId,
          data: {
            pageId: page.id,
            parentPageId: page.parent.page_id,
            url: page.url,
            createdTime: page.created_time,
            properties: page.properties,
          },
          timestamp: new Date(),
        });
      });
    } catch (error) {
      console.error('Error checking page created:', error);
    }
  }

  // Check for property changes
  private async checkDatabasePropertyChanged(
    userId: string,
    databaseId: string,
    propertyName: string,
    lastChecked: Date
  ): Promise<void> {
    const client = this.clients.get(userId);
    if (!client) return;

    try {
      const response = await client.post<NotionDatabaseQueryResponse>(
        `/databases/${databaseId}/query`,
        {
          filter: {
            timestamp: 'last_edited_time',
            last_edited_time: {
              after: lastChecked.toISOString(),
            },
          },
          sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
        }
      );

      response.data.results.forEach((item) => {
        if (item.properties[propertyName]) {
          this.emitActionTrigger({
            serviceId: 'notion',
            actionId: 'database_property_changed',
            userId,
            data: {
              pageId: item.id,
              databaseId,
              propertyName,
              propertyValue: item.properties[propertyName],
              properties: item.properties,
              url: item.url,
              lastEditedTime: item.last_edited_time,
            },
            timestamp: new Date(),
          });
        }
      });
    } catch (error) {
      console.error('Error checking database property changed:', error);
    }
  }

  // Execute reactions
  async executeReaction(
    reactionId: string,
    userId: string,
    parameters: Record<string, any>,
    triggerData: Record<string, any>
  ): Promise<boolean> {
    const client = this.clients.get(userId);
    if (!client) {
      console.error(`No client found for user ${userId}`);
      return false;
    }

    try {
      switch (reactionId) {
        case 'create_database_item':
          return await this.createDatabaseItem(client, parameters, triggerData);

        case 'update_database_item':
          return await this.updateDatabaseItem(client, parameters, triggerData);

        case 'create_page':
          return await this.createPage(client, parameters, triggerData);

        default:
          console.error(`Unknown reaction: ${reactionId}`);
          return false;
      }
    } catch (error) {
      console.error(`Error executing reaction ${reactionId}:`, error);
      return false;
    }
  }

  // Create a new database item
  private async createDatabaseItem(
    client: AxiosInstance,
    parameters: Record<string, any>,
    triggerData: Record<string, any>
  ): Promise<boolean> {
    try {
      // Replace template variables in parameters
      const title = this.replaceVariables(parameters.title, triggerData);
      const databaseId = this.replaceVariables(parameters.databaseId, triggerData);

      // Parse additional properties if provided
      let additionalProperties = {};
      if (parameters.properties) {
        try {
          additionalProperties =
            typeof parameters.properties === 'string'
              ? JSON.parse(parameters.properties)
              : parameters.properties;
        } catch (error) {
          console.error('Error parsing properties JSON:', error);
        }
      }

      // Build properties object
      const properties: Record<string, any> = {
        title: {
          title: [{ text: { content: title } }],
        },
      };

      // Add additional properties
      Object.entries(additionalProperties).forEach(([key, value]) => {
        properties[key] = this.formatPropertyValue(value);
      });

      await client.post('/pages', {
        parent: { database_id: databaseId },
        properties,
      });

      console.log('Database item created successfully');
      return true;
    } catch (error) {
      console.error('Error creating database item:', error);
      return false;
    }
  }

  // Update a database item
  private async updateDatabaseItem(
    client: AxiosInstance,
    parameters: Record<string, any>,
    triggerData: Record<string, any>
  ): Promise<boolean> {
    try {
      const pageId = this.replaceVariables(parameters.pageId, triggerData);

      // Parse properties to update
      let propertiesToUpdate = {};
      if (parameters.properties) {
        try {
          propertiesToUpdate =
            typeof parameters.properties === 'string'
              ? JSON.parse(parameters.properties)
              : parameters.properties;
        } catch (error) {
          console.error('Error parsing properties JSON:', error);
          return false;
        }
      }

      // Format properties
      const properties: Record<string, any> = {};
      Object.entries(propertiesToUpdate).forEach(([key, value]) => {
        properties[key] = this.formatPropertyValue(value);
      });

      await client.patch(`/pages/${pageId}`, { properties });

      console.log('Database item updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating database item:', error);
      return false;
    }
  }

  // Create a new page
  private async createPage(
    client: AxiosInstance,
    parameters: Record<string, any>,
    triggerData: Record<string, any>
  ): Promise<boolean> {
    try {
      const title = this.replaceVariables(parameters.title, triggerData);
      const content = parameters.content
        ? this.replaceVariables(parameters.content, triggerData)
        : '';

      const parent: any = parameters.parentPageId
        ? { page_id: this.replaceVariables(parameters.parentPageId, triggerData) }
        : { type: 'workspace', workspace: true };

      const pageData: any = {
        parent,
        properties: {
          title: {
            title: [{ text: { content: title } }],
          },
        },
      };

      // Add content as children blocks if provided
      if (content) {
        pageData.children = [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ text: { content } }],
            },
          },
        ];
      }

      await client.post('/pages', pageData);

      console.log('Page created successfully');
      return true;
    } catch (error) {
      console.error('Error creating page:', error);
      return false;
    }
  }

  // Helper: Replace template variables
  private replaceVariables(template: string, data: Record<string, any>): string {
    if (!template) return '';

    let result = template;
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    });
    return result;
  }

  // Helper: Format property values for Notion API
  private formatPropertyValue(value: any): any {
    if (typeof value === 'string') {
      return { rich_text: [{ text: { content: value } }] };
    } else if (typeof value === 'number') {
      return { number: value };
    } else if (typeof value === 'boolean') {
      return { checkbox: value };
    } else if (Array.isArray(value)) {
      return { multi_select: value.map((v) => ({ name: v })) };
    } else {
      return { rich_text: [{ text: { content: String(value) } }] };
    }
  }
}
