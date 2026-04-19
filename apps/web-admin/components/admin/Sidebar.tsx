'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '◈' },
  { href: '/catalog', label: 'Catálogo', icon: '◫' },
  { href: '/inventory', label: 'Inventario', icon: '◧' },
  { href: '/orders', label: 'Pedidos', icon: '◩' },
  { href: '/customers', label: 'Clientes', icon: '◬' },
  { href: '/settings', label: 'Configuración', icon: '◎' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-name">TiendaOnline</span>
        <span className="sidebar-brand-sub">Admin</span>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link${pathname.startsWith(item.href) ? ' active' : ''}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <span className="sidebar-env-badge">Development</span>
      </div>
    </aside>
  );
}
