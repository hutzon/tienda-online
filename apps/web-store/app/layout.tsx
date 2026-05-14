import type { Metadata } from 'next';
import { PublicFooter } from '@/components/storefront/PublicFooter';
import { PublicHeader } from '@/components/storefront/PublicHeader';
import { CartProvider } from '@/lib/cart/CartContext';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'TiendaOnline',
    template: '%s | TiendaOnline',
  },
  description: 'Catálogo, carrito y checkout en línea.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <CartProvider>
          <div className="site-frame">
            <PublicHeader />
            <main className="site-main">{children}</main>
            <PublicFooter />
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
