import { MCPTool } from '../mcp/types';
import wikiClient from '../wikijs/client';

// 削除ツール定義
export const deleteTool: MCPTool = {
  name: 'delete',
  description: 'Delete a wiki page by ID',
  parameters: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'The ID of the page to delete'
      }
    },
    required: ['id'],
    additionalProperties: false
  }
};

// 削除ツール実装
export const deleteHandler = async (params: { id: string }) => {
  const { id } = params;
  
  try {
    const success = await wikiClient.deletePage(id);
    
    return {
      id,
      success
    };
  } catch (error) {
    console.error('Delete error:', error);
    throw new Error('Failed to delete wiki page');
  }
};