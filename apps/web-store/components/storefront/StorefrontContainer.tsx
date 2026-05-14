import type { CSSProperties, ReactNode } from 'react';

interface StorefrontContainerProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function StorefrontContainer({
  children,
  className,
  style,
}: StorefrontContainerProps) {
  const classes = ['storefront-container', className].filter(Boolean).join(' ');
  return <div className={classes} style={style}>{children}</div>;
}
