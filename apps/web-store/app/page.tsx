import Link from 'next/link';
import { ProductCard } from '@/components/storefront/ProductCard';
import { StorefrontContainer } from '@/components/storefront/StorefrontContainer';
import { getFeaturedProducts } from '@/lib/catalog';

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <>
      <section className="hero-section">
        <StorefrontContainer className="hero-simple">
          <div className="hero-copy">
            <span className="eyebrow">Bienvenido</span>
            <h1>Encuentra lo que necesitas, sin complicaciones.</h1>
            <p className="hero-text">
              Explora nuestro catálogo, agrega productos al carrito y completa tu
              compra en minutos.
            </p>

            <div className="hero-actions">
              <Link href="/catalog" className="btn-primary">
                Ver catálogo
              </Link>
              <Link href="/cart" className="btn-secondary">
                Mi carrito
              </Link>
            </div>
          </div>
        </StorefrontContainer>
      </section>

      <StorefrontContainer className="section-stack">
        {featuredProducts.length > 0 ? (
          <section className="section-shell">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Productos destacados</span>
                <h2>Lo más reciente del catálogo</h2>
              </div>
              <Link href="/catalog" className="section-link">
                Ver todo el catálogo
              </Link>
            </div>

            <div className="product-grid">
              {featuredProducts.map(product => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          </section>
        ) : (
          <section className="section-shell">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Catálogo</span>
                <h2>El catálogo está cargando</h2>
              </div>
            </div>
            <div className="empty-state" style={{ border: 'none', boxShadow: 'none', background: 'transparent' }}>
              <p>Asegúrate de que la API esté disponible o visita directamente el catálogo.</p>
              <div className="hero-actions" style={{ justifyContent: 'center' }}>
                <Link href="/catalog" className="btn-primary">Ir al catálogo</Link>
              </div>
            </div>
          </section>
        )}

        <section className="info-grid">
          <article className="info-card">
            <span className="eyebrow">Catálogo</span>
            <h3>Productos disponibles</h3>
            <p>
              Explora nuestro catálogo completo y filtra por categoría o marca para
              encontrar exactamente lo que buscas.
            </p>
            <Link href="/catalog" className="card-link" style={{ marginTop: '1rem', display: 'inline-flex' }}>
              Ver catálogo
            </Link>
          </article>

          <article className="info-card">
            <span className="eyebrow">Carrito</span>
            <h3>Compra fácil y rápida</h3>
            <p>
              Agrega productos, ajusta cantidades y procede al checkout en pocos
              pasos. Sin registro obligatorio.
            </p>
            <Link href="/cart" className="card-link" style={{ marginTop: '1rem', display: 'inline-flex' }}>
              Ver carrito
            </Link>
          </article>

          <article className="info-card">
            <span className="eyebrow">Pago</span>
            <h3>Métodos de pago flexibles</h3>
            <p>
              Paga en línea o elige contra entrega. Recibirás confirmación de tu
              pedido por correo electrónico.
            </p>
          </article>
        </section>
      </StorefrontContainer>
    </>
  );
}
