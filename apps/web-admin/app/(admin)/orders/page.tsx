import PlaceholderPage from '@/components/admin/PlaceholderPage';

export const metadata = { title: 'Pedidos | TiendaOnline Admin' };

export default function OrdersPage() {
  return (
    <PlaceholderPage
      title="Pedidos"
      description="Gestión de pedidos, estados, envíos y facturación."
      module="Orders"
    />
  );
}
