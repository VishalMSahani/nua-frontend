'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { fileAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import FilesList from '@/components/FilesList';

interface FileItem {
  id: string;
  filename: string;
  type: string;
  size: number;
  key: string;
  uploadedAt: string;
  owner: {
    fullName: string;
    email: string;
  };
  role?: 'owner' | 'viewer';
  expiresAt?: string;
}

export default function SharedPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadFiles();
    }
  }, [user, authLoading, router]);

  const loadFiles = async () => {
    try {
      const data = await fileAPI.getUserFiles();
      const sharedFiles = (data.files || [])
        .filter((f: any) => f.role === 'viewer')
        .map((f: any): FileItem => ({
          id: f.id,
          filename: f.filename,
          type: f.type,
          size: f.size,
          key: f.id,
          uploadedAt: f.uploadDate,
          owner: f.owner,
          role: f.role,
          expiresAt: f.expiresAt
        }));
      setFiles(sharedFiles);
    } catch (error: any) {
      toast.error('Failed to load shared files');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      const blob = await fileAPI.downloadFile(file.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('File downloaded!');
    } catch (error) {
      toast.error('Download failed');
    }
  };

  const handleView = async (file: FileItem) => {
    try {
      const blob = await fileAPI.downloadFile(file.id);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      toast.error('Failed to view file');
    }
  };

  const handleAudit = async (file: FileItem) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/audit/file/${file.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      toast.success(`Audit log loaded (${data.logs?.length || 0} entries)`);
    } catch (error) {
      toast.error('Failed to load audit logs');
    }
  };

  const handleFileAction = (action: 'view' | 'download' | 'delete' | 'share' | 'audit', file: FileItem) => {
    switch (action) {
      case 'view':
        handleView(file);
        break;
      case 'download':
        handleDownload(file);
        break;
      case 'audit':
        handleAudit(file);
        break;
      default:
        toast.error(`Action "${action}" not available for shared files`);
    }
  };

  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="p-4 lg:p-8">
           
            <FilesList
              title="Shared with Me"
              files={files}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onFileAction={handleFileAction}
              emptyStateIcon={
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              }
              emptyStateTitle="No shared files"
              emptyStateDescription="Files shared with you will appear here."
              showOwner={true}
              isSharedView={true}
            />
          </div>
        </main>
    </>
  );
}