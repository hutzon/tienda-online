import Link from 'next/link';
import type { PublicCatalogProductSummary } from '@/lib/api/commerce';

interface ProductCardProps {
  product: PublicCatalogProductSummary;
}

function ProductImagePlaceholder({ name }: { name: string }) {
  return (
    <div
      aria-label={`Imagen de referencia: ${name}`}
      style={{
        width: '100%',
        height: '160px',
        backgroundColor: '#f4f4f5',
        borderRadius: '6px',
        marginBottom: '1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        color: '#a1a1aa',
      }}
    >
      {/* Placeholder temporal — reemplazar con imagen real en producción */}
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </svg>
      <span style={{ fontSize: '0.75rem' }}>{name}</span>
    </div>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="product-card">
      <div className="product-card-top">
        <span className="product-tag">{product.inStock ? 'Disponible' : 'Agotado'}</span>
        <p className="product-price">{product.currency} {product.price.toFixed(2)}</p>
      </div>

      <ProductImagePlaceholder name={product.name} />

      <h3>{product.name}</h3>
      <p>{product.summary}</p>

      <div className="product-card-bottom">
        <span className="product-meta">{product.categoryName}</span>
        <Link href={`/product/${product.slug}`} className="card-link">
          Ver detalle
        </Link>
      </div>
    </article>
  );
}
