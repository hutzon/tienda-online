import { StorefrontContainer } from '@/components/storefront/StorefrontContainer';
import { CartView } from '@/components/storefront/CartView';

export const metadata = {
  title: 'Carrito',
};

export default function CartPage() {
  return (
    <StorefrontContainer className="section-stack" style={{ paddingTop: '2rem' }}>
      <section className="section-shell">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Carrito de compras</span>
            <h1>Tu selección</h1>
          </div>
        </div>
        <CartView />
      </section>
    </StorefrontContainer>
  );
}
