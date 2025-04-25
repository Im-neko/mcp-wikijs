import { searchTool, searchHandler } from './search';
import { readTool, readHandler } from './read';
import { createTool, createHandler } from './create';
import { updateTool, updateHandler } from './update';
import { deleteTool, deleteHandler } from './delete';

// ツール定義をエクスポート
export const tools = [
  searchTool,
  readTool,
  createTool,
  updateTool,
  deleteTool
];

// ツール実装をマップとしてエクスポート
export const handlers = {
  [searchTool.name]: searchHandler,
  [readTool.name]: readHandler,
  [createTool.name]: createHandler,
  [updateTool.name]: updateHandler,
  [deleteTool.name]: deleteHandler
};

export default {
  tools,
  handlers
};