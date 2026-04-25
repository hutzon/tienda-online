import type { ReactNode } from 'react';

interface StorefrontContainerProps {
  children: ReactNode;
  className?: string;
}

export function StorefrontContainer({
  children,
  className,
}: StorefrontContainerProps) {
  const classes = ['storefront-container', className].filter(Boolean).join(' ');
  return <div className={classes}>{children}</div>;
}
