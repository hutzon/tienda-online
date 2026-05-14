import { apiFetch } from './client';
import { getToken } from '../session';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export interface ProductImageDto {
  id: string;
  imageUrl: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
}

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
  imageCount: number;
  primaryImageUrl?: string;
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
}

export interface BrandDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
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
  brandName?: string;
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

export async function fetchProductImages(productId: string): Promise<ProductImageDto[]> {
  return apiFetch<ProductImageDto[]>(
    `/api/v1/admin/catalog/products/${productId}/images`,
    { authenticated: true },
  );
}

export async function uploadProductImage(productId: string, file: File): Promise<ProductImageDto> {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/catalog/products/${productId}/images`,
    {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(text || 'Upload failed');
  }

  return response.json() as Promise<ProductImageDto>;
}

export async function setPrimaryProductImage(productId: string, imageId: string): Promise<ProductImageDto> {
  return apiFetch<ProductImageDto>(
    `/api/v1/admin/catalog/products/${productId}/images/${imageId}/primary`,
    { method: 'PUT', authenticated: true },
  );
}

export async function deleteProductImage(productId: string, imageId: string): Promise<void> {
  const token = getToken();
  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/catalog/products/${productId}/images/${imageId}`,
    {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );
  if (!response.ok) throw new Error('Failed to delete image');
}

// ── Categories ──────────────────────────────────────────────────────────────

export async function fetchAdminCategories(): Promise<CategoryDto[]> {
  return apiFetch<CategoryDto[]>('/api/v1/admin/catalog/categories/', { authenticated: true });
}

export async function createAdminCategory(name: string): Promise<CategoryDto> {
  return apiFetch<CategoryDto>('/api/v1/admin/catalog/categories/', {
    method: 'POST',
    body: JSON.stringify({ name }),
    authenticated: true,
  });
}

export async function updateAdminCategory(id: string, name: string): Promise<CategoryDto> {
  return apiFetch<CategoryDto>(`/api/v1/admin/catalog/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
    authenticated: true,
  });
}

export async function deleteAdminCategory(id: string): Promise<void> {
  await apiFetch<unknown>(`/api/v1/admin/catalog/categories/${id}`, {
    method: 'DELETE',
    authenticated: true,
  });
}

// ── Brands ───────────────────────────────────────────────────────────────────

export async function fetchAdminBrands(): Promise<BrandDto[]> {
  return apiFetch<BrandDto[]>('/api/v1/admin/catalog/brands/', { authenticated: true });
}

export async function createAdminBrand(name: string, description?: string): Promise<BrandDto> {
  return apiFetch<BrandDto>('/api/v1/admin/catalog/brands/', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
    authenticated: true,
  });
}

export async function updateAdminBrand(id: string, name: string, description?: string): Promise<BrandDto> {
  return apiFetch<BrandDto>(`/api/v1/admin/catalog/brands/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, description }),
    authenticated: true,
  });
}

export async function deleteAdminBrand(id: string): Promise<void> {
  await apiFetch<unknown>(`/api/v1/admin/catalog/brands/${id}`, {
    method: 'DELETE',
    authenticated: true,
  });
}
