import { fetchProducts, fetchProductDetail, PublicCatalogProductSummary, PublicCatalogProductDetail } from './api/commerce';

export async function getAllProducts(): Promise<PublicCatalogProductSummary[]> {
  try {
    return await fetchProducts();
  } catch (error) {
    console.error('Error fetching catalog:', error);
    return [];
  }
}

export async function getFeaturedProducts(): Promise<PublicCatalogProductSummary[]> {
  const products = await getAllProducts();
  return products.slice(0, 3);
}

export async function getProductBySlug(slug: string): Promise<PublicCatalogProductDetail | null> {
  return fetchProductDetail(slug);
}
