import { MCPTool } from '../mcp/types';
import wikiClient from '../wikijs/client';

// 読み取りツール定義
export const readTool: MCPTool = {
  name: 'read',
  description: 'Read a wiki page by ID or path',
  parameters: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'The ID of the page to read'
      },
      path: {
        type: 'string',
        description: 'The path of the page to read'
      }
    },
    required: [],
    additionalProperties: false
  }
};

// 読み取りツール実装
export const readHandler = async (params: { id?: string; path?: string }) => {
  const { id, path } = params;
  
  if (!id && !path) {
    throw new Error('Either id or path must be provided');
  }
  
  try {
    const idOrPath = id || path as string;
    const page = await wikiClient.getPage(idOrPath);
    
    return {
      id: page.id,
      path: page.path,
      title: page.title,
      description: page.description || '',
      content: page.content,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt
    };
  } catch (error) {
    console.error('Read error:', error);
    throw new Error('Failed to read wiki page');
  }
};