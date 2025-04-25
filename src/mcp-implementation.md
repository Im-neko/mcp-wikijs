# MCP WikiJS の実装

## MCPについて
Model Context Protocol (MCP)は、AI言語モデルとサーバー間のコミュニケーションを標準化するプロトコルです。以下の主要コンポーネントがあります：

1. **リソース** - データや情報を提供
2. **ツール** - アクションを実行するためのインターフェース
3. **プロンプト** - 再利用可能な対話テンプレート
4. **ルート** - 操作の境界を定義
5. **サンプリング** - LLM完了をリクエスト

## TypeScript SDKでの実装

MCP WikiJS実装には[typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk)を使用します。

### 基本構造
```typescript
// サーバー初期化
const server = new McpServer({
  name: "mcp-wikijs",
  version: "1.0.0"
});

// WikiJSとの接続設定
const wikiJsConfig = {
  endpoint: process.env.WIKIJS_API_ENDPOINT,
  token: process.env.WIKIJS_ACCESS_TOKEN
};

// ツールの定義
server.tool("search-documents", 
  { query: z.string() },
  async ({ query }) => {
    // WikiJS GraphQL APIを使用して検索
    return { content: [{ type: "text", text: "検索結果" }] };
  }
);

// リソースの定義
server.resource("document", 
  { id: z.string() },
  async ({ id }) => {
    // WikiJSからドキュメントを取得
    return { content: [{ type: "text", text: "ドキュメント内容" }] };
  }
);

// トランスポートの接続
const transport = new StdioServerTransport();
await server.connect(transport);
```

## 必要なツール実装

1. **文書検索ツール** - WikiJSドキュメントの検索
2. **文書取得ツール** - 特定IDのドキュメント取得
3. **文書更新ツール** - ドキュメントの作成・更新
4. **文書削除ツール** - ドキュメントの削除

## 実装手順

1. WikiJS GraphQL API用のクライアントモジュール作成
2. MCPサーバーの初期化と設定
3. WikiJS操作用のツール実装
4. エラーハンドリングの実装
5. 認証と環境変数管理

## 環境変数

```
WIKIJS_API_ENDPOINT - WikiJSのGraphQLエンドポイント
WIKIJS_ACCESS_TOKEN - WikiJSのアクセストークン
```

## パッケージング

- npx経由で実行可能なコマンドラインアプリケーションとして提供
- Docker環境でも動作可能に設定