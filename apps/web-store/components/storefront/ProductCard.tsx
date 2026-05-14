import Link from 'next/link';
import type { PublicCatalogProductSummary } from '@/lib/api/commerce';
import { AddToCartButton } from './AddToCartButton';

interface ProductCardProps {
  product: PublicCatalogProductSummary;
}

function ProductImagePlaceholder({ name }: { name: string }) {
  return (
    <div
      aria-label={`Sin imagen: ${name}`}
      style={{
        width: '100%',
        height: '160px',
        backgroundColor: '#f4f4f5',
        borderRadius: '6px',
        marginBottom: '0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        color: '#a1a1aa',
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </svg>
      <span style={{ fontSize: '0.75rem' }}>Sin imagen</span>
    </div>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="product-card">
      <div className="product-card-top">
        <span className={`product-tag${product.inStock ? '' : ' product-tag-out'}`}>
          {product.inStock ? 'Disponible' : 'Agotado'}
        </span>
        <p className="product-price">{product.currency} {product.price.toFixed(2)}</p>
      </div>

      <Link href={`/product/${product.slug}`} className="product-card-image-link">
        {product.primaryImageUrl ? (
          <div style={{ width: '100%', height: '160px', borderRadius: '6px', overflow: 'hidden' }}>
            <img
              src={product.primaryImageUrl}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        ) : (
          <ProductImagePlaceholder name={product.name} />
        )}
      </Link>

      <div>
        <h3 style={{ margin: '0 0 0.25rem' }}>{product.name}</h3>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>{product.summary}</p>
      </div>

      <div className="product-card-bottom">
        <span className="product-meta">{product.categoryName}</span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <AddToCartButton
            productId={product.id}
            slug={product.slug}
            name={product.name}
            price={product.price}
            currency={product.currency}
            primaryImageUrl={product.primaryImageUrl}
            inStock={product.inStock}
            variant="card"
          />
          <Link href={`/product/${product.slug}`} className="card-link">
            Ver
          </Link>
        </div>
      </div>
    </article>
  );
}
