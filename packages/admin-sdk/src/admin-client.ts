import type { RequestFn, RequestOptions } from '@spree/sdk-core';
import { transformListParams, getParams } from '@spree/sdk-core';
import type { PaginatedResponse, ListParams } from '@spree/sdk-core';

export interface AuthTokens {
  token: string;
  refresh_token?: string;
  user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface PermissionRule {
  /** true for `can`, false for `cannot` */
  allow: boolean;
  /** Action names, e.g. ["read", "update"] or ["manage"] */
  actions: string[];
  /** Subject class names, e.g. ["Spree::Product"] or ["all"] */
  subjects: string[];
  /** Whether the server rule has per-record conditions. If true, the action may be denied at the record level and the SPA should expect possible 403. */
  has_conditions: boolean;
}

export interface MeResponse {
  user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
  permissions: PermissionRule[];
}
import type { Store, Product, Order, Media, Category, TaxCategory, Country } from './types';
import type {
  StoreUpdateParams,
  ProductUpdateParams,
  OrderUpdateParams,
  MediaCreateParams,
  MediaUpdateParams,
  LineItemCreateParams,
  LineItemUpdateParams,
  AdjustmentCreateParams,
  FulfillmentUpdateParams,
  DirectUploadCreateParams,
} from './params';

export class AdminClient {
  /** @internal */
  readonly request: RequestFn;

  constructor(request: RequestFn) {
    this.request = request;
  }

  // ============================================
  // Authentication
  // ============================================

  readonly auth = {
    login: (credentials: LoginCredentials, options?: RequestOptions): Promise<AuthTokens> =>
      this.request<AuthTokens>('POST', '/auth/login', { ...options, body: credentials }),

    refresh: (params: { refresh_token: string }, options?: RequestOptions): Promise<AuthTokens> =>
      this.request<AuthTokens>('POST', '/auth/refresh', { ...options, body: params }),
  };

  // ============================================
  // Current admin user + permissions
  // ============================================

  readonly me = {
    /** Get the current admin user profile and their serialized permissions. */
    show: (options?: RequestOptions): Promise<MeResponse> =>
      this.request<MeResponse>('GET', '/me', options),
  };

  // ============================================
  // Store Settings
  // ============================================

  readonly store = {
    get: (options?: RequestOptions): Promise<Store> =>
      this.request<Store>('GET', '/store', options),

    update: (params: StoreUpdateParams, options?: RequestOptions): Promise<Store> =>
      this.request<Store>('PATCH', '/store', { ...options, body: params }),
  };

  // ============================================
  // Products
  // ============================================

  readonly products = {
    list: (params?: ListParams & Record<string, unknown>, options?: RequestOptions): Promise<PaginatedResponse<Product>> =>
      this.request<PaginatedResponse<Product>>('GET', '/products', {
        ...options,
        params: params ? transformListParams(params) : undefined,
      }),

    get: (id: string, params?: { expand?: string[] }, options?: RequestOptions): Promise<Product> =>
      this.request<Product>('GET', `/products/${id}`, {
        ...options,
        params: getParams(params),
      }),

    update: (id: string, params: ProductUpdateParams, options?: RequestOptions): Promise<Product> =>
      this.request<Product>('PATCH', `/products/${id}`, { ...options, body: params }),

    delete: (id: string, options?: RequestOptions): Promise<void> =>
      this.request<void>('DELETE', `/products/${id}`, options),

    media: {
      list: (productId: string, params?: ListParams & Record<string, unknown>, options?: RequestOptions): Promise<PaginatedResponse<Media>> =>
        this.request<PaginatedResponse<Media>>('GET', `/products/${productId}/media`, {
          ...options,
          params: params ? transformListParams(params) : undefined,
        }),

      create: (productId: string, params: MediaCreateParams, options?: RequestOptions): Promise<Media> =>
        this.request<Media>('POST', `/products/${productId}/media`, { ...options, body: params }),

      update: (productId: string, id: string, params: MediaUpdateParams, options?: RequestOptions): Promise<Media> =>
        this.request<Media>('PATCH', `/products/${productId}/media/${id}`, { ...options, body: params }),

      delete: (productId: string, id: string, options?: RequestOptions): Promise<void> =>
        this.request<void>('DELETE', `/products/${productId}/media/${id}`, options),
    },
  };

  // ============================================
  // Orders
  // ============================================

  readonly orders = {
    list: (params?: ListParams & Record<string, unknown>, options?: RequestOptions): Promise<PaginatedResponse<Order>> =>
      this.request<PaginatedResponse<Order>>('GET', '/orders', {
        ...options,
        params: params ? transformListParams(params) : undefined,
      }),

    get: (id: string, params?: { expand?: string[] }, options?: RequestOptions): Promise<Order> =>
      this.request<Order>('GET', `/orders/${id}`, {
        ...options,
        params: getParams(params),
      }),

    update: (id: string, params: OrderUpdateParams | Record<string, unknown>, options?: RequestOptions): Promise<Order> =>
      this.request<Order>('PATCH', `/orders/${id}`, { ...options, body: params }),

    cancel: (id: string, options?: RequestOptions): Promise<Order> =>
      this.request<Order>('PATCH', `/orders/${id}/cancel`, options),

    resendConfirmation: (id: string, options?: RequestOptions): Promise<void> =>
      this.request<void>('POST', `/orders/${id}/resend_confirmation`, options),

    lineItems: {
      create: (orderId: string, params: LineItemCreateParams, options?: RequestOptions): Promise<unknown> =>
        this.request('POST', `/orders/${orderId}/line_items`, { ...options, body: params }),

      update: (orderId: string, id: string, params: LineItemUpdateParams, options?: RequestOptions): Promise<unknown> =>
        this.request('PATCH', `/orders/${orderId}/line_items/${id}`, { ...options, body: params }),

      delete: (orderId: string, id: string, options?: RequestOptions): Promise<void> =>
        this.request<void>('DELETE', `/orders/${orderId}/line_items/${id}`, options),
    },

    fulfillments: {
      update: (orderId: string, id: string, params: FulfillmentUpdateParams, options?: RequestOptions): Promise<unknown> =>
        this.request('PATCH', `/orders/${orderId}/fulfillments/${id}`, { ...options, body: params }),

      fulfill: (orderId: string, id: string, options?: RequestOptions): Promise<unknown> =>
        this.request('PATCH', `/orders/${orderId}/fulfillments/${id}/fulfill`, options),

      cancel: (orderId: string, id: string, options?: RequestOptions): Promise<unknown> =>
        this.request('PATCH', `/orders/${orderId}/fulfillments/${id}/cancel`, options),
    },

    payments: {
      capture: (orderId: string, id: string, options?: RequestOptions): Promise<unknown> =>
        this.request('PATCH', `/orders/${orderId}/payments/${id}/capture`, options),

      void: (orderId: string, id: string, options?: RequestOptions): Promise<unknown> =>
        this.request('PATCH', `/orders/${orderId}/payments/${id}/void`, options),
    },

    adjustments: {
      create: (orderId: string, params: AdjustmentCreateParams, options?: RequestOptions): Promise<unknown> =>
        this.request('POST', `/orders/${orderId}/adjustments`, { ...options, body: params }),

      delete: (orderId: string, id: string, options?: RequestOptions): Promise<void> =>
        this.request<void>('DELETE', `/orders/${orderId}/adjustments/${id}`, options),
    },
  };

  // ============================================
  // Categories
  // ============================================

  readonly categories = {
    list: (params?: ListParams & Record<string, unknown>, options?: RequestOptions): Promise<PaginatedResponse<Category>> =>
      this.request<PaginatedResponse<Category>>('GET', '/categories', {
        ...options,
        params: params ? transformListParams(params) : undefined,
      }),
  };

  // ============================================
  // Tax Categories
  // ============================================

  readonly taxCategories = {
    list: (params?: ListParams & Record<string, unknown>, options?: RequestOptions): Promise<PaginatedResponse<TaxCategory>> =>
      this.request<PaginatedResponse<TaxCategory>>('GET', '/tax_categories', {
        ...options,
        params: params ? transformListParams(params) : undefined,
      }),
  };

  // ============================================
  // Countries
  // ============================================

  readonly countries = {
    list: (params?: ListParams & Record<string, unknown>, options?: RequestOptions): Promise<PaginatedResponse<Country>> =>
      this.request<PaginatedResponse<Country>>('GET', '/countries', {
        ...options,
        params: params ? transformListParams(params) : undefined,
      }),

    get: (iso: string, params?: { expand?: string[] }, options?: RequestOptions): Promise<Country> =>
      this.request<Country>('GET', `/countries/${iso}`, {
        ...options,
        params: getParams(params),
      }),
  };

  // ============================================
  // Direct Uploads (Active Storage)
  // ============================================

  readonly directUploads = {
    create: (params: DirectUploadCreateParams, options?: RequestOptions): Promise<{
      direct_upload: { url: string; headers: Record<string, string> };
      signed_id: string;
    }> =>
      this.request('POST', '/direct_uploads', { ...options, body: params }),
  };
}

// Re-export for type convenience
export type { PaginatedResponse, ListParams, RequestOptions };
