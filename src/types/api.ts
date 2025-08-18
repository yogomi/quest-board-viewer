/**
 * Common API response types following the unified response format
 */

// Base response structure
export interface BaseApiResponse {
  success: boolean;
  code: string;
  message: string;
}

// Generic response with data
export interface ApiResponse<T = any> extends BaseApiResponse {
  data: T;
}

// List response structure for paginated data
export interface ListResponseData<T> {
  from: number;
  count: number;
  total: number;
  items: T[];
}

export interface ListApiResponse<T> extends BaseApiResponse {
  data: ListResponseData<T>;
}

// Single item response structure
export interface ItemResponseData<T> {
  [key: string]: T;
}

export interface ItemApiResponse<T> extends BaseApiResponse {
  data: ItemResponseData<T> | null;
}