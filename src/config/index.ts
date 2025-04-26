import { Config, ConfigSchema } from './types';
import dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config();

// 環境変数から設定オブジェクトを作成
const createConfig = (): Config => {
  try {
    const config = ConfigSchema.parse({
      wikijs: {
        url: process.env.WIKIJS_URL,
        token: process.env.WIKIJS_TOKEN
      },
      mcp: {
        port: process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : undefined,
        host: process.env.MCP_HOST,
        transport: process.env.MCP_TRANSPORT as 'http' | 'stdio' | undefined
      },
      logging: {
        level: process.env.LOG_LEVEL
      }
    });
    
    return config;
  } catch (error) {
    console.error('Configuration error:', error);
    process.exit(1);
  }
};

// 設定オブジェクトをエクスポート
export const config = createConfig();

export default config;