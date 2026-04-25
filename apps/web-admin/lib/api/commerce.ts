import { apiFetch } from './client';

export interface AdminCatalogProductSummary {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryName: string;
  summary: string;
  description: string;
  price: number;
  currency: string;
  isPublished: boolean;
  stockOnHand: number;
  updatedAt: string;
}

export interface UpsertProductRequest {
  name: string;
  slug?: string;
  sku: string;
  categoryName: string;
  summary: string;
  description: string;
  price: number;
  isPublished: boolean;
  stockOnHand: number;
}

export interface AdminInventoryProductRow {
  id: string;
  name: string;
  sku: string;
  categoryName: string;
  stockOnHand: number;
  isPublished: boolean;
  updatedAt: string;
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
  invoices?: InvoiceResponse[];
}

export interface InvoiceResponse {
  id: string;
  orderId: string;
  uuid?: string;
  satSignature?: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  createdAt: string;
  emittedAt?: string;
}

export async function fetchAdminProducts(): Promise<AdminCatalogProductSummary[]> {
  return apiFetch<AdminCatalogProductSummary[]>('/api/v1/admin/catalog/products', { authenticated: true });
}

export async function createAdminProduct(request: UpsertProductRequest): Promise<AdminCatalogProductSummary> {
  return apiFetch<AdminCatalogProductSummary>('/api/v1/admin/catalog/products', {
    method: 'POST',
    body: JSON.stringify(request),
    authenticated: true,
  });
}

export async function updateAdminProduct(id: string, request: UpsertProductRequest): Promise<AdminCatalogProductSummary> {
  return apiFetch<AdminCatalogProductSummary>(`/api/v1/admin/catalog/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(request),
    authenticated: true,
  });
}

export async function fetchAdminInventory(): Promise<AdminInventoryProductRow[]> {
  return apiFetch<AdminInventoryProductRow[]>('/api/v1/admin/inventory/products', { authenticated: true });
}

export async function updateAdminStock(id: string, stockOnHand: number): Promise<AdminCatalogProductSummary> {
  return apiFetch<AdminCatalogProductSummary>(`/api/v1/admin/inventory/products/${id}/stock`, {
    method: 'PUT',
    body: JSON.stringify({ stockOnHand }),
    authenticated: true,
  });
}

export async function fetchAdminOrders(): Promise<OrderResponse[]> {
  return apiFetch<OrderResponse[]>('/api/v1/admin/orders/', { authenticated: true });
}

export async function emitInvoice(orderId: string): Promise<InvoiceResponse> {
  return apiFetch<InvoiceResponse>(`/api/v1/admin/orders/${orderId}/invoices`, {
    method: 'POST',
    authenticated: true,
  });
}
