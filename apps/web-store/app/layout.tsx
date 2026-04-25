import type { Metadata } from 'next';
import { PublicFooter } from '@/components/storefront/PublicFooter';
import { PublicHeader } from '@/components/storefront/PublicHeader';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'TiendaOnline | Storefront',
    template: '%s | TiendaOnline',
  },
  description: 'Base pública inicial del storefront de TiendaOnline.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <div className="site-frame">
          <PublicHeader />
          <main className="site-main">{children}</main>
          <PublicFooter />
        </div>
      </body>
    </html>
  );
}
