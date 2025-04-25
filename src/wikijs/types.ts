// WikiJSのページ情報
export interface WikiPage {
  id: string;
  path: string;
  title: string;
  description: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// 検索結果
export interface SearchResult {
  pages: WikiPage[];
  totalCount: number;
}

// ページ作成パラメータ
export interface CreatePageParams {
  path: string;
  title: string;
  content: string;
  description?: string;
}

// ページ更新パラメータ
export interface UpdatePageParams {
  id: string;
  content?: string;
  title?: string;
  description?: string;
  path?: string;
}

// GraphQL操作のレスポンス
export interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{
    message: string;
    path: string[];
  }>;
}