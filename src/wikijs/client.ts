import { GraphQLClient } from 'graphql-request';
import { config } from '../config';
import {
  WikiPage,
  SearchResult,
  CreatePageParams,
  UpdatePageParams
} from './types';
import { getSdk } from './generated/operations';

// WikiJS client class
export class WikiJSClient {
  private client: GraphQLClient;
  private sdk: ReturnType<typeof getSdk>;
  
  constructor() {
    this.client = new GraphQLClient(`${config.wikijs.url}/graphql`, {
      headers: {
        Authorization: `Bearer ${config.wikijs.token}`
      }
    });
    
    // Initialize the SDK with our client
    this.sdk = getSdk(this.client);
  }
  
  // Search pages
  async searchPages(query: string, limit: number = 10): Promise<SearchResult> {
    try {
      const response = await this.sdk.SearchPages({ query });
      
      if (response.errors) {
        throw new Error(response.errors.map(e => e.message).join(', '));
      }
      
      return {
        pages: response.data.pages?.search.results.map(page => ({
          id: parseInt(page?.id || '0', 10),
          path: page?.path || '',
          title: page?.title || '',
          description: page?.description || '',
          content: '',
          createdAt: '',
          updatedAt: ''
        })) || [],
        totalCount: response.data.pages?.search.totalHits || 0
      };
    } catch (error) {
      console.error('Error searching pages:', error);
      throw new Error('Failed to search pages');
    }
  }
  
  // Get page by ID or path
  async getPage(idOrPath: number | string): Promise<WikiPage> {
    try {
      let response;
      
      if (typeof idOrPath === 'number') {
        // Get page by ID
        response = await this.sdk.GetPageById({ id: idOrPath });
        
        if (response.errors) {
          throw new Error(response.errors.map(e => e.message).join(', '));
        }
        
        const page = response.data.pages?.single;
        
        if (!page) {
          throw new Error('Page not found');
        }
        
        return {
          id: page.id,
          path: page.path,
          title: page.title,
          description: page.description,
          content: page.content,
          createdAt: page.createdAt,
          updatedAt: page.updatedAt
        };
      } else if (typeof idOrPath === 'string') {
        // Get page by path - need locale for this API
        response = await this.sdk.GetPageByPath({ 
          path: idOrPath,
          locale: config.wikijs.defaultLocale || 'en' 
        });
        
        if (response.errors) {
          throw new Error(response.errors.map(e => e.message).join(', '));
        }
        
        const page = response.data.pages?.singleByPath;
        
        if (!page) {
          throw new Error('Page not found');
        }
        
        return {
          id: page.id,
          path: page.path,
          title: page.title,
          description: page.description,
          content: page.content,
          createdAt: page.createdAt,
          updatedAt: page.updatedAt
        };
      }
      throw new Error('Invalid ID or path');
    } catch (error) {
      console.error('Error getting page:', error);
      throw new Error('Failed to get page');
    }
  }
  
  // Create page
  async createPage(params: CreatePageParams): Promise<WikiPage> {
    try {
      const response = await this.sdk.CreatePage({
        content: params.content,
        description: params.description || '',
        path: params.path,
        title: params.title,
        // Required fields from schema
        tags: params.tags || [],
        isPublished: params.isPublished !== undefined ? params.isPublished : true,
        isPrivate: params.isPrivate !== undefined ? params.isPrivate : false,
        locale: params.locale || config.wikijs.defaultLocale || 'en',
        editor: params.editor || 'markdown'
      });
      
      if (response.errors) {
        throw new Error(response.errors.map(e => e.message).join(', '));
      }
      
      const result = response.data.pages?.create;
      
      if (!result?.responseResult.succeeded) {
        throw new Error(result?.responseResult.message || 'Failed to create page');
      }
      
      if (!result.page) {
        throw new Error('Page was created but no data was returned');
      }
      
      return {
        id: result.page.id,
        path: result.page.path,
        title: result.page.title,
        description: '',
        content: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating page:', error);
      throw new Error('Failed to create page');
    }
  }
  
  // Update page
  async updatePage(params: UpdatePageParams): Promise<WikiPage> {
    try {
      // Convert ID to numeric
      const numericId = typeof params.id === 'string' ? parseInt(params.id, 10) : params.id;
      
      const response = await this.sdk.UpdatePage({
        id: numericId,
        content: params.content,
        description: params.description,
        title: params.title,
        tags: params.tags,
        isPublished: params.isPublished,
        isPrivate: params.isPrivate
      });
      
      if (response.errors) {
        throw new Error(response.errors.map(e => e.message).join(', '));
      }
      
      const result = response.data.pages?.update;
      
      if (!result?.responseResult.succeeded) {
        throw new Error(result?.responseResult.message || 'Failed to update page');
      }
      
      if (!result.page) {
        throw new Error('Page was updated but no data was returned');
      }
      
      return {
        id: result.page.id,
        path: result.page.path,
        title: result.page.title,
        description: params.description || '',
        content: params.content || '',
        createdAt: '',
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error updating page:', error);
      throw new Error('Failed to update page');
    }
  }
  
  // Delete page
  async deletePage(id: string | number): Promise<boolean> {
    try {
      // Convert ID to numeric
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      
      const response = await this.sdk.DeletePage({ id: numericId });
      
      if (response.errors) {
        throw new Error(response.errors.map(e => e.message).join(', '));
      }
      
      const result = response.data.pages?.delete?.responseResult;
      
      if (!result?.succeeded) {
        throw new Error(result?.message || 'Failed to delete page');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting page:', error);
      throw new Error('Failed to delete page');
    }
  }
  
  // List pages
  async listPages(params: { limit?: number, tags?: string[], locale?: string } = {}): Promise<WikiPage[]> {
    try {
      const response = await this.sdk.ListPages({
        limit: params.limit,
        tags: params.tags,
        locale: params.locale || config.wikijs.defaultLocale || 'en'
      });
      
      if (response.errors) {
        throw new Error(response.errors.map(e => e.message).join(', '));
      }
      
      return (response.data.pages?.list || []).map(page => ({
        id: page.id,
        path: page.path,
        title: page.title || '',
        description: page.description || '',
        content: '',
        createdAt: '', 
        updatedAt: page.updatedAt
      }));
    } catch (error) {
      console.error('Error listing pages:', error);
      throw new Error('Failed to list pages');
    }
  }
  
  // Get all tags
  async getTags(): Promise<{ id: number, tag: string, title: string }[]> {
    try {
      const response = await this.sdk.GetTags();
      
      if (response.errors) {
        throw new Error(response.errors.map(e => e.message).join(', '));
      }
      
      return (response.data.pages?.tags || []).map(tag => ({
        id: tag?.id || 0,
        tag: tag?.tag || '',
        title: tag?.title || ''
      }));
    } catch (error) {
      console.error('Error getting tags:', error);
      throw new Error('Failed to get tags');
    }
  }
}

export default new WikiJSClient();