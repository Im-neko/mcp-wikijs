# MCP WikiJS プロジェクト アーキテクチャ

## 概要

MCP WikiJSは、Model Context Protocol (MCP)を使用してWikiJSのAPIにアクセスするサーバーを提供します。これにより、AI言語モデルがWikiJSのコンテンツを検索、取得、更新できるようになります。

## コアコンポーネント

```
mcp-wikijs/
├── src/
│   ├── index.ts              # エントリーポイント
│   ├── server.ts             # MCPサーバー実装
│   ├── config.ts             # 設定管理
│   ├── wikijs/
│   │   ├── client.ts         # WikiJS GraphQLクライアント
│   │   ├── types.ts          # WikiJS関連の型定義
│   │   └── operations.ts     # WikiJS API操作
│   ├── tools/
│   │   ├── search.ts         # 検索ツール
│   │   ├── document.ts       # ドキュメント操作ツール
│   │   └── utils.ts          # ユーティリティ関数
│   ├── resources/
│   │   └── document.ts       # ドキュメントリソース
│   └── errors.ts             # エラー処理
├── docker/
│   └── docker-compose.yml    # 開発用WikiJSインスタンス
├── package.json
└── tsconfig.json
```

## データフロー

1. ユーザー/AIがMCPサーバーにクエリを送信
2. MCPサーバーがクエリを処理
3. WikiJS GraphQLクライアントが対応するWikiJS APIを呼び出し
4. 結果がMCPレスポンス形式に変換され返却

## 主要なツールとリソース

### ツール
- `search-documents` - キーワードによるドキュメント検索
- `get-document` - ID/パスでのドキュメント取得
- `update-document` - ドキュメントの更新・作成
- `delete-document` - ドキュメントの削除

### リソース
- `document` - ドキュメントコンテンツとメタデータにアクセス

## 環境設定

- `WIKIJS_API_ENDPOINT` - WikiJSのGraphQLエンドポイント
- `WIKIJS_ACCESS_TOKEN` - WikiJSのアクセストークン
- `LOG_LEVEL` - ログレベル設定

## デプロイメント

- NPMパッケージとして公開
- `npx @im-neko/mcp-wikijs`コマンドで実行可能
- Claude AIの設定ファイルに追加可能

## 技術スタック

- TypeScript
- MCP TypeScript SDK
- GraphQL (WikiJS API)
- Docker (開発環境)
- Jest (テスト)