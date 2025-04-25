import { gql } from 'graphql-request';

// ページ検索クエリ
export const SEARCH_PAGES = gql`
  query SearchPages($query: String!, $limit: Int) {
    pages {
      search(query: $query, limit: $limit) {
        results {
          id
          path
          title
          description
        }
        totalHits
      }
    }
  }
`;

// ページ取得クエリ
export const GET_PAGE = gql`
  query GetPage($id: Int, $path: String) {
    pages {
      single(id: $id, path: $path) {
        id
        path
        title
        description
        content
        createdAt
        updatedAt
      }
    }
  }
`;

// ページ作成ミューテーション
export const CREATE_PAGE = gql`
  mutation CreatePage($content: String!, $description: String, $path: String!, $title: String!) {
    pages {
      create(
        content: $content
        description: $description
        path: $path
        title: $title
      ) {
        responseResult {
          succeeded
          errorCode
          slug
          message
        }
        page {
          id
          path
          title
        }
      }
    }
  }
`;

// ページ更新ミューテーション
export const UPDATE_PAGE = gql`
  mutation UpdatePage($id: Int!, $content: String, $description: String, $path: String, $title: String) {
    pages {
      update(
        id: $id
        content: $content
        description: $description
        path: $path
        title: $title
      ) {
        responseResult {
          succeeded
          errorCode
          slug
          message
        }
        page {
          id
          path
          title
        }
      }
    }
  }
`;

// ページ削除ミューテーション
export const DELETE_PAGE = gql`
  mutation DeletePage($id: Int!) {
    pages {
      delete(id: $id) {
        responseResult {
          succeeded
          errorCode
          slug
          message
        }
      }
    }
  }
`;