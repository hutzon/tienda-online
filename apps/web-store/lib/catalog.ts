export interface ProductPlaceholder {
  slug: string;
  name: string;
  description: string;
  priceLabel: string;
  badge: string;
  deliveryWindow: string;
}

const productCatalog: ProductPlaceholder[] = [
  {
    slug: 'starter-office-kit',
    name: 'Starter Office Kit',
    description:
      'Bundle placeholder para validar catálogo, detalle y evolución a variantes reales.',
    priceLabel: 'Q 299.00',
    badge: 'Base UI',
    deliveryWindow: 'Entrega 24–48h'
  },
  {
    slug: 'smart-desk-light',
    name: 'Smart Desk Light',
    description:
      'Producto placeholder con copy orientado a PDP, media y futuras promociones.',
    priceLabel: 'Q 179.00',
    badge: 'Placeholder',
    deliveryWindow: 'Entrega 48h'
  },
  {
    slug: 'carry-everyday-backpack',
    name: 'Carry Everyday Backpack',
    description:
      'Ejemplo para validar navegación pública y composición de cards reutilizables.',
    priceLabel: 'Q 425.00',
    badge: 'Storefront',
    deliveryWindow: 'Entrega 72h'
  },
  {
    slug: 'wireless-creator-stand',
    name: 'Wireless Creator Stand',
    description:
      'Placeholder pensado para escalar a datos reales sin rehacer estructura de detalle.',
    priceLabel: 'Q 249.00',
    badge: 'Escalable',
    deliveryWindow: 'Entrega 24h'
  }
];

export function getAllProducts() {
  return productCatalog;
}

export function getFeaturedProducts() {
  return productCatalog.slice(0, 3);
}

export function getProductBySlug(slug: string) {
  return productCatalog.find(product => product.slug === slug);
}
