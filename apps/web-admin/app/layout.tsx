import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TiendaOnline Admin',
  description: 'Panel administrativo de TiendaOnline.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
