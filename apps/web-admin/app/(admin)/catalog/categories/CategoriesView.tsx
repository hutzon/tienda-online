'use client';

import { useState, useEffect } from 'react';
import {
  CategoryDto, BrandDto,
  fetchAdminCategories, createAdminCategory, updateAdminCategory, deleteAdminCategory,
  fetchAdminBrands, createAdminBrand, updateAdminBrand, deleteAdminBrand,
} from '@/lib/api/commerce';

export default function CategoriesView() {
  const [tab, setTab] = useState<'categories' | 'brands'>('categories');

  // ── Categories ──────────────────────────────────────────────────────────
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catNewName, setCatNewName] = useState('');
  const [catEditing, setCatEditing] = useState<string | null>(null);
  const [catEditName, setCatEditName] = useState('');

  const loadCategories = async () => {
    setCatLoading(true);
    try { setCategories(await fetchAdminCategories()); } catch { setCategories([]); } finally { setCatLoading(false); }
  };
  useEffect(() => { loadCategories(); }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNewName.trim()) return;
    try { await createAdminCategory(catNewName.trim()); setCatNewName(''); loadCategories(); }
    catch (err: any) { alert(err.message || 'Error al crear categoría'); }
  };

  const handleUpdateCategory = async (id: string) => {
    if (!catEditName.trim()) return;
    try { await updateAdminCategory(id, catEditName.trim()); setCatEditing(null); loadCategories(); }
    catch (err: any) { alert(err.message || 'Error al actualizar'); }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la categoría "${name}"? Solo es posible si no tiene productos.`)) return;
    try { await deleteAdminCategory(id); loadCategories(); }
    catch (err: any) { alert(err.message || 'Error al eliminar'); }
  };

  // ── Brands ──────────────────────────────────────────────────────────────
  const [brands, setBrands] = useState<BrandDto[]>([]);
  const [brandLoading, setBrandLoading] = useState(true);
  const [brandNewName, setBrandNewName] = useState('');
  const [brandNewDesc, setBrandNewDesc] = useState('');
  const [brandEditing, setBrandEditing] = useState<string | null>(null);
  const [brandEditName, setBrandEditName] = useState('');
  const [brandEditDesc, setBrandEditDesc] = useState('');

  const loadBrands = async () => {
    setBrandLoading(true);
    try { setBrands(await fetchAdminBrands()); } catch { setBrands([]); } finally { setBrandLoading(false); }
  };
  useEffect(() => { loadBrands(); }, []);

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandNewName.trim()) return;
    try { await createAdminBrand(brandNewName.trim(), brandNewDesc.trim() || undefined); setBrandNewName(''); setBrandNewDesc(''); loadBrands(); }
    catch (err: any) { alert(err.message || 'Error al crear marca'); }
  };

  const handleUpdateBrand = async (id: string) => {
    if (!brandEditName.trim()) return;
    try { await updateAdminBrand(id, brandEditName.trim(), brandEditDesc.trim() || undefined); setBrandEditing(null); loadBrands(); }
    catch (err: any) { alert(err.message || 'Error al actualizar'); }
  };

  const handleDeleteBrand = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la marca "${name}"? Solo es posible si no tiene productos.`)) return;
    try { await deleteAdminBrand(id); loadBrands(); }
    catch (err: any) { alert(err.message || 'Error al eliminar'); }
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '0.5rem 1.25rem', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontWeight: 600, fontSize: '0.9rem',
    background: active ? 'var(--color-accent)' : 'transparent',
    color: active ? '#000' : 'var(--color-muted)',
    transition: 'background 0.15s, color 0.15s',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h2>Gestión de Catálogo</h2>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
        <button style={tabStyle(tab === 'categories')} onClick={() => setTab('categories')}>Categorías</button>
        <button style={tabStyle(tab === 'brands')} onClick={() => setTab('brands')}>Marcas</button>
      </div>

      {/* ── Categories Tab ─────────────────────────────────────────────────── */}
      {tab === 'categories' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div className="form-field" style={{ margin: 0, flex: 1, maxWidth: 320 }}>
              <label>Nueva categoría</label>
              <input type="text" placeholder="Ej: Electrónica" value={catNewName} onChange={e => setCatNewName(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>+ Agregar</button>
          </form>

          {catLoading ? (
            <div className="status-loading">Cargando categorías...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Nombre</th><th>Slug</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat.id}>
                    <td>
                      {catEditing === cat.id ? (
                        <input type="text" value={catEditName} onChange={e => setCatEditName(e.target.value)} style={{ width: '100%' }} autoFocus />
                      ) : cat.name}
                    </td>
                    <td className="mono">{cat.slug}</td>
                    <td>
                      {catEditing === cat.id ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-primary" onClick={() => handleUpdateCategory(cat.id)} style={{ fontSize: '0.8rem', padding: '4px 12px' }}>Guardar</button>
                          <button className="btn-ghost" onClick={() => setCatEditing(null)} style={{ fontSize: '0.8rem', padding: '4px 12px' }}>Cancelar</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-ghost" onClick={() => { setCatEditing(cat.id); setCatEditName(cat.name); }} style={{ fontSize: '0.8rem', padding: '4px 12px' }}>Editar</button>
                          <button onClick={() => handleDeleteCategory(cat.id, cat.name)} style={{ fontSize: '0.8rem', padding: '4px 12px', background: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', borderRadius: 6, cursor: 'pointer' }}>Eliminar</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && <tr className="empty-row"><td colSpan={3}>Sin categorías. Agrega la primera.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Brands Tab ─────────────────────────────────────────────────────── */}
      {tab === 'brands' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <form onSubmit={handleCreateBrand} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-field" style={{ margin: 0, flex: 1, minWidth: 180 }}>
              <label>Nombre de marca</label>
              <input type="text" placeholder="Ej: TechBrand" value={brandNewName} onChange={e => setBrandNewName(e.target.value)} />
            </div>
            <div className="form-field" style={{ margin: 0, flex: 2, minWidth: 220 }}>
              <label>Descripción (opcional)</label>
              <input type="text" placeholder="Descripción breve" value={brandNewDesc} onChange={e => setBrandNewDesc(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>+ Agregar</button>
          </form>

          {brandLoading ? (
            <div className="status-loading">Cargando marcas...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Nombre</th><th>Descripción</th><th>Slug</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {brands.map(brand => (
                  <tr key={brand.id}>
                    <td>
                      {brandEditing === brand.id ? (
                        <input type="text" value={brandEditName} onChange={e => setBrandEditName(e.target.value)} style={{ width: '100%' }} autoFocus />
                      ) : brand.name}
                    </td>
                    <td>
                      {brandEditing === brand.id ? (
                        <input type="text" value={brandEditDesc} onChange={e => setBrandEditDesc(e.target.value)} style={{ width: '100%' }} />
                      ) : (brand.description || <span style={{ color: 'var(--color-muted)' }}>—</span>)}
                    </td>
                    <td className="mono">{brand.slug}</td>
                    <td>
                      {brandEditing === brand.id ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-primary" onClick={() => handleUpdateBrand(brand.id)} style={{ fontSize: '0.8rem', padding: '4px 12px' }}>Guardar</button>
                          <button className="btn-ghost" onClick={() => setBrandEditing(null)} style={{ fontSize: '0.8rem', padding: '4px 12px' }}>Cancelar</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-ghost" onClick={() => { setBrandEditing(brand.id); setBrandEditName(brand.name); setBrandEditDesc(brand.description || ''); }} style={{ fontSize: '0.8rem', padding: '4px 12px' }}>Editar</button>
                          <button onClick={() => handleDeleteBrand(brand.id, brand.name)} style={{ fontSize: '0.8rem', padding: '4px 12px', background: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', borderRadius: 6, cursor: 'pointer' }}>Eliminar</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {brands.length === 0 && <tr className="empty-row"><td colSpan={4}>Sin marcas. Agrega la primera.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
