import { GraphQLClient } from 'graphql-request';
import { config } from '../config';
import {
  WikiPage,
  WikiPageDetail,
  WikiPageListItem,
  WikiPageTreeItem,
  WikiTag,
  SearchResult,
  CreatePageParams,
  UpdatePageParams
} from './types';
import { getSdk, PageOrderBy, PageOrderByDirection, PageTreeMode } from './generated/operations';
import { logger, toErrorMessage, formatGraphQLErrors } from '../logging/logger';

interface PageDetailFields {
  id: number;
  path: string;
  title: string;
  description: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  isPrivate: boolean;
  tags: Array<{ tag: string } | null>;
}

function toWikiPageDetail(page: PageDetailFields): WikiPageDetail {
  return {
    id: page.id,
    path: page.path,
    title: page.title,
    description: page.description,
    content: page.content,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
    isPublished: page.isPublished,
    isPrivate: page.isPrivate,
    tags: (page.tags || []).filter((tag): tag is { tag: string } => !!tag).map(tag => tag.tag)
  };
}

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
  // Note: WikiJS's search API has no limit parameter; results are not paginated here.
  async searchPages(query: string): Promise<SearchResult> {
    try {
      const response = await this.sdk.SearchPages({ query });
      
      if (response.errors) {
        throw new Error(formatGraphQLErrors(response.errors));
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
      logger.error('Error searching pages', error);
      throw new Error(toErrorMessage(error, 'Failed to search pages'));
    }
  }
  
  // Get page by ID or path
  async getPage(idOrPath: number | string): Promise<WikiPageDetail> {
    try {
      let response;
      
      if (typeof idOrPath === 'number') {
        // Get page by ID
        response = await this.sdk.GetPageById({ id: idOrPath });
        
        if (response.errors) {
          throw new Error(formatGraphQLErrors(response.errors));
        }
        
        const page = response.data.pages?.single;
        
        if (!page) {
          throw new Error('Page not found');
        }
        
        return toWikiPageDetail(page);
      } else if (typeof idOrPath === 'string') {
        // Get page by path - need locale for this API
        response = await this.sdk.GetPageByPath({ 
          path: idOrPath,
          locale: config.wikijs.defaultLocale || 'en' 
        });
        
        if (response.errors) {
          throw new Error(formatGraphQLErrors(response.errors));
        }
        
        const page = response.data.pages?.singleByPath;
        
        if (!page) {
          throw new Error('Page not found');
        }
        
        return toWikiPageDetail(page);
      }
      throw new Error('Invalid ID or path');
    } catch (error) {
      logger.error('Error getting page', error);
      throw new Error(toErrorMessage(error, 'Failed to get page'));
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
        throw new Error(formatGraphQLErrors(response.errors));
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
      logger.error('Error creating page', error);
      throw new Error(toErrorMessage(error, 'Failed to create page'));
    }
  }
  
  // Update page.
  // WikiJS's pages.update overwrites isPublished (false unless true), the publish dates and the
  // scripts, requires non-empty content, and throws on undefined tags. Omitted fields are therefore
  // filled from the page's current state so a partial update never unpublishes or strips a page.
  async updatePage(params: UpdatePageParams): Promise<WikiPageDetail> {
    try {
      // Convert ID to numeric
      const numericId = typeof params.id === 'string' ? parseInt(params.id, 10) : params.id;

      const currentResponse = await this.sdk.GetPageById({ id: numericId });

      if (currentResponse.errors) {
        throw new Error(formatGraphQLErrors(currentResponse.errors));
      }

      const currentPage = currentResponse.data.pages?.single;

      if (!currentPage) {
        throw new Error('Page not found');
      }

      const current = toWikiPageDetail(currentPage);
      const merged = {
        content: params.content ?? current.content,
        description: params.description ?? current.description,
        title: params.title ?? current.title,
        tags: params.tags ?? current.tags,
        isPublished: params.isPublished ?? current.isPublished,
        isPrivate: params.isPrivate ?? current.isPrivate
      };

      const response = await this.sdk.UpdatePage({
        id: numericId,
        ...merged,
        // WikiJS treats an empty value as "no date" / "no script", so only forward non-empty ones.
        publishStartDate: currentPage.publishStartDate || undefined,
        publishEndDate: currentPage.publishEndDate || undefined,
        scriptCss: currentPage.scriptCss || undefined,
        scriptJs: currentPage.scriptJs || undefined
      });

      if (response.errors) {
        throw new Error(formatGraphQLErrors(response.errors));
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
        description: merged.description,
        content: merged.content,
        createdAt: current.createdAt,
        updatedAt: result.page.updatedAt,
        isPublished: result.page.isPublished,
        isPrivate: merged.isPrivate,
        tags: merged.tags
      };
    } catch (error) {
      logger.error('Error updating page', error);
      throw new Error(toErrorMessage(error, 'Failed to update page'));
    }
  }

  // Publish or unpublish a page. Goes through pages.update so the page is re-rendered,
  // re-indexed and versioned like any other content update.
  async setPublished(id: string | number, published: boolean): Promise<WikiPageDetail> {
    return this.updatePage({ id, isPublished: published });
  }

  // Delete page
  async deletePage(id: string | number): Promise<boolean> {
    try {
      // Convert ID to numeric
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      
      const response = await this.sdk.DeletePage({ id: numericId });
      
      if (response.errors) {
        throw new Error(formatGraphQLErrors(response.errors));
      }
      
      const result = response.data.pages?.delete?.responseResult;
      
      if (!result?.succeeded) {
        throw new Error(result?.message || 'Failed to delete page');
      }
      
      return true;
    } catch (error) {
      logger.error('Error deleting page', error);
      throw new Error(toErrorMessage(error, 'Failed to delete page'));
    }
  }
  
  // Move (rename/relocate) a page
  async movePage(id: string | number, destinationPath: string, destinationLocale?: string): Promise<boolean> {
    try {
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;

      const response = await this.sdk.MovePage({
        id: numericId,
        destinationPath,
        destinationLocale: destinationLocale || config.wikijs.defaultLocale || 'en'
      });

      if (response.errors) {
        throw new Error(formatGraphQLErrors(response.errors));
      }

      const result = response.data.pages?.move?.responseResult;

      if (!result?.succeeded) {
        throw new Error(result?.message || 'Failed to move page');
      }

      return true;
    } catch (error) {
      logger.error('Error moving page', error);
      throw new Error(toErrorMessage(error, 'Failed to move page'));
    }
  }

  // List pages
  async listPages(params: {
    limit?: number,
    tags?: string[],
    locale?: string,
    orderBy?: PageOrderBy,
    orderByDirection?: PageOrderByDirection
  } = {}): Promise<WikiPageListItem[]> {
    try {
      const response = await this.sdk.ListPages({
        limit: params.limit,
        tags: params.tags,
        locale: params.locale || config.wikijs.defaultLocale || 'en',
        orderBy: params.orderBy,
        orderByDirection: params.orderByDirection
      });

      if (response.errors) {
        throw new Error(formatGraphQLErrors(response.errors));
      }

      return (response.data.pages?.list || []).map(page => ({
        id: page.id,
        path: page.path,
        title: page.title || '',
        description: page.description || '',
        contentType: page.contentType,
        isPublished: page.isPublished,
        isPrivate: page.isPrivate,
        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
        tags: (page.tags || []).filter((tag): tag is string => !!tag)
      }));
    } catch (error) {
      logger.error('Error listing pages', error);
      throw new Error(toErrorMessage(error, 'Failed to list pages'));
    }
  }

  // Get all tags
  async getTags(): Promise<WikiTag[]> {
    try {
      const response = await this.sdk.GetTags();
      
      if (response.errors) {
        throw new Error(formatGraphQLErrors(response.errors));
      }
      
      return (response.data.pages?.tags || []).map(tag => ({
        id: tag?.id || 0,
        tag: tag?.tag || '',
        title: tag?.title || ''
      }));
    } catch (error) {
      logger.error('Error getting tags', error);
      throw new Error(toErrorMessage(error, 'Failed to get tags'));
    }
  }

  // Get the page/folder tree for browsing the wiki's hierarchy
  async getPageTree(params: {
    path?: string,
    parent?: number,
    mode?: PageTreeMode,
    locale?: string,
    includeAncestors?: boolean
  } = {}): Promise<WikiPageTreeItem[]> {
    try {
      const response = await this.sdk.GetPageTree({
        path: params.path,
        parent: params.parent,
        mode: params.mode || PageTreeMode.All,
        locale: params.locale || config.wikijs.defaultLocale || 'en',
        includeAncestors: params.includeAncestors
      });

      if (response.errors) {
        throw new Error(formatGraphQLErrors(response.errors));
      }

      return (response.data.pages?.tree || []).filter((item): item is NonNullable<typeof item> => !!item).map(item => ({
        id: item.id,
        path: item.path,
        depth: item.depth,
        title: item.title,
        isPrivate: item.isPrivate,
        isFolder: item.isFolder,
        parent: item.parent ?? null,
        pageId: item.pageId ?? null,
        locale: item.locale
      }));
    } catch (error) {
      logger.error('Error getting page tree', error);
      throw new Error(toErrorMessage(error, 'Failed to get page tree'));
    }
  }
}

export default new WikiJSClient();