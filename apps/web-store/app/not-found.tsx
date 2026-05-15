import Link from 'next/link';
import { StorefrontContainer } from '@/components/storefront/StorefrontContainer';

export default function NotFound() {
  return (
    <StorefrontContainer className="section-stack" style={{ paddingTop: '2rem' }}>
      <section className="empty-state">
        <div className="empty-state-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <h2>Página no encontrada</h2>
        <p>La dirección que buscas no existe o fue movida. Usa el menú para navegar.</p>
        <div className="hero-actions" style={{ justifyContent: 'center' }}>
          <Link href="/" className="btn-primary">
            Volver al inicio
          </Link>
          <Link href="/catalog" className="btn-secondary">
            Ver catálogo
          </Link>
        </div>
      </section>
    </StorefrontContainer>
  );
}
