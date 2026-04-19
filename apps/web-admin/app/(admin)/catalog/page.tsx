import PlaceholderPage from '@/components/admin/PlaceholderPage';

export const metadata = { title: 'Catálogo | TiendaOnline Admin' };

export default function CatalogPage() {
  return (
    <PlaceholderPage
      title="Catálogo de productos"
      description="Gestión de productos, categorías, variantes y precios."
      module="Catalog"
    />
  );
}
