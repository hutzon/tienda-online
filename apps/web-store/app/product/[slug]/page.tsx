import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StorefrontContainer } from '@/components/storefront/StorefrontContainer';
import ProductImageGallery from '@/components/storefront/ProductImageGallery';
import { AddToCartButton } from '@/components/storefront/AddToCartButton';
import { getProductBySlug } from '@/lib/catalog';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Producto no encontrado' };
  return { title: product.name, description: product.summary };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const images = product.images ?? [];

  return (
    <StorefrontContainer className="section-stack" style={{ paddingTop: '2rem' }}>
      <nav className="breadcrumb">
        <Link href="/">Inicio</Link>
        <span>›</span>
        <Link href="/catalog">Catálogo</Link>
        <span>›</span>
        <span>{product.name}</span>
      </nav>

      <section className="product-hero">
        <div className="product-visual">
          <ProductImageGallery images={images} productName={product.name} />
        </div>

        <aside className="product-panel">
          <div className="product-panel-meta">
            <span className={`product-badge${product.inStock ? '' : ' product-badge-out'}`}>
              {product.inStock ? 'En stock' : 'Agotado'}
            </span>
            {product.brandName && (
              <span className="product-brand">{product.brandName}</span>
            )}
          </div>

          <h1 className="product-panel-title">{product.name}</h1>
          <p className="product-panel-summary">{product.summary}</p>

          <p className="product-price-large">
            {product.currency} {product.price.toFixed(2)}
          </p>

          <div className="product-panel-divider" />

          <div className="product-panel-info">
            <div className="product-info-row">
              <span>SKU</span>
              <strong>{product.sku}</strong>
            </div>
            <div className="product-info-row">
              <span>Categoría</span>
              <strong>{product.categoryName}</strong>
            </div>
            {product.brandName && (
              <div className="product-info-row">
                <span>Marca</span>
                <strong>{product.brandName}</strong>
              </div>
            )}
            {product.inStock && (
              <div className="product-info-row">
                <span>Disponibles</span>
                <strong>{product.stockOnHand} unidades</strong>
              </div>
            )}
          </div>

          <div className="product-panel-divider" />

          <div className="product-actions" style={{ flexDirection: 'column', gap: '0.75rem' }}>
            <AddToCartButton
              productId={product.id}
              slug={product.slug}
              name={product.name}
              price={product.price}
              currency={product.currency}
              primaryImageUrl={images.find(i => i.isPrimary)?.imageUrl}
              inStock={product.inStock}
              variant="detail"
            />
            <Link href="/cart" className="btn-secondary" style={{ textAlign: 'center' }}>
              Ver carrito
            </Link>
          </div>

          {product.description && (
            <>
              <div className="product-panel-divider" />
              <div className="product-description">
                <h3>Descripción</h3>
                <p>{product.description}</p>
              </div>
            </>
          )}
        </aside>
      </section>
    </StorefrontContainer>
  );
}
