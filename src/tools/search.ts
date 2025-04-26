import { MCPTool } from '../mcp/types';
import wikiClient from '../wikijs/client';

// 検索ツール定義
export const searchTool: MCPTool = {
  name: 'search',
  description: 'Search for wiki pages by query',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default: 10)'
      }
    },
    required: ['query'],
    additionalProperties: false
  }
};

// 検索ツール実装
export const searchHandler = async (params: { query: string }) => {
  const { query } = params;
  
  try {
    const results = await wikiClient.searchPages(query);
    return {
      results: results.pages.map(page => ({
        id: page.id,
        path: page.path,
        title: page.title,
        description: page.description || ''
      })),
      totalCount: results.totalCount
    };
  } catch (error) {
    console.error('Search error:', error);
    throw new Error('Failed to search wiki pages');
  }
};