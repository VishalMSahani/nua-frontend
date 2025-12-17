'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import DashboardHeader from '@/components/DashboardHeader';
import UploadSection from '@/components/UploadSection';
import StatsCard from '@/components/StatsCard';
import ViewModeToggle from '@/components/ViewModeToggle';
import FilesList from '@/components/FilesList';
import ShareDialog from '@/components/ShareDialog';
import Image from 'next/image';

interface FileItem {
  id: string;
  filename: string;
  size: number;
  type: string;
  uploadedAt: string;
  key: string;
  owner: {
    fullName: string;
    email: string;
  };
  expiresAt?: string;
}

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [myFiles, setMyFiles] = useState<FileItem[]>([]);
  const [sharedFiles, setSharedFiles] = useState<FileItem[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showUploadPreview, setShowUploadPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileItem } | null>(null);
  const [shareDialogFile, setShareDialogFile] = useState<FileItem | null>(null);
  const [viewFileUrl, setViewFileUrl] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<FileItem | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [auditFile, setAuditFile] = useState<FileItem | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchFiles();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  const fetchFiles = async () => {
    setFilesLoading(true);
    try {
      const token = localStorage.getItem('token');

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await axios.get(`${API_URL}/files`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const allFiles = response.data.files || [];
      
      const transformFile = (f: any): FileItem => ({
        id: f.id,
        filename: f.filename,
        type: f.type,
        size: f.size,
        key: f.id,
        uploadedAt: f.uploadDate,
        owner: f.owner,
        expiresAt: f.expiresAt
      });
      
      const ownedFiles = allFiles
        .filter((f: any) => f.role === 'owner')
        .map(transformFile);
      
      const sharedFilesList = allFiles
        .filter((f: any) => f.role === 'viewer')
        .map(transformFile);
      
      setMyFiles(ownedFiles);
      setSharedFiles(sharedFilesList);
    } catch (error) {
      toast.error('Failed to fetch files');
    } finally {
      setFilesLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(files);
      setShowUploadPreview(true);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    const token = localStorage.getItem('token');

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        await axios.post(`${API_URL}/files/upload`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      toast.success(`${selectedFiles.length} file(s) uploaded successfully!`);
      setSelectedFiles([]);
      setShowUploadPreview(false);
      await fetchFiles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleView = async (file: FileItem) => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await axios.get(
        `${API_URL}/files/${file.id}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );

      let mimeType = file.type;
      if (file.filename.toLowerCase().endsWith('.svg') && !mimeType.includes('svg')) {
        mimeType = 'image/svg+xml';
      }

      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      setViewFileUrl(url);
      setViewingFile(file);
      setImageLoading(true);
    } catch (error) {
      toast.error('Failed to load file');
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await axios.get(
        `${API_URL}/files/${file.id}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('File downloaded successfully');
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      await axios.delete(`${API_URL}/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('File deleted successfully');
      await fetchFiles();
    } catch (error) {
      toast.error('Failed to delete file');
    }
  };

  const handleShare = (file: FileItem) => {
    setShareDialogFile(file);
  };

  const handleAudit = async (file: FileItem) => {
    setAuditFile(file);
    setLoadingAudit(true);
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await axios.get(`${API_URL}/audit/file/${file.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAuditLogs(response.data.logs);
    } catch (error) {
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  const handleDoubleClick = (file: FileItem) => {
    handleView(file);
  };

  const handleFileAction = (action: 'view' | 'download' | 'delete' | 'share' | 'audit', file: FileItem) => {
    switch (action) {
      case 'view':
        handleView(file);
        break;
      case 'download':
        handleDownload(file);
        break;
      case 'delete':
        handleDelete(file.id);
        break;
      case 'share':
        handleShare(file);
        break;
      case 'audit':
        handleAudit(file);
        break;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

 
  if (authLoading || !user) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <DashboardHeader 
            userName={user?.fullName}
            userEmail={user?.email}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="w-full">
              <UploadSection
                selectedFiles={selectedFiles}
                uploading={uploading}
                showUploadPreview={showUploadPreview}
                onFileSelect={handleFileSelect}
                onRemoveFile={(index) => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}
                onClearAll={() => {
                  setSelectedFiles([]);
                  setShowUploadPreview(false);
                }}
                onUpload={handleUpload}
                formatFileSize={formatFileSize}
              />
            </div>

            <div className="w-full bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-white/50 p-6">
              <div className="flex flex-col md:flex-row gap-3 h-full">
                <div className="flex items-center justify-center md:w-1/2">
                  <Image 
                    src="/statss.svg" 
                    alt="Statistics" 
                    width={430} 
                    height={430}
                    className=" "
                  />
                </div>
                <div className="flex flex-col gap-4 md:w-1/2 justify-center">
                  <StatsCard
                    title="My Files"
                    value={myFiles.length}
                  />
                  <StatsCard
                    title="Shared With Me"
                    value={sharedFiles.length}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-white/50 p-4">
            {filesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: 'rgb(231, 86, 80)' }}></div>
              </div>
            ) : (
              <FilesList
                title=""
                files={myFiles}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onFileAction={handleFileAction}
                onDoubleClick={handleDoubleClick}
                onRightClick={(file, e) => handleContextMenu(e, file)}
                emptyStateIcon={
                  <svg className="h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                }
                emptyStateTitle="No files"
                emptyStateDescription="Get started by uploading a file."
                showOwner={false}
                isSharedView={false}
              />
            )}
          </div>
        </div>
      </main>

      {contextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={() => {
              handleView(contextMenu.file);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View
          </button>
          <button
            onClick={() => {
              handleShare(contextMenu.file);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
          <button
            onClick={() => {
              handleDownload(contextMenu.file);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
          <button
            onClick={() => {
              handleDelete(contextMenu.file.id);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
          <button
            onClick={() => {
              handleAudit(contextMenu.file);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Audit Log
          </button>
        </div>
      )}

      {shareDialogFile && (
        <ShareDialog
          file={shareDialogFile}
          onClose={() => setShareDialogFile(null)}
        />
      )}

      {viewFileUrl && viewingFile && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => {
          setViewFileUrl(null);
          setViewingFile(null);
          setImageLoading(true);
          window.URL.revokeObjectURL(viewFileUrl);
        }}>
          <button
            onClick={() => {
              setViewFileUrl(null);
              setViewingFile(null);
              setImageLoading(true);
              window.URL.revokeObjectURL(viewFileUrl);
            }}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition z-10"
          >
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
            </div>
          )}
          <div className="max-w-7xl max-h-[90vh] w-[95vw] h-[90vh] flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            {viewingFile.type.startsWith('image/') || viewingFile.type.includes('svg') || viewingFile.filename.toLowerCase().endsWith('.svg') ? (
              <div className="relative w-full h-full flex items-center justify-center bg-white rounded-lg shadow-2xl p-8">
                <img 
                  src={viewFileUrl} 
                  alt={viewingFile.filename}
                  className="max-w-full max-h-full object-contain rounded-lg border border-gray-200"
                  onLoad={() => setImageLoading(false)}
                  onError={() => {
                    setImageLoading(false);
                    toast.error('Failed to display image');
                  }}
                />
              </div>
            ) : (
              <iframe 
                src={viewFileUrl} 
                className="w-full h-full bg-white rounded-lg shadow-2xl" 
                onLoad={() => setImageLoading(false)} 
              />
            )}
          </div>
        </div>
      )}

      {auditFile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setAuditFile(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Audit Log - {auditFile.filename}</h3>
              <button
                onClick={() => setAuditFile(null)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {loadingAudit ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: 'rgb(231, 86, 80)' }}></div>
                </div>
              ) : auditLogs.filter((log: any) => log.action !== 'download').length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>No audit logs found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {auditLogs.filter((log: any) => log.action !== 'download').map((log: any, index: number) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: log.action === 'delete' ? '#fee2e2' : log.action === 'upload' ? '#dcfce7' : '#dbeafe' }}>
                          {log.action === 'upload' && (
                            <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          )}
                          {log.action === 'download' && (
                            <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          )}
                          {log.action === 'delete' && (
                            <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                          {log.action === 'share' && (
                            <svg className="h-5 w-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 capitalize">{log.action}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {log.userId?.fullName || log.userId?.email || 'Unknown User'}
                        </p>
                        {log.action === 'share' && log.targetUserId && (
                          <p className="text-xs text-gray-600 mt-1">
                            → Shared with: <span className="font-medium">{log.targetUserId?.fullName || log.targetUserId?.email}</span>
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setAuditFile(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg transition"
                style={{ backgroundColor: 'rgb(231, 86, 80)', color: 'white' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
