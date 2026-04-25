import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StorefrontContainer } from '@/components/storefront/StorefrontContainer';
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

  return (
    <StorefrontContainer className="section-stack">
      <section className="product-hero">
        <div className="product-visual">
          <span className="product-badge">{product.inStock ? 'Disponible' : 'Agotado'}</span>
          <h1>{product.name}</h1>
          <p>{product.summary}</p>
          <div style={{ marginTop: '1rem' }}>
            <strong>Descripción técnica:</strong>
            <p>{product.description}</p>
          </div>
        </div>

        <aside className="product-panel">
          <p className="product-price">{product.currency} {product.price.toFixed(2)}</p>
          <p className="product-meta">SKU: {product.sku}</p>
          <p className="product-meta">Categoría: {product.categoryName}</p>

          <div className="product-actions">
            <Link href="/cart" className="btn-primary">
              Ver carrito placeholder
            </Link>
            <Link href="/catalog" className="btn-secondary">
              Volver al catálogo
            </Link>
          </div>
        </aside>
      </section>

      <section className="section-shell">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Detalle placeholder</span>
            <h2>Qué ya está listo en esta ruta</h2>
          </div>
        </div>

        <div className="info-grid">
          <article className="info-card">
            <h3>Ruta dinámica</h3>
            <p>
              La página ya resuelve `slug`, genera metadata y controla
              `notFound()` cuando el producto no existe.
            </p>
          </article>
          <article className="info-card">
            <h3>Escala natural</h3>
            <p>
              Esta vista puede conectarse después a precio real, inventario,
              variantes, imágenes y reseñas sin rehacer la base.
            </p>
          </article>
          <article className="info-card">
            <h3>Checkout diferido</h3>
            <p>
              No hay compra real todavía. El objetivo actual es dejar una
              navegación pública profesional y coherente.
            </p>
          </article>
        </div>
      </section>
    </StorefrontContainer>
  );
}
