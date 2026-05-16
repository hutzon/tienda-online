'use client';

import { useState, useEffect } from 'react';
import { fetchAdminOrders, emitInvoice, OrderResponse } from '@/lib/api/commerce';

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Confirmed:      { bg: '#e8f5e9', color: '#2e7d32' },
  PendingPayment: { bg: '#fff3e0', color: '#e65100' },
  Cancelled:      { bg: '#ffebee', color: '#c62828' },
};

const PAYMENT_COLORS: Record<string, { bg: string; color: string }> = {
  Paid:    { bg: '#e8f5e9', color: '#2e7d32' },
  Failed:  { bg: '#ffebee', color: '#c62828' },
  Pending: { bg: '#fff3e0', color: '#e65100' },
};

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Error desconocido';
}

export default function OrdersView() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await fetchAdminOrders();
      setOrders(data);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmitInvoice = async (orderId: string) => {
    try {
      setLoading(true);
      await emitInvoice(orderId);
      await loadOrders();
    } catch (err) {
      alert(`Error emitiendo factura: ${errMsg(err)}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  if (loading && orders.length === 0) return <div>Cargando pedidos...</div>;
  if (error) return (
    <div>
      <p style={{ color: 'red', marginBottom: '0.5rem' }}>{error}</p>
      <button onClick={loadOrders} style={{ padding: '0.4rem 0.8rem', cursor: 'pointer' }}>Reintentar</button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>Gestión de Pedidos</h2>
        <button
          onClick={loadOrders}
          disabled={loading}
          style={{ padding: '0.4rem 0.9rem', fontSize: '0.875rem', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
        >
          {loading ? 'Actualizando…' : 'Actualizar'}
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '0.5rem 0.25rem' }}>Fecha</th>
            <th style={{ padding: '0.5rem 0.25rem' }}>No. Orden</th>
            <th style={{ padding: '0.5rem 0.25rem' }}>Estado</th>
            <th style={{ padding: '0.5rem 0.25rem' }}>Cliente</th>
            <th style={{ padding: '0.5rem 0.25rem' }}>Contacto</th>
            <th style={{ padding: '0.5rem 0.25rem' }}>Total</th>
            <th style={{ padding: '0.5rem 0.25rem' }}>Items</th>
            <th style={{ padding: '0.5rem 0.25rem' }}>Método Pago</th>
            <th style={{ padding: '0.5rem 0.25rem' }}>Estado Pago</th>
            <th style={{ padding: '0.5rem 0.25rem' }}>Facturación</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => {
            const lastPayment = order.paymentAttempts && order.paymentAttempts.length > 0
              ? order.paymentAttempts[0]
              : null;
            const statusStyle = STATUS_COLORS[order.status] ?? { bg: '#eee', color: '#555' };
            const payStyle = lastPayment ? (PAYMENT_COLORS[lastPayment.status] ?? { bg: '#eee', color: '#555' }) : null;

            return (
              <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.5rem 0.25rem', whiteSpace: 'nowrap' }}>
                  {new Date(order.createdAt).toLocaleDateString('es-GT')}
                </td>
                <td style={{ padding: '0.5rem 0.25rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {order.orderNumber}
                </td>
                <td style={{ padding: '0.5rem 0.25rem' }}>
                  <span style={{ padding: '0.2rem 0.5rem', background: statusStyle.bg, color: statusStyle.color, borderRadius: '4px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {order.status}
                  </span>
                </td>
                <td style={{ padding: '0.5rem 0.25rem' }}>
                  {order.customerName || <span style={{ color: '#aaa', fontStyle: 'italic' }}>Sin nombre</span>}
                </td>
                <td style={{ padding: '0.5rem 0.25rem', fontSize: '0.85rem' }}>
                  {order.customerEmail || '—'}<br />
                  {order.phone || '—'}
                </td>
                <td style={{ padding: '0.5rem 0.25rem', whiteSpace: 'nowrap' }}>
                  {order.currency} {order.total.toFixed(2)}
                </td>
                <td style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>{order.items.length}</td>
                <td style={{ padding: '0.5rem 0.25rem', fontSize: '0.85rem' }}>
                  {lastPayment ? lastPayment.paymentMethod : '—'}
                </td>
                <td style={{ padding: '0.5rem 0.25rem' }}>
                  {payStyle ? (
                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', background: payStyle.bg, color: payStyle.color, whiteSpace: 'nowrap' }}>
                      {lastPayment!.status}
                    </span>
                  ) : '—'}
                </td>
                <td style={{ padding: '0.5rem 0.25rem' }}>
                  {order.invoices && order.invoices.length > 0 ? (
                    <div style={{ fontSize: '0.85rem' }}>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        background: order.invoices[0].status === 'Emitted' ? '#e3f2fd' : '#fff3e0',
                        color: order.invoices[0].status === 'Emitted' ? '#1565c0' : '#e65100',
                        display: 'inline-block',
                        marginBottom: '0.25rem',
                        fontSize: '0.8rem',
                      }}>
                        {order.invoices[0].status}
                      </span>
                      {order.invoices[0].uuid && (
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                          UUID: {order.invoices[0].uuid.substring(0, 8)}…
                        </div>
                      )}
                    </div>
                  ) : (
                    order.status === 'Confirmed' ? (
                      <button
                        onClick={() => handleEmitInvoice(order.id)}
                        disabled={loading}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
                      >
                        Emitir Factura
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#aaa' }}>—</span>
                    )
                  )}
                </td>
              </tr>
            );
          })}
          {orders.length === 0 && (
            <tr>
              <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                No hay pedidos confirmados aún.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
