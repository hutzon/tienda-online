'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { PackageIcon, ShoppingCartIcon, BoxIcon, FileTextIcon, UsersIcon, SettingsIcon, LayoutDashboardIcon } from './Icons';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboardIcon className="w-5 h-5" /> },
  { href: '/catalog', label: 'Catálogo', icon: <PackageIcon className="w-5 h-5" /> },
  { href: '/inventory', label: 'Inventario', icon: <BoxIcon className="w-5 h-5" /> },
  { href: '/orders', label: 'Pedidos', icon: <ShoppingCartIcon className="w-5 h-5" /> },
  { href: '/billing', label: 'Facturación', icon: <FileTextIcon className="w-5 h-5" /> },
  { href: '/customers', label: 'Clientes', icon: <UsersIcon className="w-5 h-5" /> },
  { href: '/settings', label: 'Configuración', icon: <SettingsIcon className="w-5 h-5" /> },
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
