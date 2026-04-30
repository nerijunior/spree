import type { ListParams, PaginatedResponse, RequestFn, RequestOptions } from '@spree/sdk-core'
import { getParams, transformListParams } from '@spree/sdk-core'

export interface DashboardAnalytics {
  currency: string
  date_from: string
  date_to: string
  summary: {
    sales_total: number
    display_sales_total: string
    sales_growth: number
    orders_count: number
    orders_growth: number
    avg_order_value: number
    display_avg_order_value: string
    avg_order_value_growth: number
  }
  chart_data: Array<{
    date: string
    sales: number
    orders: number
    avg_order_value: number
  }>
  top_products: Array<{
    id: string
    name: string
    slug: string
    image_url: string | null
    price: string | null
    quantity: number
    total: string
  }>
}

export interface AuthTokens {
  token: string
  refresh_token?: string
  user: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
  }
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface PermissionRule {
  /** true for `can`, false for `cannot` */
  allow: boolean
  /** Action names, e.g. ["read", "update"] or ["manage"] */
  actions: string[]
  /** Subject class names, e.g. ["Spree::Product"] or ["all"] */
  subjects: string[]
  /** Whether the server rule has per-record conditions. If true, the action may be denied at the record level and the SPA should expect possible 403. */
  has_conditions: boolean
}

export interface MeResponse {
  user: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
  }
  permissions: PermissionRule[]
}

import type {
  CustomerAddressParams,
  CustomerCreateParams,
  CustomerStoreCreditCreateParams,
  CustomerStoreCreditUpdateParams,
  CustomerUpdateParams,
  DirectUploadCreateParams,
  FulfillmentUpdateParams,
  GiftCardApplyParams,
  LineItemCreateParams,
  LineItemUpdateParams,
  MediaCreateParams,
  MediaUpdateParams,
  OptionTypeCreateParams,
  OptionTypeUpdateParams,
  OrderApproveParams,
  OrderCancelParams,
  OrderCompleteParams,
  OrderCreateParams,
  OrderUpdateParams,
  PaymentCreateParams,
  ProductUpdateParams,
  StoreCreditApplyParams,
  StoreUpdateParams,
  VariantCreateParams,
  VariantUpdateParams,
} from './params'
import type {
  Address,
  Adjustment,
  Category,
  Country,
  CreditCard,
  Customer,
  Fulfillment,
  LineItem,
  Media,
  OptionType,
  Order,
  Payment,
  PaymentMethod,
  Product,
  Refund,
  Store,
  StoreCredit,
  TaxCategory,
  Variant,
} from './types'

export class AdminClient {
  /** @internal */
  readonly request: RequestFn

  constructor(request: RequestFn) {
    this.request = request
  }

  // ============================================
  // Authentication
  // ============================================

  readonly auth = {
    login: (credentials: LoginCredentials, options?: RequestOptions): Promise<AuthTokens> =>
      this.request<AuthTokens>('POST', '/auth/login', { ...options, body: credentials }),

    refresh: (params: { refresh_token: string }, options?: RequestOptions): Promise<AuthTokens> =>
      this.request<AuthTokens>('POST', '/auth/refresh', { ...options, body: params }),
  }

  // ============================================
  // Current admin user + permissions
  // ============================================

  readonly me = {
    /** Get the current admin user profile and their serialized permissions. */
    show: (options?: RequestOptions): Promise<MeResponse> =>
      this.request<MeResponse>('GET', '/me', options),
  }

  // ============================================
  // Dashboard
  // ============================================

  readonly dashboard = {
    analytics: (
      params?: { date_from?: string; date_to?: string; currency?: string },
      options?: RequestOptions,
    ): Promise<DashboardAnalytics> =>
      this.request<DashboardAnalytics>('GET', '/dashboard/analytics', {
        ...options,
        params: params as Record<string, string>,
      }),
  }

  // ============================================
  // Store Settings
  // ============================================

  readonly store = {
    get: (options?: RequestOptions): Promise<Store> =>
      this.request<Store>('GET', '/store', options),

    update: (params: StoreUpdateParams, options?: RequestOptions): Promise<Store> =>
      this.request<Store>('PATCH', '/store', { ...options, body: params }),
  }

  // ============================================
  // Products
  // ============================================

  readonly products = {
    list: (
      params?: ListParams & Record<string, unknown>,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Product>> =>
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
      list: (
        productId: string,
        params?: ListParams & Record<string, unknown>,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<Media>> =>
        this.request<PaginatedResponse<Media>>('GET', `/products/${productId}/media`, {
          ...options,
          params: params ? transformListParams(params) : undefined,
        }),

      create: (
        productId: string,
        params: MediaCreateParams,
        options?: RequestOptions,
      ): Promise<Media> =>
        this.request<Media>('POST', `/products/${productId}/media`, { ...options, body: params }),

      update: (
        productId: string,
        id: string,
        params: MediaUpdateParams,
        options?: RequestOptions,
      ): Promise<Media> =>
        this.request<Media>('PATCH', `/products/${productId}/media/${id}`, {
          ...options,
          body: params,
        }),

      delete: (productId: string, id: string, options?: RequestOptions): Promise<void> =>
        this.request<void>('DELETE', `/products/${productId}/media/${id}`, options),
    },

    variants: {
      list: (
        productId: string,
        params?: ListParams & Record<string, unknown>,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<Variant>> =>
        this.request<PaginatedResponse<Variant>>('GET', `/products/${productId}/variants`, {
          ...options,
          params: params ? transformListParams(params) : undefined,
        }),

      get: (
        productId: string,
        id: string,
        params?: { expand?: string[] },
        options?: RequestOptions,
      ): Promise<Variant> =>
        this.request<Variant>('GET', `/products/${productId}/variants/${id}`, {
          ...options,
          params: getParams(params),
        }),

      create: (
        productId: string,
        params: VariantCreateParams,
        options?: RequestOptions,
      ): Promise<Variant> =>
        this.request<Variant>('POST', `/products/${productId}/variants`, {
          ...options,
          body: params,
        }),

      update: (
        productId: string,
        id: string,
        params: VariantUpdateParams,
        options?: RequestOptions,
      ): Promise<Variant> =>
        this.request<Variant>('PATCH', `/products/${productId}/variants/${id}`, {
          ...options,
          body: params,
        }),

      delete: (productId: string, id: string, options?: RequestOptions): Promise<void> =>
        this.request<void>('DELETE', `/products/${productId}/variants/${id}`, options),

      media: {
        list: (
          productId: string,
          variantId: string,
          params?: ListParams & Record<string, unknown>,
          options?: RequestOptions,
        ): Promise<PaginatedResponse<Media>> =>
          this.request<PaginatedResponse<Media>>(
            'GET',
            `/products/${productId}/variants/${variantId}/media`,
            {
              ...options,
              params: params ? transformListParams(params) : undefined,
            },
          ),

        create: (
          productId: string,
          variantId: string,
          params: MediaCreateParams,
          options?: RequestOptions,
        ): Promise<Media> =>
          this.request<Media>('POST', `/products/${productId}/variants/${variantId}/media`, {
            ...options,
            body: params,
          }),

        update: (
          productId: string,
          variantId: string,
          id: string,
          params: MediaUpdateParams,
          options?: RequestOptions,
        ): Promise<Media> =>
          this.request<Media>('PATCH', `/products/${productId}/variants/${variantId}/media/${id}`, {
            ...options,
            body: params,
          }),

        delete: (
          productId: string,
          variantId: string,
          id: string,
          options?: RequestOptions,
        ): Promise<void> =>
          this.request<void>(
            'DELETE',
            `/products/${productId}/variants/${variantId}/media/${id}`,
            options,
          ),
      },
    },
  }

  // ============================================
  // Orders
  // ============================================

  readonly orders = {
    list: (
      params?: ListParams & Record<string, unknown>,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Order>> =>
      this.request<PaginatedResponse<Order>>('GET', '/orders', {
        ...options,
        params: params ? transformListParams(params) : undefined,
      }),

    get: (id: string, params?: { expand?: string[] }, options?: RequestOptions): Promise<Order> =>
      this.request<Order>('GET', `/orders/${id}`, {
        ...options,
        params: getParams(params),
      }),

    create: (params: OrderCreateParams, options?: RequestOptions): Promise<Order> =>
      this.request<Order>('POST', '/orders', { ...options, body: params }),

    update: (
      id: string,
      params: OrderUpdateParams | Record<string, unknown>,
      options?: RequestOptions,
    ): Promise<Order> =>
      this.request<Order>('PATCH', `/orders/${id}`, { ...options, body: params }),

    delete: (id: string, options?: RequestOptions): Promise<void> =>
      this.request<void>('DELETE', `/orders/${id}`, options),

    complete: (
      id: string,
      params?: OrderCompleteParams,
      options?: RequestOptions,
    ): Promise<Order> =>
      this.request<Order>('PATCH', `/orders/${id}/complete`, { ...options, body: params }),

    cancel: (id: string, params?: OrderCancelParams, options?: RequestOptions): Promise<Order> =>
      this.request<Order>('PATCH', `/orders/${id}/cancel`, { ...options, body: params }),

    approve: (id: string, params?: OrderApproveParams, options?: RequestOptions): Promise<Order> =>
      this.request<Order>('PATCH', `/orders/${id}/approve`, { ...options, body: params }),

    resume: (id: string, options?: RequestOptions): Promise<Order> =>
      this.request<Order>('PATCH', `/orders/${id}/resume`, options),

    resendConfirmation: (id: string, options?: RequestOptions): Promise<void> =>
      this.request<void>('POST', `/orders/${id}/resend_confirmation`, options),

    giftCards: {
      apply: (
        orderId: string,
        params: GiftCardApplyParams,
        options?: RequestOptions,
      ): Promise<unknown> =>
        this.request('POST', `/orders/${orderId}/gift_cards`, { ...options, body: params }),

      remove: (orderId: string, id: string, options?: RequestOptions): Promise<void> =>
        this.request<void>('DELETE', `/orders/${orderId}/gift_cards/${id}`, options),
    },

    storeCredits: {
      apply: (
        orderId: string,
        params?: StoreCreditApplyParams,
        options?: RequestOptions,
      ): Promise<Order> =>
        this.request<Order>('POST', `/orders/${orderId}/store_credits`, {
          ...options,
          body: params,
        }),

      remove: (orderId: string, options?: RequestOptions): Promise<void> =>
        this.request<void>('DELETE', `/orders/${orderId}/store_credits`, options),
    },

    items: {
      list: (
        orderId: string,
        params?: ListParams & Record<string, unknown>,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<LineItem>> =>
        this.request<PaginatedResponse<LineItem>>('GET', `/orders/${orderId}/items`, {
          ...options,
          params: params ? transformListParams(params) : undefined,
        }),

      get: (
        orderId: string,
        id: string,
        params?: { expand?: string[] },
        options?: RequestOptions,
      ): Promise<LineItem> =>
        this.request<LineItem>('GET', `/orders/${orderId}/items/${id}`, {
          ...options,
          params: getParams(params),
        }),

      create: (
        orderId: string,
        params: LineItemCreateParams,
        options?: RequestOptions,
      ): Promise<LineItem> =>
        this.request<LineItem>('POST', `/orders/${orderId}/items`, { ...options, body: params }),

      update: (
        orderId: string,
        id: string,
        params: LineItemUpdateParams,
        options?: RequestOptions,
      ): Promise<LineItem> =>
        this.request<LineItem>('PATCH', `/orders/${orderId}/items/${id}`, {
          ...options,
          body: params,
        }),

      delete: (orderId: string, id: string, options?: RequestOptions): Promise<void> =>
        this.request<void>('DELETE', `/orders/${orderId}/items/${id}`, options),
    },

    fulfillments: {
      list: (
        orderId: string,
        params?: ListParams & Record<string, unknown>,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<Fulfillment>> =>
        this.request<PaginatedResponse<Fulfillment>>('GET', `/orders/${orderId}/fulfillments`, {
          ...options,
          params: params ? transformListParams(params) : undefined,
        }),

      get: (
        orderId: string,
        id: string,
        params?: { expand?: string[] },
        options?: RequestOptions,
      ): Promise<Fulfillment> =>
        this.request<Fulfillment>('GET', `/orders/${orderId}/fulfillments/${id}`, {
          ...options,
          params: getParams(params),
        }),

      update: (
        orderId: string,
        id: string,
        params: FulfillmentUpdateParams,
        options?: RequestOptions,
      ): Promise<Fulfillment> =>
        this.request<Fulfillment>('PATCH', `/orders/${orderId}/fulfillments/${id}`, {
          ...options,
          body: params,
        }),

      fulfill: (orderId: string, id: string, options?: RequestOptions): Promise<Fulfillment> =>
        this.request<Fulfillment>(
          'PATCH',
          `/orders/${orderId}/fulfillments/${id}/fulfill`,
          options,
        ),

      cancel: (orderId: string, id: string, options?: RequestOptions): Promise<Fulfillment> =>
        this.request<Fulfillment>('PATCH', `/orders/${orderId}/fulfillments/${id}/cancel`, options),

      resume: (orderId: string, id: string, options?: RequestOptions): Promise<Fulfillment> =>
        this.request<Fulfillment>('PATCH', `/orders/${orderId}/fulfillments/${id}/resume`, options),

      split: (
        orderId: string,
        id: string,
        params: { quantity: number; line_item_id?: string },
        options?: RequestOptions,
      ): Promise<Fulfillment> =>
        this.request<Fulfillment>('PATCH', `/orders/${orderId}/fulfillments/${id}/split`, {
          ...options,
          body: params,
        }),
    },

    payments: {
      list: (
        orderId: string,
        params?: ListParams & Record<string, unknown>,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<Payment>> =>
        this.request<PaginatedResponse<Payment>>('GET', `/orders/${orderId}/payments`, {
          ...options,
          params: params ? transformListParams(params) : undefined,
        }),

      get: (
        orderId: string,
        id: string,
        params?: { expand?: string[] },
        options?: RequestOptions,
      ): Promise<Payment> =>
        this.request<Payment>('GET', `/orders/${orderId}/payments/${id}`, {
          ...options,
          params: getParams(params),
        }),

      create: (
        orderId: string,
        params: PaymentCreateParams,
        options?: RequestOptions,
      ): Promise<Payment> =>
        this.request<Payment>('POST', `/orders/${orderId}/payments`, { ...options, body: params }),

      capture: (orderId: string, id: string, options?: RequestOptions): Promise<Payment> =>
        this.request<Payment>('PATCH', `/orders/${orderId}/payments/${id}/capture`, options),

      void: (orderId: string, id: string, options?: RequestOptions): Promise<Payment> =>
        this.request<Payment>('PATCH', `/orders/${orderId}/payments/${id}/void`, options),
    },

    refunds: {
      list: (
        orderId: string,
        params?: ListParams & Record<string, unknown>,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<Refund>> =>
        this.request<PaginatedResponse<Refund>>('GET', `/orders/${orderId}/refunds`, {
          ...options,
          params: params ? transformListParams(params) : undefined,
        }),

      create: (
        orderId: string,
        params: {
          payment_id: string
          amount: number
          reason_id?: string
          refund_reason_id?: string
        },
        options?: RequestOptions,
      ): Promise<Refund> =>
        this.request<Refund>('POST', `/orders/${orderId}/refunds`, { ...options, body: params }),
    },

    adjustments: {
      list: (
        orderId: string,
        params?: ListParams & Record<string, unknown>,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<Adjustment>> =>
        this.request<PaginatedResponse<Adjustment>>('GET', `/orders/${orderId}/adjustments`, {
          ...options,
          params: params ? transformListParams(params) : undefined,
        }),

      get: (orderId: string, id: string, options?: RequestOptions): Promise<Adjustment> =>
        this.request<Adjustment>('GET', `/orders/${orderId}/adjustments/${id}`, options),
    },
  }

  // ============================================
  // Option Types
  // ============================================

  readonly optionTypes = {
    list: (
      params?: ListParams & Record<string, unknown>,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<OptionType>> =>
      this.request<PaginatedResponse<OptionType>>('GET', '/option_types', {
        ...options,
        params: params ? transformListParams(params) : undefined,
      }),

    get: (
      id: string,
      params?: { expand?: string[] },
      options?: RequestOptions,
    ): Promise<OptionType> =>
      this.request<OptionType>('GET', `/option_types/${id}`, {
        ...options,
        params: getParams(params),
      }),

    create: (params: OptionTypeCreateParams, options?: RequestOptions): Promise<OptionType> =>
      this.request<OptionType>('POST', '/option_types', { ...options, body: params }),

    update: (
      id: string,
      params: OptionTypeUpdateParams,
      options?: RequestOptions,
    ): Promise<OptionType> =>
      this.request<OptionType>('PATCH', `/option_types/${id}`, { ...options, body: params }),

    delete: (id: string, options?: RequestOptions): Promise<void> =>
      this.request<void>('DELETE', `/option_types/${id}`, options),
  }

  // ============================================
  // Payment Methods
  // ============================================

  readonly paymentMethods = {
    list: (
      params?: ListParams & Record<string, unknown>,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<PaymentMethod>> =>
      this.request<PaginatedResponse<PaymentMethod>>('GET', '/payment_methods', {
        ...options,
        params: params ? transformListParams(params) : undefined,
      }),

    get: (
      id: string,
      params?: { expand?: string[] },
      options?: RequestOptions,
    ): Promise<PaymentMethod> =>
      this.request<PaymentMethod>('GET', `/payment_methods/${id}`, {
        ...options,
        params: getParams(params),
      }),
  }

  // ============================================
  // Tags
  // ============================================

  readonly tags = {
    list: (
      params: { taggable_type: string; q?: string },
      options?: RequestOptions,
    ): Promise<{ data: Array<{ name: string }> }> =>
      this.request<{ data: Array<{ name: string }> }>('GET', '/tags', {
        ...options,
        params,
      }),
  }

  // ============================================
  // Customers
  // ============================================

  readonly customers = {
    list: (
      params?: ListParams & Record<string, unknown>,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Customer>> =>
      this.request<PaginatedResponse<Customer>>('GET', '/customers', {
        ...options,
        params: params ? transformListParams(params) : undefined,
      }),

    get: (
      id: string,
      params?: { expand?: string[] },
      options?: RequestOptions,
    ): Promise<Customer> =>
      this.request<Customer>('GET', `/customers/${id}`, {
        ...options,
        params: getParams(params),
      }),

    creditCards: {
      list: (
        customerId: string,
        params?: ListParams & Record<string, unknown>,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<CreditCard>> =>
        this.request<PaginatedResponse<CreditCard>>(
          'GET',
          `/customers/${customerId}/credit_cards`,
          {
            ...options,
            params: params ? transformListParams(params) : undefined,
          },
        ),

      get: (
        customerId: string,
        id: string,
        params?: { expand?: string[] },
        options?: RequestOptions,
      ): Promise<CreditCard> =>
        this.request<CreditCard>('GET', `/customers/${customerId}/credit_cards/${id}`, {
          ...options,
          params: getParams(params),
        }),

      delete: (customerId: string, id: string, options?: RequestOptions): Promise<void> =>
        this.request<void>('DELETE', `/customers/${customerId}/credit_cards/${id}`, options),
    },

    create: (params: CustomerCreateParams, options?: RequestOptions): Promise<Customer> =>
      this.request<Customer>('POST', '/customers', { ...options, body: params }),

    update: (
      id: string,
      params: CustomerUpdateParams,
      options?: RequestOptions,
    ): Promise<Customer> =>
      this.request<Customer>('PATCH', `/customers/${id}`, { ...options, body: params }),

    delete: (id: string, options?: RequestOptions): Promise<void> =>
      this.request<void>('DELETE', `/customers/${id}`, options),

    addresses: {
      list: (
        customerId: string,
        params?: ListParams & Record<string, unknown>,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<Address>> =>
        this.request<PaginatedResponse<Address>>('GET', `/customers/${customerId}/addresses`, {
          ...options,
          params: params ? transformListParams(params) : undefined,
        }),

      get: (
        customerId: string,
        id: string,
        params?: { expand?: string[] },
        options?: RequestOptions,
      ): Promise<Address> =>
        this.request<Address>('GET', `/customers/${customerId}/addresses/${id}`, {
          ...options,
          params: getParams(params),
        }),

      create: (
        customerId: string,
        params: CustomerAddressParams,
        options?: RequestOptions,
      ): Promise<Address> =>
        this.request<Address>('POST', `/customers/${customerId}/addresses`, {
          ...options,
          body: params,
        }),

      update: (
        customerId: string,
        id: string,
        params: CustomerAddressParams,
        options?: RequestOptions,
      ): Promise<Address> =>
        this.request<Address>('PATCH', `/customers/${customerId}/addresses/${id}`, {
          ...options,
          body: params,
        }),

      delete: (customerId: string, id: string, options?: RequestOptions): Promise<void> =>
        this.request<void>('DELETE', `/customers/${customerId}/addresses/${id}`, options),
    },

    storeCredits: {
      list: (
        customerId: string,
        params?: ListParams & Record<string, unknown>,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<StoreCredit>> =>
        this.request<PaginatedResponse<StoreCredit>>(
          'GET',
          `/customers/${customerId}/store_credits`,
          {
            ...options,
            params: params ? transformListParams(params) : undefined,
          },
        ),

      get: (
        customerId: string,
        id: string,
        params?: { expand?: string[] },
        options?: RequestOptions,
      ): Promise<StoreCredit> =>
        this.request<StoreCredit>('GET', `/customers/${customerId}/store_credits/${id}`, {
          ...options,
          params: getParams(params),
        }),

      create: (
        customerId: string,
        params: CustomerStoreCreditCreateParams,
        options?: RequestOptions,
      ): Promise<StoreCredit> =>
        this.request<StoreCredit>('POST', `/customers/${customerId}/store_credits`, {
          ...options,
          body: params,
        }),

      update: (
        customerId: string,
        id: string,
        params: CustomerStoreCreditUpdateParams,
        options?: RequestOptions,
      ): Promise<StoreCredit> =>
        this.request<StoreCredit>('PATCH', `/customers/${customerId}/store_credits/${id}`, {
          ...options,
          body: params,
        }),

      delete: (customerId: string, id: string, options?: RequestOptions): Promise<void> =>
        this.request<void>('DELETE', `/customers/${customerId}/store_credits/${id}`, options),
    },
  }

  // ============================================
  // Categories
  // ============================================

  readonly categories = {
    list: (
      params?: ListParams & Record<string, unknown>,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Category>> =>
      this.request<PaginatedResponse<Category>>('GET', '/categories', {
        ...options,
        params: params ? transformListParams(params) : undefined,
      }),
  }

  // ============================================
  // Variants (top-level, for search/autocomplete)
  // ============================================

  readonly variants = {
    list: (
      params?: ListParams & Record<string, unknown>,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Variant>> =>
      this.request<PaginatedResponse<Variant>>('GET', '/variants', {
        ...options,
        params: params ? transformListParams(params) : undefined,
      }),

    get: (id: string, params?: { expand?: string[] }, options?: RequestOptions): Promise<Variant> =>
      this.request<Variant>('GET', `/variants/${id}`, {
        ...options,
        params: getParams(params),
      }),
  }

  // ============================================
  // Tax Categories
  // ============================================

  readonly taxCategories = {
    list: (
      params?: ListParams & Record<string, unknown>,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<TaxCategory>> =>
      this.request<PaginatedResponse<TaxCategory>>('GET', '/tax_categories', {
        ...options,
        params: params ? transformListParams(params) : undefined,
      }),
  }

  // ============================================
  // Countries
  // ============================================

  readonly countries = {
    list: (
      params?: ListParams & Record<string, unknown>,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Country>> =>
      this.request<PaginatedResponse<Country>>('GET', '/countries', {
        ...options,
        params: params ? transformListParams(params) : undefined,
      }),

    get: (
      iso: string,
      params?: { expand?: string[] },
      options?: RequestOptions,
    ): Promise<Country> =>
      this.request<Country>('GET', `/countries/${iso}`, {
        ...options,
        params: getParams(params),
      }),
  }

  // ============================================
  // Direct Uploads (Active Storage)
  // ============================================

  readonly directUploads = {
    create: (
      params: DirectUploadCreateParams,
      options?: RequestOptions,
    ): Promise<{
      direct_upload: { url: string; headers: Record<string, string> }
      signed_id: string
    }> => this.request('POST', '/direct_uploads', { ...options, body: params }),
  }
}

// Re-export for type convenience
export type { ListParams, PaginatedResponse, RequestOptions }
