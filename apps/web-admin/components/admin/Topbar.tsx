'use client';

import { useRouter } from 'next/navigation';
import { clearToken } from '@/lib/session';

interface TopbarProps {
  title: string;
}

export default function Topbar({ title }: TopbarProps) {
  const router = useRouter();

  function handleLogout() {
    clearToken();
    router.push('/login');
  }

  return (
    <header className="topbar">
      <h2 className="topbar-title">{title}</h2>
      <div className="topbar-actions">
        <span className="topbar-role-badge">Admin</span>
        <button onClick={handleLogout} className="btn-ghost">
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
