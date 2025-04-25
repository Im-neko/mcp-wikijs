import http from 'http';
import { config } from '../config';
import { MCPRequest, MCPResponse } from './types';
import { tools, handlers } from '../tools';

// 簡易MCPサーバー実装
export class MCPServer {
  private server: http.Server;
  
  constructor() {
    this.server = http.createServer(this.handleRequest.bind(this));
  }
  
  // サーバー起動
  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(config.mcp.port, config.mcp.host, () => {
        console.log(`MCP server listening on ${config.mcp.host}:${config.mcp.port}`);
        resolve();
      });
    });
  }
  
  // サーバー停止
  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('MCP server stopped');
          resolve();
        }
      });
    });
  }
  
  // リクエスト処理
  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    // CORSヘッダー
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // OPTIONSリクエスト対応
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }
    
    // POSTリクエスト以外は拒否
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }
    
    try {
      // リクエストボディ取得
      const body = await this.readRequestBody(req);
      const mcpRequest = JSON.parse(body) as MCPRequest;
      
      // リクエスト処理
      const mcpResponse = await this.processRequest(mcpRequest);
      
      // レスポンス返送
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify(mcpResponse));
    } catch (error) {
      // エラー処理
      console.error('Request handling error:', error);
      res.statusCode = 400;
      res.end(JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32700,
          message: 'Parse error'
        },
        id: null
      }));
    }
  }
  
  // リクエストボディ読み取り
  private readRequestBody(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      req.on('data', (chunk) => {
        chunks.push(Buffer.from(chunk));
      });
      
      req.on('end', () => {
        resolve(Buffer.concat(chunks).toString());
      });
      
      req.on('error', (err) => {
        reject(err);
      });
    });
  }
  
  // リクエスト処理
  private async processRequest(request: MCPRequest): Promise<MCPResponse> {
    const { id, method, params } = request;
    
    // MCP初期化リクエスト
    if (method === 'mcp.init') {
      return {
        id,
        jsonrpc: '2.0',
        result: {
          tools: tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
          }))
        }
      };
    }
    
    // ツール呼び出しリクエスト
    const toolName = method.replace('tool.', '');
    const handler = handlers[toolName];
    
    if (!handler) {
      return {
        id,
        jsonrpc: '2.0',
        error: {
          code: -32601,
          message: `Method not found: ${method}`
        }
      };
    }
    
    try {
      const result = await handler(params);
      
      return {
        id,
        jsonrpc: '2.0',
        result
      };
    } catch (error) {
      console.error(`Error executing tool ${toolName}:`, error);
      
      return {
        id,
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}

export default new MCPServer();