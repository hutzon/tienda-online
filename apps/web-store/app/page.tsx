import Link from 'next/link';
import { ApiConnectionCard } from '@/components/storefront/ApiConnectionCard';
import { ProductCard } from '@/components/storefront/ProductCard';
import { StorefrontContainer } from '@/components/storefront/StorefrontContainer';
import { getFeaturedProducts } from '@/lib/catalog';

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();
  return (
    <>
      <section className="hero-section">
        <StorefrontContainer className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Storefront Base</span>
            <h1>Tienda temporal lista para crecer sin improvisación.</h1>
            <p className="hero-text">
              Esta base pública ya separa storefront y admin, expone estado de
              conexión con la API y prepara rutas claras para catálogo, producto,
              carrito y cuenta.
            </p>

            <div className="hero-actions">
              <Link href="/catalog" className="btn-primary">
                Ver catálogo base
              </Link>
              <Link href="/account" className="btn-secondary">
                Revisar cuenta placeholder
              </Link>
            </div>

            <dl className="hero-metrics">
              <div>
                <dt>Rutas públicas</dt>
                <dd>5</dd>
              </div>
              <div>
                <dt>Estado actual</dt>
                <dd>Sin lógica de negocio</dd>
              </div>
              <div>
                <dt>Integración API</dt>
                <dd>Lista para crecer</dd>
              </div>
            </dl>
          </div>

          <ApiConnectionCard />
        </StorefrontContainer>
      </section>

      <StorefrontContainer className="section-stack">
        <section className="section-shell">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Colección inicial</span>
              <h2>Productos placeholder para validar navegación y estructura</h2>
            </div>
            <Link href="/catalog" className="section-link">
              Ir al catálogo completo
            </Link>
          </div>

          <div className="product-grid">
            {featuredProducts.map(product => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </section>

        <section className="info-grid">
          <article className="info-card">
            <span className="eyebrow">Arquitectura</span>
            <h3>Storefront y admin separados</h3>
            <p>
              La tienda pública prioriza navegación, conversión y experiencia
              comercial, sin mezclar decisiones del panel administrativo.
            </p>
          </article>

          <article className="info-card">
            <span className="eyebrow">Preparación</span>
            <h3>Cliente HTTP base y manejo de errores</h3>
            <p>
              El storefront ya puede consultar `/api/v1/system/info` y degradar
              de forma limpia cuando la API no está disponible.
            </p>
          </article>

          <article className="info-card">
            <span className="eyebrow">Siguiente fase</span>
            <h3>Listo para catálogo y carrito reales</h3>
            <p>
              La base actual evita sobreingeniería, pero ya deja espacio para
              datos reales, estados de carga y checkout posterior.
            </p>
          </article>
        </section>
      </StorefrontContainer>
    </>
  );
}
