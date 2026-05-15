import Link from 'next/link';
import { StorefrontContainer } from '@/components/storefront/StorefrontContainer';

export const metadata = {
  title: 'Mi cuenta',
};

export default function AccountPage() {
  return (
    <StorefrontContainer className="section-stack" style={{ paddingTop: '2rem' }}>
      <section className="section-shell">
        <div style={{ maxWidth: '520px' }}>
          <span className="eyebrow">Mi cuenta</span>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', marginBottom: '1rem' }}>
            Área de clientes
          </h1>
          <p className="section-copy">
            Próximamente podrás iniciar sesión, revisar tus pedidos, gestionar
            tus direcciones y controlar tu perfil desde aquí.
          </p>

          <div className="hero-actions" style={{ marginTop: '1.5rem' }}>
            <Link href="/catalog" className="btn-primary">
              Explorar catálogo
            </Link>
            <Link href="/cart" className="btn-secondary">
              Ver carrito
            </Link>
          </div>
        </div>

        <div className="info-grid" style={{ marginTop: '2rem' }}>
          <article className="info-card">
            <span className="eyebrow">Próximamente</span>
            <h3>Mis pedidos</h3>
            <p>
              Consulta el historial de tus compras, seguimiento de envíos y
              estado de facturación en un solo lugar.
            </p>
          </article>
          <article className="info-card">
            <span className="eyebrow">Próximamente</span>
            <h3>Mis datos</h3>
            <p>
              Administra tu nombre, correo y direcciones de entrega para
              un checkout más rápido en futuras compras.
            </p>
          </article>
          <article className="info-card">
            <span className="eyebrow">Próximamente</span>
            <h3>Seguridad</h3>
            <p>
              Contraseña, métodos de acceso y preferencias de notificación
              desde un panel dedicado a tu seguridad.
            </p>
          </article>
        </div>
      </section>
    </StorefrontContainer>
  );
}
