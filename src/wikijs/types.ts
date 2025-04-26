// Wiki page information
export interface WikiPage {
  id: number;
  path: string;
  title: string;
  description: string;
  content: string;
  createdAt: any;
  updatedAt: any;
}

// Search result
export interface SearchResult {
  pages: WikiPage[];
  totalCount: number;
}

// Page creation parameters
export interface CreatePageParams {
  path: string;
  title: string;
  content: string;
  description?: string;
  tags?: string[];
  isPublished?: boolean;
  isPrivate?: boolean;
  locale?: string;
  editor?: string;
}

// Page update parameters
export interface UpdatePageParams {
  id: number | string;
  content?: string;
  title?: string;
  description?: string;
  path?: string;
  tags?: string[];
  isPublished?: boolean;
  isPrivate?: boolean;
}

// Page tag
export interface WikiTag {
  id: number;
  tag: string;
  title: string;
}