import { gql } from 'graphql-request';

// Search pages - note: schema doesn't have limit parameter in search
export const SEARCH_PAGES = gql`
  query SearchPages($query: String!, $path: String, $locale: String) {
    pages {
      search(query: $query, path: $path, locale: $locale) {
        results {
          id
          title
          description
          path
          locale
        }
        suggestions
        totalHits
      }
    }
  }
`;

// Get page by ID
export const GET_PAGE_BY_ID = gql`
  query GetPageById($id: Int!) {
    pages {
      single(id: $id) {
        id
        path
        title
        description
        content
        createdAt
        updatedAt
        editor
        locale
      }
    }
  }
`;

// Get page by path
export const GET_PAGE_BY_PATH = gql`
  query GetPageByPath($path: String!, $locale: String!) {
    pages {
      singleByPath(path: $path, locale: $locale) {
        id
        path
        title
        description
        content
        createdAt
        updatedAt
        editor
        locale
      }
    }
  }
`;

// List pages
export const LIST_PAGES = gql`
  query ListPages($limit: Int, $orderBy: PageOrderBy, $orderByDirection: PageOrderByDirection, $tags: [String!], $locale: String) {
    pages {
      list(
        limit: $limit
        orderBy: $orderBy
        orderByDirection: $orderByDirection
        tags: $tags
        locale: $locale
      ) {
        id
        path
        title
        description
        contentType
        isPublished
        isPrivate
        createdAt
        updatedAt
        tags
      }
    }
  }
`;

// Get the page tree (for browsing the wiki's folder/page hierarchy)
export const GET_PAGE_TREE = gql`
  query GetPageTree($path: String, $parent: Int, $mode: PageTreeMode!, $locale: String!, $includeAncestors: Boolean) {
    pages {
      tree(path: $path, parent: $parent, mode: $mode, locale: $locale, includeAncestors: $includeAncestors) {
        id
        path
        depth
        title
        isPrivate
        isFolder
        parent
        pageId
        locale
      }
    }
  }
`;

// Get all tags
export const GET_TAGS = gql`
  query GetTags {
    pages {
      tags {
        id
        tag
        title
        createdAt
        updatedAt
      }
    }
  }
`;

// Create page
export const CREATE_PAGE = gql`
  mutation CreatePage(
    $content: String!,
    $description: String!,
    $editor: String!,
    $isPublished: Boolean!,
    $isPrivate: Boolean!,
    $locale: String!,
    $path: String!,
    $tags: [String]!,
    $title: String!,
    $publishStartDate: Date,
    $publishEndDate: Date,
    $scriptCss: String,
    $scriptJs: String
  ) {
    pages {
      create(
        content: $content
        description: $description
        editor: $editor
        isPublished: $isPublished
        isPrivate: $isPrivate
        locale: $locale
        path: $path
        tags: $tags
        title: $title
        publishStartDate: $publishStartDate
        publishEndDate: $publishEndDate
        scriptCss: $scriptCss
        scriptJs: $scriptJs
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

// Update page
export const UPDATE_PAGE = gql`
  mutation UpdatePage(
    $id: Int!,
    $content: String,
    $description: String,
    $editor: String,
    $isPrivate: Boolean,
    $isPublished: Boolean,
    $locale: String,
    $path: String,
    $publishEndDate: Date,
    $publishStartDate: Date,
    $scriptCss: String,
    $scriptJs: String,
    $tags: [String],
    $title: String
  ) {
    pages {
      update(
        id: $id
        content: $content
        description: $description
        editor: $editor
        isPrivate: $isPrivate
        isPublished: $isPublished
        locale: $locale
        path: $path
        publishEndDate: $publishEndDate
        publishStartDate: $publishStartDate
        scriptCss: $scriptCss
        scriptJs: $scriptJs
        tags: $tags
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

// Move (rename/relocate) page
export const MOVE_PAGE = gql`
  mutation MovePage($id: Int!, $destinationPath: String!, $destinationLocale: String!) {
    pages {
      move(id: $id, destinationPath: $destinationPath, destinationLocale: $destinationLocale) {
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

// Delete page
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