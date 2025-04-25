// MCPのツール定義型
export interface MCPTool {
  name: string;
  description: string;
  parameters: MCPToolParameters;
}

// MCPのパラメータ定義型
export interface MCPToolParameters {
  type: 'object';
  properties: Record<string, {
    type: string;
    description: string;
    [key: string]: any;
  }>;
  required: string[];
  additionalProperties: boolean;
}

// MCPのリソース定義型
export interface MCPResource {
  name: string;
  description: string;
  schema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      [key: string]: any;
    }>;
    required: string[];
    additionalProperties: boolean;
  };
}

// MCPリクエスト型
export interface MCPRequest {
  id: string;
  jsonrpc: string;
  method: string;
  params: any;
}

// MCPレスポンス型
export interface MCPResponse {
  id: string;
  jsonrpc: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}