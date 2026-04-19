import PlaceholderPage from '@/components/admin/PlaceholderPage';

export const metadata = { title: 'Clientes | TiendaOnline Admin' };

export default function CustomersPage() {
  return (
    <PlaceholderPage
      title="Clientes"
      description="Registro de clientes, historial de compras y datos de contacto."
      module="Customers"
    />
  );
}
