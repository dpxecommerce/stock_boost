export interface ProductDocument {
  id: string;                    // Primary key (using item_no)
  item_no: string;               // Primary item number
  item_no2: string;              // Secondary item number
  description: string;           // Product description
  client?: string;               // Client information (optional)
}

export interface ProductCollectionSchema {
  name: string;
  fields: Array<{
    name: string;
    type: string;
    facet?: boolean;
    optional?: boolean;
    index?: boolean;
  }>;
  default_sorting_field?: string;
}

export const PRODUCTS_COLLECTION_SCHEMA: ProductCollectionSchema = {
  name: 'products',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'item_no', type: 'string', facet: false },
    { name: 'item_no2', type: 'string', facet: false },
    { name: 'description', type: 'string' },
    { name: 'client', type: 'string', optional: true },
  ],
  default_sorting_field: 'item_no'
};

export interface ProductSearchParams {
  q: string;
  queryBy?: string;
  filterBy?: string;
  sortBy?: string;
  page?: number;
  perPage?: number;
}

export interface ProductSearchResponse {
  found: number;
  out_of: number;
  page: number;
  request_params: {
    collection_name: string;
    per_page: number;
    q: string;
  };
  search_time_ms: number;
  hits: ProductSearchHit[];
  facet_counts?: Record<string, unknown>[];
}

export interface ProductSearchHit {
  document: ProductDocument;
  highlight?: {
    [field: string]: {
      matched_tokens: string[];
      snippet: string;
    };
  };
  text_match: number;
}