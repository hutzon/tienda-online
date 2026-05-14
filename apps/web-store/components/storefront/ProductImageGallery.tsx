'use client';

import { useState } from 'react';
import { ProductImageDto } from '@/lib/api/commerce';

interface ProductImageGalleryProps {
  images: ProductImageDto[];
  productName: string;
}

const PLACEHOLDER = (
  <div style={{
    width: '100%', aspectRatio: '4/3',
    background: 'var(--accent-soft)',
    borderRadius: 12,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: '0.75rem',
    color: 'var(--muted)',
  }}>
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
    <span style={{ fontSize: '0.9rem' }}>Sin imágenes disponibles</span>
  </div>
);

export default function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [currentIdx, setCurrentIdx] = useState(0);

  if (images.length === 0) {
    return PLACEHOLDER;
  }

  const current = images[currentIdx];

  const prev = () => setCurrentIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setCurrentIdx(i => (i + 1) % images.length);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Main image */}
      <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: 'var(--accent-soft)' }}>
        <img
          src={current.imageUrl}
          alt={current.altText || productName}
          style={{
            width: '100%',
            aspectRatio: '4/3',
            objectFit: 'cover',
            display: 'block',
          }}
          onError={e => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Imagen anterior"
              style={{
                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%',
                width: 36, height: 36, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', color: 'var(--text)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              ‹
            </button>
            <button
              onClick={next}
              aria-label="Imagen siguiente"
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%',
                width: 36, height: 36, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', color: 'var(--text)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              ›
            </button>
          </>
        )}

        {images.length > 1 && (
          <div style={{
            position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: '6px',
          }}>
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                aria-label={`Ir a imagen ${i + 1}`}
                style={{
                  width: i === currentIdx ? 20 : 8,
                  height: 8,
                  borderRadius: 4,
                  border: 'none',
                  padding: 0,
                  background: i === currentIdx ? 'var(--accent)' : 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  transition: 'width 0.2s ease, background 0.2s ease',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails (when more than 1 image) */}
      {images.length > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setCurrentIdx(i)}
              aria-label={`Ver imagen ${i + 1}`}
              style={{
                padding: 0, border: 'none', background: 'none', cursor: 'pointer',
                borderRadius: 8,
                outline: i === currentIdx ? '2px solid var(--accent)' : '2px solid transparent',
                outlineOffset: 2,
                transition: 'outline-color 0.15s',
              }}
            >
              <img
                src={img.imageUrl}
                alt={img.altText || `Imagen ${i + 1}`}
                style={{
                  width: 60, height: 60,
                  objectFit: 'cover',
                  borderRadius: 8,
                  display: 'block',
                  opacity: i === currentIdx ? 1 : 0.65,
                  transition: 'opacity 0.15s',
                }}
                onError={e => {
                  (e.target as HTMLImageElement).style.opacity = '0.3';
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
