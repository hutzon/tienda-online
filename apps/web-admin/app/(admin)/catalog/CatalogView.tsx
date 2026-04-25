'use client';

import { useState, useEffect } from 'react';
import { fetchAdminProducts, createAdminProduct, AdminCatalogProductSummary, UpsertProductRequest } from '@/lib/api/commerce';

export default function CatalogView() {
  const [products, setProducts] = useState<AdminCatalogProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<UpsertProductRequest>({
    name: '',
    sku: '',
    categoryName: '',
    summary: '',
    description: '',
    price: 0,
    isPublished: true,
    stockOnHand: 0,
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminProducts();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Error cargando productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAdminProduct(formData);
      setShowForm(false);
      setFormData({
        name: '', sku: '', categoryName: '', summary: '', description: '', price: 0, isPublished: true, stockOnHand: 0
      });
      loadProducts();
    } catch (err: any) {
      alert(err.message || 'Error al crear producto');
    }
  };

  if (loading && products.length === 0) return <div>Cargando catálogo...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Catálogo de Productos</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Crear Producto'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f9f9f9', padding: '1rem', borderRadius: '8px' }}>
          <h3>Nuevo Producto Base</h3>
          <input type="text" placeholder="Nombre" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          <input type="text" placeholder="SKU" required value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
          <input type="text" placeholder="Categoría" required value={formData.categoryName} onChange={e => setFormData({ ...formData, categoryName: e.target.value })} />
          <input type="text" placeholder="Resumen" required value={formData.summary} onChange={e => setFormData({ ...formData, summary: e.target.value })} />
          <textarea placeholder="Descripción" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
          <input type="number" placeholder="Precio" required min="1" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} />
          <input type="number" placeholder="Stock Inicial" required min="0" value={formData.stockOnHand} onChange={e => setFormData({ ...formData, stockOnHand: parseInt(e.target.value) })} />
          <button type="submit" className="btn-primary">Guardar Producto</button>
        </form>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th>SKU</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.5rem 0' }}>{p.sku}</td>
              <td>{p.name}</td>
              <td>{p.categoryName}</td>
              <td>{p.currency} {p.price.toFixed(2)}</td>
              <td>{p.stockOnHand}</td>
              <td>{p.isPublished ? 'Público' : 'Oculto'}</td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '1rem' }}>No hay productos.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
