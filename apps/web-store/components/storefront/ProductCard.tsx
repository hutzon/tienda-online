import Link from 'next/link';
import type { PublicCatalogProductSummary } from '@/lib/api/commerce';

interface ProductCardProps {
  product: PublicCatalogProductSummary;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="product-card">
      <div className="product-card-top">
        <span className="product-tag">{product.inStock ? 'Disponible' : 'Agotado'}</span>
        <p className="product-price">{product.currency} {product.price.toFixed(2)}</p>
      </div>

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
