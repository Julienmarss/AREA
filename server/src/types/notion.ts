// Notion API Types

export interface NotionAuthData {
  access_token: string;
  bot_id: string;
  workspace_id: string;
  workspace_name: string;
  workspace_icon: string;
  owner: {
    type: string;
    user?: {
      id: string;
      name: string;
      avatar_url: string;
      type: string;
      person?: {
        email: string;
      };
    };
  };
}

export interface NotionDatabase {
  object: 'database';
  id: string;
  created_time: string;
  created_by: {
    object: string;
    id: string;
  };
  last_edited_time: string;
  last_edited_by: {
    object: string;
    id: string;
  };
  title: Array<{
    type: string;
    text: {
      content: string;
      link: any;
    };
    annotations: any;
    plain_text: string;
    href: any;
  }>;
  description: any[];
  icon: any;
  cover: any;
  properties: Record<string, NotionProperty>;
  parent: {
    type: string;
    page_id?: string;
    workspace?: boolean;
  };
  url: string;
  archived: boolean;
}

export interface NotionProperty {
  id: string;
  name: string;
  type: string;
  [key: string]: any;
}

export interface NotionPage {
  object: 'page';
  id: string;
  created_time: string;
  last_edited_time: string;
  created_by: {
    object: string;
    id: string;
  };
  last_edited_by: {
    object: string;
    id: string;
  };
  cover: any;
  icon: any;
  parent: {
    type: string;
    database_id?: string;
    page_id?: string;
    workspace?: boolean;
  };
  archived: boolean;
  properties: Record<string, any>;
  url: string;
}

export interface NotionDatabaseItem {
  object: 'page';
  id: string;
  created_time: string;
  last_edited_time: string;
  properties: Record<string, any>;
  url: string;
}

export interface NotionUser {
  object: 'user';
  id: string;
  type: string;
  name: string;
  avatar_url: string;
}

export interface NotionBlock {
  object: 'block';
  id: string;
  parent: {
    type: string;
    page_id?: string;
    block_id?: string;
  };
  created_time: string;
  last_edited_time: string;
  created_by: {
    object: string;
    id: string;
  };
  last_edited_by: {
    object: string;
    id: string;
  };
  has_children: boolean;
  archived: boolean;
  type: string;
  [key: string]: any;
}

export interface NotionSearchResponse {
  object: 'list';
  results: Array<NotionPage | NotionDatabase>;
  next_cursor: string | null;
  has_more: boolean;
}

export interface NotionDatabaseQueryResponse {
  object: 'list';
  results: NotionDatabaseItem[];
  next_cursor: string | null;
  has_more: boolean;
}

// Action/Reaction Parameter Types
export interface DatabaseItemCreatedParams {
  databaseId: string;
  propertyFilters?: Record<string, any>;
}

export interface DatabaseItemUpdatedParams {
  databaseId: string;
  propertyFilters?: Record<string, any>;
}

export interface PageCreatedParams {
  parentPageId?: string;
}

export interface DatabasePropertyChangedParams {
  databaseId: string;
  propertyName: string;
}

export interface CreateDatabaseItemParams {
  databaseId: string;
  properties: Record<string, any>;
}

export interface UpdateDatabaseItemParams {
  pageId: string;
  properties: Record<string, any>;
}

export interface CreatePageParams {
  parentPageId?: string;
  parentDatabaseId?: string;
  title: string;
  content?: string;
}

// Helper type for property values
export type NotionPropertyValue =
  | { type: 'title'; title: Array<{ text: { content: string } }> }
  | { type: 'rich_text'; rich_text: Array<{ text: { content: string } }> }
  | { type: 'number'; number: number | null }
  | { type: 'select'; select: { name: string } | null }
  | { type: 'multi_select'; multi_select: Array<{ name: string }> }
  | { type: 'date'; date: { start: string; end?: string } | null }
  | { type: 'checkbox'; checkbox: boolean }
  | { type: 'url'; url: string | null }
  | { type: 'email'; email: string | null }
  | { type: 'phone_number'; phone_number: string | null };
