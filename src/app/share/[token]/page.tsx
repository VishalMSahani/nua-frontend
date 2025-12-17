'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

interface FileInfo {
  id: string;
  filename: string;
  type: string;
  size: number;
  uploadedAt: string;
  owner: {
    fullName: string;
    email: string;
  };
}

export default function ShareLinkPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const token = params.token as string;

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        toast.error('You must be logged in to access shared files');
        router.push(`/login?redirect=/share/${token}`);
      } else {
        accessSharedFile();
      }
    }
  }, [user, authLoading, token]);

  const accessSharedFile = async () => {
    setLoading(true);
    setError('');
    
    try {
      const authToken = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:3001/api/share/link/${token}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      setFileInfo(response.data.file);
      toast.success('File access granted!');
    } catch (err: any) {
      console.error('Error accessing shared file:', err);
      const errorMsg = err.response?.data?.error || 'Failed to access shared file';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!fileInfo) return;

    try {
      const authToken = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:3001/api/files/${fileInfo.id}/download`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          responseType: 'blob',
        }
      );

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileInfo.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('File downloaded successfully');
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const handleViewFile = async () => {
    if (!fileInfo) return;

    try {
      const authToken = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:3001/api/files/${fileInfo.id}/download`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          responseType: 'blob',
        }
      );

      let mimeType = fileInfo.type;
      if (fileInfo.filename.toLowerCase().endsWith('.svg') && !mimeType.includes('svg')) {
        mimeType = 'image/svg+xml';
      }

      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing file:', error);
      toast.error('Failed to view file');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/shared')}
              className="w-full px-4 py-3 text-white font-medium rounded-lg transition"
              style={{ backgroundColor: 'rgb(231, 86, 80)' }}
            >
              Go to Shared Files
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full px-4 py-3 text-gray-700 font-medium bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!fileInfo) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-[rgb(231,86,80)] to-[rgb(239,250,248)] p-8 text-white">
            <div className="flex items-center gap-3 mb-2">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <h1 className="text-2xl font-bold">Shared File</h1>
            </div>
            <p className="text-white/90">File shared with you via secure link</p>
          </div>

          <div className="p-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{fileInfo.filename}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    {fileInfo.type.split('/')[1]?.toUpperCase() || 'FILE'}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                    {formatFileSize(fileInfo.size)}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(fileInfo.uploadedAt)}
                  </span>
                </div>
              </div>

              {fileInfo.owner && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Shared by</p>
                  <p className="font-medium text-gray-900">{fileInfo.owner.fullName}</p>
                  <p className="text-sm text-gray-500">{fileInfo.owner.email}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleViewFile}
                  className="flex-1 px-6 py-3 bg-[rgb(231,86,80)] text-white font-medium rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View File
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 px-6 py-3 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-800 transition flex items-center justify-center gap-2"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => router.push('/shared')}
                  className="text-[rgb(231,86,80)] hover:underline text-sm font-medium"
                >
                  ← View all shared files
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
