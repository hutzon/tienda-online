import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TiendaOnline | Admin",
  description: "Base técnica inicial del panel administrativo de TiendaOnline."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
