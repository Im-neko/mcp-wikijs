import { GraphQLClient } from 'graphql-request';
import { config } from '../config';
import {
  WikiPage,
  SearchResult,
  CreatePageParams,
  UpdatePageParams,
  GraphQLResponse
} from './types';
import {
  SEARCH_PAGES,
  GET_PAGE,
  CREATE_PAGE,
  UPDATE_PAGE,
  DELETE_PAGE
} from './operations';

// WikiJSクライアントクラス
export class WikiJSClient {
  private client: GraphQLClient;
  
  constructor() {
    this.client = new GraphQLClient(`${config.wikijs.url}/graphql`, {
      headers: {
        Authorization: `Bearer ${config.wikijs.token}`
      }
    });
  }
  
  // ページ検索
  async searchPages(query: string, limit: number = 10): Promise<SearchResult> {
    try {
      const response: GraphQLResponse<{
        pages: {
          search: {
            results: Array<{
              id: string;
              path: string;
              title: string;
              description: string;
            }>;
            totalHits: number;
          }
        }
      }> = await this.client.request(SEARCH_PAGES, { query, limit });
      
      return {
        pages: response.data.pages.search.results.map(page => ({
          ...page,
          content: '',
          createdAt: '',
          updatedAt: ''
        })),
        totalCount: response.data.pages.search.totalHits
      };
    } catch (error) {
      console.error('Error searching pages:', error);
      throw new Error('Failed to search pages');
    }
  }
  
  // ページ取得（IDまたはパスで）
  async getPage(idOrPath: number | string): Promise<WikiPage> {
    try {
      const variables = typeof idOrPath === 'number'
        ? { id: idOrPath }
        : { path: idOrPath };
      
      const response: GraphQLResponse<{
        pages: {
          single: WikiPage
        }
      }> = await this.client.request(GET_PAGE, variables);
      
      if (!response.data.pages.single) {
        throw new Error('Page not found');
      }
      
      return response.data.pages.single;
    } catch (error) {
      console.error('Error getting page:', error);
      throw new Error('Failed to get page');
    }
  }
  
  // ページ作成
  async createPage(params: CreatePageParams): Promise<WikiPage> {
    try {
      const response: GraphQLResponse<{
        pages: {
          create: {
            responseResult: {
              succeeded: boolean;
              message: string;
            };
            page: WikiPage;
          }
        }
      }> = await this.client.request(CREATE_PAGE, params);
      
      if (!response.data.pages.create.responseResult.succeeded) {
        throw new Error(response.data.pages.create.responseResult.message);
      }
      
      return response.data.pages.create.page;
    } catch (error) {
      console.error('Error creating page:', error);
      throw new Error('Failed to create page');
    }
  }
  
  // ページ更新
  async updatePage(params: UpdatePageParams): Promise<WikiPage> {
    try {
      // IDを数値に変換
      const numericId = typeof params.id === 'string' ? parseInt(params.id, 10) : params.id;
      
      const response: GraphQLResponse<{
        pages: {
          update: {
            responseResult: {
              succeeded: boolean;
              message: string;
            };
            page: WikiPage;
          }
        }
      }> = await this.client.request(UPDATE_PAGE, { ...params, id: numericId });
      
      if (!response.data.pages.update.responseResult.succeeded) {
        throw new Error(response.data.pages.update.responseResult.message);
      }
      
      return response.data.pages.update.page;
    } catch (error) {
      console.error('Error updating page:', error);
      throw new Error('Failed to update page');
    }
  }
  
  // ページ削除
  async deletePage(id: string | number): Promise<boolean> {
    try {
      // IDを数値に変換
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      
      const response: GraphQLResponse<{
        pages: {
          delete: {
            responseResult: {
              succeeded: boolean;
              message: string;
            }
          }
        }
      }> = await this.client.request(DELETE_PAGE, { id: numericId });
      
      if (!response.data.pages.delete.responseResult.succeeded) {
        throw new Error(response.data.pages.delete.responseResult.message);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting page:', error);
      throw new Error('Failed to delete page');
    }
  }
}

export default new WikiJSClient();