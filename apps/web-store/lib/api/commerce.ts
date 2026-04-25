import { apiFetch } from './client';

export interface PublicCatalogProductSummary {
  id: string;
  name: string;
  slug: string;
  summary: string;
  categoryName: string;
  price: number;
  currency: string;
  inStock: boolean;
  stockOnHand: number;
}

export interface PublicCatalogProductDetail {
  id: string;
  name: string;
  slug: string;
  sku: string;
  summary: string;
  description: string;
  categoryName: string;
  price: number;
  currency: string;
  inStock: boolean;
  stockOnHand: number;
}

export interface CreateOrderItemRequest {
  productId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  customerName: string;
  customerEmail: string;
  notes?: string;
  items: CreateOrderItemRequest[];
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  customerEmail: string;
  phone: string;
  address: string;
  currency: string;
  subtotal: number;
  total: number;
  notes?: string;
  createdAt: string;
  items: any[];
  paymentAttempts?: any[];
}

export interface CheckoutSessionResponse {
  id: string;
  orderId: string;
  status: string;
  expiresAt: string;
}

export interface CheckoutSessionDetailResponse {
  id: string;
  status: string;
  expiresAt: string;
  order: OrderResponse;
}

export interface UpdateCustomerRequest {
  customerName: string;
  customerEmail: string;
  phone: string;
  address: string;
}

export interface SelectPaymentMethodRequest {
  paymentMethod: string;
}

export interface SelectPaymentMethodResponse {
  paymentAttemptId: string;
  orderStatus: string;
}

export interface SimulatePaymentRequest {
  paymentAttemptId: string;
  success: boolean;
}

export interface SimulatePaymentResponse {
  paymentStatus: string;
  orderStatus: string;
}

export async function fetchProducts(): Promise<PublicCatalogProductSummary[]> {
  return apiFetch<PublicCatalogProductSummary[]>('/api/v1/catalog/products', { revalidate: 60 });
}

export async function fetchProductDetail(slug: string): Promise<PublicCatalogProductDetail | null> {
  try {
    return await apiFetch<PublicCatalogProductDetail>(`/api/v1/catalog/products/${slug}`, { revalidate: 60 });
  } catch (error: any) {
    if (error?.status === 404) return null;
    throw error;
  }
}

export async function createCheckoutSession(items: CreateOrderItemRequest[]): Promise<CheckoutSessionResponse> {
  return apiFetch<CheckoutSessionResponse>('/api/v1/checkout/sessions', {
    method: 'POST',
    body: JSON.stringify({ items }),
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function getCheckoutSession(sessionId: string): Promise<CheckoutSessionDetailResponse> {
  return apiFetch<CheckoutSessionDetailResponse>(`/api/v1/checkout/sessions/${sessionId}`);
}

export async function updateCheckoutCustomer(sessionId: string, request: UpdateCustomerRequest): Promise<void> {
  return apiFetch<void>(`/api/v1/checkout/sessions/${sessionId}/customer`, {
    method: 'PUT',
    body: JSON.stringify(request),
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function selectPaymentMethod(sessionId: string, request: SelectPaymentMethodRequest): Promise<SelectPaymentMethodResponse> {
  return apiFetch<SelectPaymentMethodResponse>(`/api/v1/checkout/sessions/${sessionId}/payment-method`, {
    method: 'POST',
    body: JSON.stringify(request),
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function simulatePayment(request: SimulatePaymentRequest): Promise<SimulatePaymentResponse> {
  return apiFetch<SimulatePaymentResponse>('/api/v1/payments/simulate', {
    method: 'POST',
    body: JSON.stringify(request),
    headers: { 'Content-Type': 'application/json' },
  });
}
