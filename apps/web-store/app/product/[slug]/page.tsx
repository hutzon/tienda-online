import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StorefrontContainer } from '@/components/storefront/StorefrontContainer';
import ProductImageGallery from '@/components/storefront/ProductImageGallery';
import { getProductBySlug } from '@/lib/catalog';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: 'Producto no encontrado',
    };
  }

  return {
    title: product.name,
    description: product.summary,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const images = product.images ?? [];

  return (
    <StorefrontContainer className="section-stack">
      <section className="product-hero">
        <div className="product-visual">
          <ProductImageGallery images={images} productName={product.name} />

          <span className="product-badge" style={{ marginTop: '1rem', display: 'inline-block' }}>
            {product.inStock ? 'Disponible' : 'Agotado'}
          </span>
          <h1 style={{ marginTop: '0.5rem' }}>{product.name}</h1>
          <p>{product.summary}</p>
          <div style={{ marginTop: '1rem' }}>
            <strong>Descripción:</strong>
            <p>{product.description}</p>
          </div>
        </div>

        <aside className="product-panel">
          <p className="product-price">{product.currency} {product.price.toFixed(2)}</p>
          <p className="product-meta">SKU: {product.sku}</p>
          <p className="product-meta">Categoría: {product.categoryName}</p>
          {product.brandName && (
            <p className="product-meta">Marca: {product.brandName}</p>
          )}
          {images.length > 0 && (
            <p className="product-meta">{images.length} imagen{images.length !== 1 ? 'es' : ''}</p>
          )}

          <div className="product-actions">
            <Link href="/cart" className="btn-primary">
              Ver carrito
            </Link>
            <Link href="/catalog" className="btn-secondary">
              Volver al catálogo
            </Link>
          </div>
        </aside>
      </section>
    </StorefrontContainer>
  );
}
