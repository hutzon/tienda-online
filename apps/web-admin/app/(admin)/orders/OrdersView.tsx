'use client';

import { useState, useEffect } from 'react';
import {
  fetchAdminOrders,
  emitInvoice,
  fetchOrderTracking,
  addOrderTrackingEvent,
  OrderResponse,
  OrderTrackingEventResponse,
} from '@/lib/api/commerce';

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

const TRACKING_STATUSES = [
  { value: 'OrderReceived', label: 'Pedido recibido' },
  { value: 'Preparing',     label: 'Preparando' },
  { value: 'Packed',        label: 'Empacado' },
  { value: 'InTransit',     label: 'En camino' },
  { value: 'Delivered',     label: 'Entregado' },
  { value: 'Cancelled',     label: 'Cancelado' },
];

const TRACKING_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  TRACKING_STATUSES.map(s => [s.value, s.label]),
);

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Error desconocido';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-GT', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function OrdersView() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tracking panel state
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [trackingCache, setTrackingCache] = useState<Record<string, OrderTrackingEventResponse[]>>({});
  const [trackingLoading, setTrackingLoading] = useState<string | null>(null);
  const [trackingFormStatus, setTrackingFormStatus] = useState('OrderReceived');
  const [trackingFormComment, setTrackingFormComment] = useState('');
  const [trackingFormSubmitting, setTrackingFormSubmitting] = useState(false);

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

  const toggleTracking = async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    setTrackingFormStatus('OrderReceived');
    setTrackingFormComment('');
    if (!trackingCache[orderId]) {
      setTrackingLoading(orderId);
      try {
        const events = await fetchOrderTracking(orderId);
        setTrackingCache(prev => ({ ...prev, [orderId]: events }));
      } catch (err) {
        alert(`Error cargando seguimiento: ${errMsg(err)}`);
      } finally {
        setTrackingLoading(null);
      }
    }
  };

  const handleAddTrackingEvent = async (orderId: string) => {
    setTrackingFormSubmitting(true);
    try {
      const event = await addOrderTrackingEvent(orderId, trackingFormStatus, trackingFormComment || undefined, 'Admin');
      setTrackingCache(prev => ({
        ...prev,
        [orderId]: [event, ...(prev[orderId] ?? [])],
      }));
      setTrackingFormComment('');
    } catch (err) {
      alert(`Error registrando evento: ${errMsg(err)}`);
    } finally {
      setTrackingFormSubmitting(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const onFocus = () => loadOrders();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  if (loading && orders.length === 0) return <div>Cargando pedidos...</div>;
  if (error) return (
    <div>
      <p style={{ color: 'red', marginBottom: '0.5rem' }}>{error}</p>
      <button onClick={loadOrders} style={{ padding: '0.4rem 0.8rem', cursor: 'pointer' }}>Reintentar</button>
    </div>
  );

  const COL_COUNT = 11;

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
            <th style={{ padding: '0.5rem 0.25rem' }}>Seguimiento</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => {
            const lastPayment = order.paymentAttempts && order.paymentAttempts.length > 0
              ? order.paymentAttempts[0]
              : null;
            const statusStyle = STATUS_COLORS[order.status] ?? { bg: '#eee', color: '#555' };
            const payStyle = lastPayment ? (PAYMENT_COLORS[lastPayment.status] ?? { bg: '#eee', color: '#555' }) : null;
            const isExpanded = expandedOrderId === order.id;
            const events = trackingCache[order.id] ?? [];

            return (
              <>
                <tr key={order.id} style={{ borderBottom: isExpanded ? 'none' : '1px solid #eee' }}>
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
                  <td style={{ padding: '0.5rem 0.25rem' }}>
                    <button
                      onClick={() => toggleTracking(order.id)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.8rem',
                        background: isExpanded ? '#e3f2fd' : '#f5f5f5',
                        color: isExpanded ? '#1565c0' : '#333',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isExpanded ? '▲ Ocultar' : '▼ Seguimiento'}
                    </button>
                  </td>
                </tr>

                {isExpanded && (
                  <tr key={`${order.id}-tracking`} style={{ borderBottom: '1px solid #eee', background: '#fafafa' }}>
                    <td colSpan={COL_COUNT} style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>

                        {/* History */}
                        <div style={{ flex: 1, minWidth: '260px' }}>
                          <p style={{ margin: '0 0 0.75rem', fontWeight: 600, fontSize: '0.875rem' }}>
                            Historial de seguimiento
                          </p>
                          {trackingLoading === order.id ? (
                            <p style={{ color: '#999', fontSize: '0.83rem' }}>Cargando…</p>
                          ) : events.length === 0 ? (
                            <p style={{ color: '#aaa', fontSize: '0.83rem', fontStyle: 'italic' }}>
                              Sin eventos registrados.
                            </p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {events.map(event => (
                                <div key={event.id} style={{
                                  padding: '0.5rem 0.75rem',
                                  background: '#fff',
                                  border: '1px solid #e0e0e0',
                                  borderRadius: '6px',
                                  fontSize: '0.83rem',
                                }}>
                                  <span style={{ fontWeight: 600 }}>
                                    {TRACKING_STATUS_LABELS[event.status] ?? event.status}
                                  </span>
                                  <span style={{ color: '#999', marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                                    {formatDate(event.createdAt)}
                                  </span>
                                  {event.createdBy && (
                                    <span style={{ color: '#999', marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                                      · {event.createdBy}
                                    </span>
                                  )}
                                  {event.comment && (
                                    <p style={{ margin: '0.25rem 0 0', color: '#555', fontStyle: 'italic' }}>
                                      {event.comment}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Add event form */}
                        <div style={{ minWidth: '260px' }}>
                          <p style={{ margin: '0 0 0.75rem', fontWeight: 600, fontSize: '0.875rem' }}>
                            Registrar nuevo evento
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <select
                              value={trackingFormStatus}
                              onChange={e => setTrackingFormStatus(e.target.value)}
                              disabled={trackingFormSubmitting}
                              style={{ padding: '0.4rem 0.5rem', fontSize: '0.875rem', borderRadius: '4px', border: '1px solid #ccc' }}
                            >
                              {TRACKING_STATUSES.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                              ))}
                            </select>
                            <textarea
                              placeholder="Comentario (opcional)"
                              value={trackingFormComment}
                              onChange={e => setTrackingFormComment(e.target.value)}
                              disabled={trackingFormSubmitting}
                              rows={2}
                              style={{ padding: '0.4rem 0.5rem', fontSize: '0.875rem', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
                            />
                            <button
                              onClick={() => handleAddTrackingEvent(order.id)}
                              disabled={trackingFormSubmitting}
                              style={{
                                padding: '0.4rem 0.8rem',
                                fontSize: '0.875rem',
                                background: '#1565c0',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: trackingFormSubmitting ? 'wait' : 'pointer',
                                opacity: trackingFormSubmitting ? 0.6 : 1,
                                alignSelf: 'flex-start',
                              }}
                            >
                              {trackingFormSubmitting ? 'Guardando…' : 'Registrar'}
                            </button>
                          </div>
                        </div>

                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
          {orders.length === 0 && (
            <tr>
              <td colSpan={COL_COUNT} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                No hay pedidos confirmados aún.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
