import PlaceholderPage from '@/components/admin/PlaceholderPage';

export const metadata = { title: 'Inventario | TiendaOnline Admin' };

export default function InventoryPage() {
  return (
    <PlaceholderPage
      title="Inventario"
      description="Control de stock, movimientos y ajustes de inventario."
      module="Inventory"
    />
  );
}
