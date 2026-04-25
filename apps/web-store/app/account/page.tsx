import { ApiConnectionCard } from '@/components/storefront/ApiConnectionCard';
import { StorefrontContainer } from '@/components/storefront/StorefrontContainer';

export const metadata = {
  title: 'Cuenta',
};

export default function AccountPage() {
  return (
    <StorefrontContainer className="section-stack">
      <section className="section-shell two-column-layout">
        <div>
          <span className="eyebrow">Cuenta placeholder</span>
          <h1>Acceso y perfil del cliente aún no implementados</h1>
          <p className="section-copy">
            Esta ruta queda reservada para login, registro, perfil, direcciones y
            seguimiento de compras del cliente.
          </p>

          <div className="info-grid">
            <article className="info-card">
              <h3>Auth futura</h3>
              <p>
                Se integrará más adelante con el backend real de clientes, sin
                mezclarla con la autenticación administrativa.
              </p>
            </article>
            <article className="info-card">
              <h3>Direcciones</h3>
              <p>
                La estructura de navegación ya contempla una cuenta capaz de manejar
                direcciones exactas y datos de contacto verificados.
              </p>
            </article>
          </div>
        </div>

        <ApiConnectionCard />
      </section>
    </StorefrontContainer>
  );
}
