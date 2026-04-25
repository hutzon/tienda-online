import Link from 'next/link';
import type { ProductPlaceholder } from '@/lib/catalog';

interface ProductCardProps {
  product: ProductPlaceholder;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="product-card">
      <div className="product-card-top">
        <span className="product-tag">{product.badge}</span>
        <p className="product-price">{product.priceLabel}</p>
      </div>

      <h3>{product.name}</h3>
      <p>{product.description}</p>

      <div className="product-card-bottom">
        <span className="product-meta">{product.deliveryWindow}</span>
        <Link href={`/product/${product.slug}`} className="card-link">
          Ver detalle
        </Link>
      </div>
    </article>
  );
}
