import AdminSidebar from "@/components/admin/admin-sidebar";
import BackupManager from "@/components/admin/backup-manager";

export default function AdminBackupPage() {
  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long', 
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="nav-modern px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="page-header">
              <h1 className="page-title">Backup Management</h1>
              <p className="page-subtitle">Download and manage investor data backups</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm text-gray-500 font-medium">Today's Date</p>
                <p className="font-semibold text-gray-900">{today}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Backup Content */}
        <main className="flex-1 container-modern">
          <div className="space-y-8">
            <div className="slide-up">
              <BackupManager />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}