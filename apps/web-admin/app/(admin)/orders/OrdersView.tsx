'use client';

import { useState, useEffect } from 'react';
import { fetchAdminOrders, emitInvoice, OrderResponse } from '@/lib/api/commerce';

export default function OrdersView() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminOrders();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Error cargando pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleEmitInvoice = async (orderId: string) => {
    try {
      setLoading(true);
      await emitInvoice(orderId);
      await loadOrders(); // Recargar pedidos para ver la factura
    } catch (err: any) {
      alert(`Error emitiendo factura: ${err.message || 'Desconocido'}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  if (loading && orders.length === 0) return <div>Cargando pedidos...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <h2>Gestión de Pedidos</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th>Fecha</th>
            <th>No. Orden</th>
            <th>Estado</th>
            <th>Cliente</th>
            <th>Contacto</th>
            <th>Total</th>
            <th>Items</th>
            <th>Método Pago</th>
            <th>Estado Pago</th>
            <th>Facturación</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => {
            const lastPayment = order.paymentAttempts && order.paymentAttempts.length > 0 
              ? order.paymentAttempts[0] 
              : null;
              
            return (
              <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.5rem 0' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td>{order.orderNumber}</td>
                <td><span style={{ padding: '0.25rem 0.5rem', background: '#eee', borderRadius: '4px', fontSize: '0.85rem' }}>{order.status}</span></td>
                <td>{order.customerName}</td>
                <td style={{ fontSize: '0.85rem' }}>
                  {order.customerEmail}<br/>
                  {order.phone}
                </td>
                <td>{order.currency} {order.total.toFixed(2)}</td>
                <td>{order.items.length}</td>
                <td>{lastPayment ? lastPayment.paymentMethod : '-'}</td>
                <td>
                  {lastPayment ? (
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.85rem',
                      background: lastPayment.status === 'Paid' ? '#e8f5e9' : (lastPayment.status === 'Failed' ? '#ffebee' : '#fff3e0'),
                      color: lastPayment.status === 'Paid' ? '#2e7d32' : (lastPayment.status === 'Failed' ? '#c62828' : '#e65100')
                    }}>
                      {lastPayment.status}
                    </span>
                  ) : '-'}
                </td>
                <td>
                  {order.invoices && order.invoices.length > 0 ? (
                    <div style={{ fontSize: '0.85rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px', 
                        background: order.invoices[0].status === 'Emitted' ? '#e3f2fd' : '#fff3e0',
                        color: order.invoices[0].status === 'Emitted' ? '#1565c0' : '#e65100',
                        display: 'inline-block',
                        marginBottom: '0.25rem'
                      }}>
                        {order.invoices[0].status}
                      </span>
                      {order.invoices[0].uuid && <div style={{ fontSize: '0.75rem', color: '#666' }}>UUID: {order.invoices[0].uuid.substring(0, 8)}...</div>}
                    </div>
                  ) : (
                    order.status === 'Confirmed' ? (
                      <button 
                        onClick={() => handleEmitInvoice(order.id)} 
                        disabled={loading}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Emitir Factura
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: '#999' }}>No elegible</span>
                    )
                  )}
                </td>
              </tr>
            );
          })}
          {orders.length === 0 && (
            <tr><td colSpan={10} style={{ textAlign: 'center', padding: '1rem' }}>No hay pedidos registrados.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
