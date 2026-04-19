import Sidebar from '@/components/admin/Sidebar';
import Topbar from '@/components/admin/Topbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <Sidebar />
      <div className="admin-main">
        <Topbar title="Panel Administrativo" />
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
