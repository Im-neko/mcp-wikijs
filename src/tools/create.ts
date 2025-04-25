import { MCPTool } from '../mcp/types';
import wikiClient from '../wikijs/client';

// 作成ツール定義
export const createTool: MCPTool = {
  name: 'create',
  description: 'Create a new wiki page',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The path for the new page (e.g., "folder/page")'
      },
      title: {
        type: 'string',
        description: 'The title of the new page'
      },
      content: {
        type: 'string',
        description: 'The content of the new page in Markdown format'
      },
      description: {
        type: 'string',
        description: 'Optional description for the page'
      }
    },
    required: ['path', 'title', 'content'],
    additionalProperties: false
  }
};

// 作成ツール実装
export const createHandler = async (params: { 
  path: string; 
  title: string; 
  content: string; 
  description?: string 
}) => {
  const { path, title, content, description = '' } = params;
  
  try {
    const newPage = await wikiClient.createPage({
      path,
      title,
      content,
      description
    });
    
    return {
      id: newPage.id,
      path: newPage.path,
      title: newPage.title,
      success: true
    };
  } catch (error) {
    console.error('Create error:', error);
    throw new Error('Failed to create wiki page');
  }
};