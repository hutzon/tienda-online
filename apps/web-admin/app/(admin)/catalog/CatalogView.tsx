'use client';

import { useState, useEffect, useRef } from 'react';
import {
  fetchAdminProducts,
  createAdminProduct,
  AdminCatalogProductSummary,
  UpsertProductRequest,
  ProductImageDto,
  fetchProductImages,
  uploadProductImage,
  setPrimaryProductImage,
  deleteProductImage,
} from '@/lib/api/commerce';

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

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [images, setImages] = useState<ProductImageDto[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        name: '', sku: '', categoryName: '', summary: '', description: '',
        price: 0, isPublished: true, stockOnHand: 0,
      });
      loadProducts();
    } catch (err: any) {
      alert(err.message || 'Error al crear producto');
    }
  };

  const loadImages = async (productId: string) => {
    setImagesLoading(true);
    setUploadError(null);
    try {
      const data = await fetchProductImages(productId);
      setImages(data);
    } catch {
      setImages([]);
    } finally {
      setImagesLoading(false);
    }
  };

  const handleSelectProduct = (productId: string) => {
    if (selectedProductId === productId) {
      setSelectedProductId(null);
      setImages([]);
    } else {
      setSelectedProductId(productId);
      loadImages(productId);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProductId) return;

    setUploading(true);
    setUploadError(null);
    try {
      await uploadProductImage(selectedProductId, file);
      await loadImages(selectedProductId);
      await loadProducts();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setUploadError(err.message || 'Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    if (!selectedProductId) return;
    try {
      await setPrimaryProductImage(selectedProductId, imageId);
      await loadImages(selectedProductId);
      await loadProducts();
    } catch (err: any) {
      alert(err.message || 'Error al establecer imagen principal');
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!selectedProductId) return;
    if (!confirm('¿Eliminar esta imagen?')) return;
    try {
      await deleteProductImage(selectedProductId, imageId);
      await loadImages(selectedProductId);
      await loadProducts();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar imagen');
    }
  };

  if (loading && products.length === 0) return <div className="status-loading">Cargando catálogo...</div>;
  if (error) return <div className="status-error">{error}</div>;

  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Catálogo de Productos</h2>
        <button className="btn-ghost" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Crear Producto'}
        </button>
      </div>

      {showForm && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <h3>Nuevo Producto</h3>
          <div className="admin-form-row">
            <div className="form-field">
              <label>Nombre</label>
              <input type="text" placeholder="Nombre del producto" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="form-field">
              <label>SKU</label>
              <input type="text" placeholder="WS-PRODUCT-001" required value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="form-field">
              <label>Categoría</label>
              <input type="text" placeholder="Workspace / Mobility…" required value={formData.categoryName} onChange={e => setFormData({ ...formData, categoryName: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Resumen</label>
              <input type="text" placeholder="Descripción corta" required value={formData.summary} onChange={e => setFormData({ ...formData, summary: e.target.value })} />
            </div>
          </div>
          <div className="form-field">
            <label>Descripción</label>
            <textarea placeholder="Descripción completa" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div className="admin-form-row">
            <div className="form-field">
              <label>Precio (GTQ)</label>
              <input type="number" placeholder="0.00" required min="1" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} />
            </div>
            <div className="form-field">
              <label>Stock Inicial</label>
              <input type="number" placeholder="0" required min="0" value={formData.stockOnHand} onChange={e => setFormData({ ...formData, stockOnHand: parseInt(e.target.value) })} />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">Guardar Producto</button>
          </div>
        </form>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Estado</th>
            <th>Imágenes</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <>
              <tr
                key={p.id}
                style={{
                  cursor: 'pointer',
                  background: selectedProductId === p.id ? 'var(--color-surface2)' : undefined,
                }}
                onClick={() => handleSelectProduct(p.id)}
              >
                <td className="mono">{p.sku}</td>
                <td>{p.name}</td>
                <td>{p.categoryName}</td>
                <td>{p.currency} {p.price.toFixed(2)}</td>
                <td>{p.stockOnHand}</td>
                <td>{p.isPublished ? 'Público' : 'Oculto'}</td>
                <td>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                    color: p.imageCount > 0 ? 'var(--color-accent)' : 'var(--color-muted)',
                    fontSize: '0.85rem',
                  }}>
                    {p.imageCount > 0 ? `${p.imageCount} foto${p.imageCount !== 1 ? 's' : ''}` : 'Sin imágenes'}
                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                      {selectedProductId === p.id ? '▲' : '▼'}
                    </span>
                  </span>
                </td>
              </tr>

              {selectedProductId === p.id && (
                <tr key={`${p.id}-images`}>
                  <td colSpan={7} style={{ padding: 0 }}>
                    <div style={{
                      background: 'var(--color-surface2)',
                      borderTop: '1px solid var(--color-border)',
                      borderBottom: '1px solid var(--color-border)',
                      padding: '1.5rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h4 style={{ margin: 0, color: 'var(--color-text)', fontSize: '0.95rem' }}>
                          Imágenes — {p.name}
                        </h4>
                        <label style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                          padding: '0.4rem 0.9rem',
                          background: uploading ? 'var(--color-surface)' : 'var(--color-accent-bg)',
                          color: uploading ? 'var(--color-muted)' : 'var(--color-accent)',
                          border: '1px solid var(--color-accent)',
                          borderRadius: 'var(--radius)',
                          cursor: uploading ? 'wait' : 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                        }}>
                          {uploading ? 'Subiendo…' : '+ Subir imagen'}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp"
                            style={{ display: 'none' }}
                            disabled={uploading}
                            onChange={handleFileChange}
                          />
                        </label>
                      </div>

                      {uploadError && (
                        <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                          {uploadError}
                        </div>
                      )}

                      {imagesLoading ? (
                        <div style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>Cargando imágenes…</div>
                      ) : images.length === 0 ? (
                        <div style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>
                          Sin imágenes. Sube la primera con el botón de arriba.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                          {images.map(img => (
                            <div key={img.id} style={{
                              position: 'relative',
                              width: 140,
                              background: 'var(--color-surface)',
                              border: img.isPrimary
                                ? '2px solid var(--color-accent)'
                                : '1px solid var(--color-border)',
                              borderRadius: 'var(--radius)',
                              overflow: 'hidden',
                            }}>
                              <img
                                src={img.imageUrl}
                                alt={img.altText}
                                style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }}
                                onError={e => {
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="140" height="100" fill="%23334155"%3E%3Crect width="140" height="100"/%3E%3Ctext x="50%25" y="50%25" font-size="11" fill="%2394a3b8" text-anchor="middle" dy=".3em"%3EError%3C/text%3E%3C/svg%3E';
                                }}
                              />
                              {img.isPrimary && (
                                <div style={{
                                  position: 'absolute', top: 4, left: 4,
                                  background: 'var(--color-accent)',
                                  color: '#000', fontSize: '0.65rem', fontWeight: 700,
                                  padding: '1px 6px', borderRadius: 4,
                                }}>
                                  Principal
                                </div>
                              )}
                              <div style={{
                                display: 'flex', gap: '0.25rem',
                                padding: '0.4rem 0.5rem',
                                justifyContent: 'center',
                              }}>
                                {!img.isPrimary && (
                                  <button
                                    onClick={() => handleSetPrimary(img.id)}
                                    style={{
                                      flex: 1, fontSize: '0.7rem', padding: '3px 6px',
                                      background: 'transparent',
                                      border: '1px solid var(--color-accent)',
                                      color: 'var(--color-accent)',
                                      borderRadius: 4, cursor: 'pointer',
                                    }}
                                  >
                                    Principal
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteImage(img.id)}
                                  style={{
                                    flex: 1, fontSize: '0.7rem', padding: '3px 6px',
                                    background: 'transparent',
                                    border: '1px solid var(--color-danger)',
                                    color: 'var(--color-danger)',
                                    borderRadius: 4, cursor: 'pointer',
                                  }}
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                        Formatos permitidos: JPG, PNG, WebP · Máximo 5 MB por imagen
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
          {products.length === 0 && (
            <tr className="empty-row"><td colSpan={7}>No hay productos.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
