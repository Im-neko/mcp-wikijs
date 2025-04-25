import { MCPTool } from '../mcp/types';
import wikiClient from '../wikijs/client';

// 更新ツール定義
export const updateTool: MCPTool = {
  name: 'update',
  description: 'Update an existing wiki page',
  parameters: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'The ID of the page to update'
      },
      title: {
        type: 'string',
        description: 'The new title for the page'
      },
      content: {
        type: 'string',
        description: 'The new content for the page in Markdown format'
      },
      description: {
        type: 'string',
        description: 'The new description for the page'
      },
      path: {
        type: 'string',
        description: 'The new path for the page'
      }
    },
    required: ['id'],
    additionalProperties: false
  }
};

// 更新ツール実装
export const updateHandler = async (params: { 
  id: string; 
  title?: string; 
  content?: string; 
  description?: string;
  path?: string;
}) => {
  const { id, title, content, description, path } = params;
  
  // 少なくとも1つの更新項目があることを確認
  if (!title && !content && !description && !path) {
    throw new Error('At least one of title, content, description, or path must be provided');
  }
  
  try {
    const updatedPage = await wikiClient.updatePage({
      id,
      title,
      content,
      description,
      path
    });
    
    return {
      id: updatedPage.id,
      path: updatedPage.path,
      title: updatedPage.title,
      success: true
    };
  } catch (error) {
    console.error('Update error:', error);
    throw new Error('Failed to update wiki page');
  }
};