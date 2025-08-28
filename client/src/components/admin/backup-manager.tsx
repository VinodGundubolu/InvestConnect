import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Database, RefreshCw } from "lucide-react";

export default function BackupManager() {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const { toast } = useToast();

  const { data: backupsData, refetch: refetchBackups } = useQuery({
    queryKey: ["/api/admin/backups"],
    queryFn: () => apiRequest("/api/admin/backups", "GET") as Promise<any>,
  });

  const handleCreateAndDownload = async () => {
    setIsCreatingBackup(true);
    try {
      // Create new backup
      const backupResponse = await apiRequest("/api/admin/backup", "POST") as any;
      
      if (backupResponse.success) {
        // Extract filename from path
        const filename = backupResponse.backupPath.split('/').pop();
        
        // Trigger download
        const downloadUrl = `/api/admin/backup/download/${filename}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "✅ Backup Created & Downloaded",
          description: "Latest investor data backup has been downloaded successfully.",
          variant: "default",
        });

        // Refresh backup list
        refetchBackups();
      }
    } catch (error: any) {
      toast({
        title: "❌ Backup Failed",
        description: error.message || "Failed to create backup",
        variant: "destructive",
      });
    }
    setIsCreatingBackup(false);
  };

  const handleDownloadBackup = async (filename: string) => {
    try {
      const downloadUrl = `/api/admin/backup/download/${filename}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "📥 Download Started",
        description: `Downloading backup: ${filename}`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download backup file",
        variant: "destructive",
      });
    }
  };

  const backups = backupsData?.backups || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Backup Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border">
            <div>
              <h3 className="font-semibold text-blue-900">Create New Backup</h3>
              <p className="text-sm text-blue-700">
                Generate and download a fresh backup of all investor data
              </p>
            </div>
            <Button
              onClick={handleCreateAndDownload}
              disabled={isCreatingBackup}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCreatingBackup ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Create & Download
                </>
              )}
            </Button>
          </div>

          {backups.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Available Backups</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {backups.slice(0, 10).map((backup: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                  >
                    <div>
                      <p className="font-mono text-sm">{backup.filename}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(backup.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadBackup(backup.filename)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}