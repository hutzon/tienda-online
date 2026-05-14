'use client';

import { FileTextIcon } from '@/components/admin/Icons';

export default function BillingPage() {
  return (
    <div className="page-placeholder">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <FileTextIcon style={{ width: '2rem', height: '2rem', color: '#6366f1' }} />
        <h2>Facturación</h2>
      </div>

      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        La gestión centralizada de facturas se habilitará en una próxima versión.
        Mientras tanto, las facturas se emiten desde la vista de Pedidos.
      </p>

      <div className="card-grid">
        <div className="info-card">
          <dt>Proveedor FEL</dt>
          <dd>Mock FEL/SAT (Desarrollo)</dd>
        </div>
        <div className="info-card">
          <dt>Emisión</dt>
          <dd>Disponible por pedido individual</dd>
        </div>
        <div className="info-card">
          <dt>Estado</dt>
          <dd>Módulo en construcción</dd>
        </div>
      </div>
    </div>
  );
}
