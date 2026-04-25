'use client';

import { useState, useEffect } from 'react';
import { fetchAdminInventory, updateAdminStock, AdminInventoryProductRow } from '@/lib/api/commerce';

export default function InventoryView() {
  const [inventory, setInventory] = useState<AdminInventoryProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminInventory();
      setInventory(data);
    } catch (err: any) {
      setError(err.message || 'Error cargando inventario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleEditClick = (product: AdminInventoryProductRow) => {
    setEditingId(product.id);
    setEditStock(product.stockOnHand);
  };

  const handleSaveStock = async (id: string) => {
    try {
      setSaving(true);
      await updateAdminStock(id, editStock);
      setEditingId(null);
      loadInventory();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar stock');
    } finally {
      setSaving(false);
    }
  };

  if (loading && inventory.length === 0) return <div>Cargando inventario...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <h2>Gestión de Inventario (Stock Base)</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th>SKU</th>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Stock Actual</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map(p => (
            <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.5rem 0' }}>{p.sku}</td>
              <td>{p.name} {p.isPublished ? '' : '(Oculto)'}</td>
              <td>{p.categoryName}</td>
              <td>
                {editingId === p.id ? (
                  <input 
                    type="number" 
                    value={editStock} 
                    onChange={e => setEditStock(parseInt(e.target.value))} 
                    min="0"
                    style={{ width: '80px', padding: '4px' }}
                  />
                ) : (
                  <span>{p.stockOnHand}</span>
                )}
              </td>
              <td>
                {editingId === p.id ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleSaveStock(p.id)} disabled={saving} style={{ color: 'green' }}>
                      {saving ? '...' : 'Guardar'}
                    </button>
                    <button onClick={() => setEditingId(null)} disabled={saving} style={{ color: 'red' }}>
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button onClick={() => handleEditClick(p)} style={{ color: 'blue', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Ajustar Stock
                  </button>
                )}
              </td>
            </tr>
          ))}
          {inventory.length === 0 && (
            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '1rem' }}>No hay productos en inventario.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
