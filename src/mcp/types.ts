// MCP tool definition type
export interface MCPTool {
  name: string;
  description: string;
  parameters: MCPToolParameters;
}

// MCP parameter definition type
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

// MCP resource definition type
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

// MCP request type
export interface MCPRequest {
  id: string;
  jsonrpc: string;
  method: string;
  params: any;
}

// MCP response type
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