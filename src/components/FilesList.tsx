import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ViewModeToggle from './ViewModeToggle';

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

interface FilesListProps {
  title: string;
  files: FileItem[];
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onFileAction?: (action: 'view' | 'download' | 'delete' | 'share' | 'audit', file: FileItem) => void;
  onDoubleClick?: (file: FileItem) => void;
  onRightClick?: (file: FileItem, event: React.MouseEvent) => void;
  emptyStateIcon?: React.ReactNode;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  showOwner?: boolean;
  isSharedView?: boolean;
}

interface DropdownPosition {
  openUp: boolean;
  openLeft: boolean;
}

export default function FilesList({
  title,
  files,
  viewMode,
  onViewModeChange,
  onFileAction,
  onDoubleClick,
  onRightClick,
  emptyStateIcon,
  emptyStateTitle = "No files",
  emptyStateDescription = "Get started by uploading a file.",
  showOwner = false,
  isSharedView = false,
}: FilesListProps) {
  const getApiBase = () => {
    const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return raw.endsWith('/api') ? raw : `${raw}/api`;
  };
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<FileItem | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({ openUp: false, openLeft: false });
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatExpiryDate = (expiresAt?: string): string => {
    if (!expiresAt) return 'Never';
    const date = new Date(expiresAt);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    
    if (diffMs < 0) return 'Expired';
    if (diffHours < 24) {
      const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return `Today ${time}`;
    }
    if (diffDays === 1) {
      const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return `Tomorrow ${time}`;
    }
    if (diffDays <= 7) {
      const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return `${diffDays} days, ${time}`;
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const getExpiryColor = (expiresAt?: string): string => {
    if (!expiresAt) return 'bg-gray-100 text-gray-700';
    const date = new Date(expiresAt);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'bg-red-100 text-red-700';
    if (diffDays <= 1) return 'bg-orange-100 text-orange-700';
    if (diffDays <= 7) return 'bg-yellow-100 text-yellow-700';
    
    return 'bg-green-100 text-green-700';
  };

  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    const toRevoke: string[] = [];

    async function loadThumbnails() {
      const token = localStorage.getItem('token');
      if (!token) return;

      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        if (thumbUrls[file.id]) continue;

        try {
          const resp = await fetch(`${getApiBase()}/files/${file.id}/download`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!resp.ok) {
            continue;
          }
          const blob = await resp.blob();
          if (!mounted) return;
          const url = URL.createObjectURL(blob);
          toRevoke.push(url);
          setThumbUrls((prev) => ({ ...prev, [file.id]: url }));
        } catch (e) {
        }
      }
    }

    loadThumbnails();

    return () => {
      mounted = false;
      toRevoke.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [files]);

  const getFileThumbnail = (file: FileItem) => {
    if (file.type.startsWith('image/')) return thumbUrls[file.id] || null;
    return null;
  };

  const getFileTypeIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('sheet') || type.includes('excel')) return '📊';
    if (type.includes('video')) return '🎥';
    if (type.includes('audio')) return '🎵';
    if (type.includes('zip') || type.includes('rar')) return '🗜️';
    return '📎';
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
        setActiveFile(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function computePosition() {
      if (activeDropdown && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const dropdownHeight = 200; // approximate
        const dropdownWidth = 192; // w-48

        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const spaceRight = window.innerWidth - rect.right;

        const openUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
        const openLeft = spaceRight < dropdownWidth;

        const top = openUp ? rect.top - dropdownHeight - 8 : rect.bottom + 8;
        const left = openLeft ? rect.left - dropdownWidth : rect.right;

        setDropdownPosition({ openUp, openLeft });
        const clampedLeft = Math.min(Math.max(8, left), window.innerWidth - dropdownWidth - 8);
        const clampedTop = Math.min(Math.max(8, top), window.innerHeight - dropdownHeight - 8);
        setMenuCoords({ top: clampedTop, left: clampedLeft });
      }
    }

    computePosition();
    window.addEventListener('resize', computePosition);
    window.addEventListener('scroll', computePosition, true);
    return () => {
      window.removeEventListener('resize', computePosition);
      window.removeEventListener('scroll', computePosition, true);
    };
  }, [activeDropdown]);

  const handleActionClick = (action: 'view' | 'download' | 'delete' | 'share' | 'audit', file: FileItem) => {
    setActiveDropdown(null);
    setActiveFile(null);
    onFileAction?.(action, file);
  };

  const openMenuFor = (file: FileItem, btn: HTMLButtonElement) => {
    buttonRef.current = btn;
    setActiveFile(file);
    setActiveDropdown(prev => (prev === file.id ? null : file.id));
  };

  const DropdownPortal = ({ children }: { children: React.ReactNode }) => {
    if (typeof window === 'undefined') return null;
    return createPortal(children as any, document.body);
  };

  const defaultEmptyIcon = (
    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );

  return (
    <div className="bg-transparent">
      <div className="p-3 lg:p-4 border-b border-gray-200/50 flex items-center justify-between">
        <h2 className="text-xl lg:text-2xl font-semibold text-gray-900">
          {title || 'My Files'}
        </h2>
        <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
      </div>

      {files.length === 0 ? (
        <div className="text-center py-12">
          {emptyStateIcon || defaultEmptyIcon}
          <h3 className="mt-2 text-sm font-medium text-gray-900">{emptyStateTitle}</h3>
          <p className="mt-1 text-sm text-gray-500">{emptyStateDescription}</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="relative">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 border-b">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Name
                </th>
                <th className="hidden md:table-cell px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                {showOwner && (
                  <th className="hidden lg:table-cell px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                )}
                <th className="hidden lg:table-cell px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {showOwner ? 'Shared On' : 'Uploaded'}
                </th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/50 divide-y divide-gray-200">
              {files.map((file) => (
                <tr
                  key={file.id}
                  className="hover:bg-gray-50/50 transition cursor-pointer"
                  onDoubleClick={() => onDoubleClick?.(file)}
                  onContextMenu={(e) => onRightClick?.(file, e)}
                >
                  <td className="px-4 lg:px-6 py-4">
                    <div className="flex items-center">
                      {getFileThumbnail(file) ? (
                        <img
                          src={getFileThumbnail(file)!}
                          alt={file.filename}
                          className="h-10 w-10 object-cover rounded mr-3 shrink-0"
                          draggable={false}
                          onContextMenu={(e) => e.preventDefault()}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="h-10 w-10 flex items-center justify-center bg-gray-100 rounded mr-3 shrink-0"
                        style={{ display: getFileThumbnail(file) ? 'none' : 'flex' }}
                      >
                        <span className="text-2xl">{getFileTypeIcon(file.type)}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {file.filename}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {file.type.split('/')[1]?.toUpperCase() || 'FILE'} • {formatFileSize(file.size)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatFileSize(file.size)}
                  </td>
                  {showOwner && file.owner && (
                    <td className="hidden lg:table-cell px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{file.owner.fullName}</div>
                      <div className="text-xs text-gray-500">{file.owner.email}</div>
                      {isSharedView && (
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${getExpiryColor(file.expiresAt)}`}>
                          {formatExpiryDate(file.expiresAt) === 'Never' ? '∞ Never' : `⏰ ${formatExpiryDate(file.expiresAt)}`}
                        </span>
                      )}
                    </td>
                  )}
                  <td className="hidden lg:table-cell px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(file.uploadedAt)}
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2 relative">
                      {!isSharedView && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActionClick('share', file);
                          }}
                          className="p-2 rounded-lg transition"
                          style={{ backgroundColor: 'rgb(182, 231, 224)', color: 'rgb(0, 100, 90)' }}
                          title="Share"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                        </button>
                      )}
                      <div className="relative" ref={activeDropdown === file.id ? dropdownRef : null}>
                        <button
                          ref={activeDropdown === file.id ? buttonRef : null}
                          onClick={(e) => {
                            e.stopPropagation();
                            openMenuFor(file, e.currentTarget);
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        >
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        {activeDropdown === file.id && activeFile && activeFile.id === file.id && (
                          <DropdownPortal>
                            <div
                              ref={dropdownRef}
                              className="w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1"
                              style={{ position: 'fixed', top: menuCoords.top, left: menuCoords.left, zIndex: 10000 }}
                            >
                              <button
                                onClick={() => handleActionClick('view', file)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View
                              </button>
                              <button
                                onClick={() => handleActionClick('download', file)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download
                              </button>
                              {!isSharedView && (
                                <button
                                  onClick={() => handleActionClick('delete', file)}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
                                </button>
                              )}
                              <button
                                onClick={() => handleActionClick('audit', file)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Audit Log
                              </button>
                            </div>
                          </DropdownPortal>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 p-3 lg:p-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition group cursor-pointer overflow-visible"
              onDoubleClick={() => onDoubleClick?.(file)}
              onContextMenu={(e) => onRightClick?.(file, e)}
            >
              <div className="flex items-center justify-center w-full h-32 bg-gray-50 rounded-lg mb-3 relative">
                {getFileThumbnail(file) ? (
                  <>
                    <img
                      src={getFileThumbnail(file)!}
                      alt={file.filename}
                      className="w-full h-full object-cover rounded-lg"
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <span className="text-xs text-gray-600 absolute" style={{ display: 'none' }}>Thumbnail</span>
                  </>
                ) : (
                  <span className="text-4xl">{getFileTypeIcon(file.type)}</span>
                )}
              </div>
              <div className="mb-3">
                <h3 className="text-sm font-medium text-gray-900 truncate" title={file.filename}>
                  {file.filename}
                </h3>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded font-medium">
                    {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                  </span>
                  <span className="text-xs text-gray-500">• {formatFileSize(file.size)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(file.uploadedAt)}
                </p>
                {showOwner && file.owner && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <span className="inline-block px-2 py-0.5 rounded" style={{ backgroundColor: 'rgb(182, 231, 224)', color: 'rgb(0, 100, 90)' }}>
                      {file.owner.fullName}
                    </span>
                  </p>
                )}
                {isSharedView && (
                  <div className="mt-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getExpiryColor(file.expiresAt)}`}>
                      {formatExpiryDate(file.expiresAt) === 'Never' ? '∞ Never Expires' : `⏰ Expires: ${formatExpiryDate(file.expiresAt)}`}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 relative">
                {!isSharedView && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActionClick('share', file);
                    }}
                    className="flex-1 px-3 py-2 text-xs font-medium rounded-lg transition"
                    style={{ backgroundColor: 'rgb(182, 231, 224)', color: 'rgb(0, 100, 90)' }}
                  >
                    Share
                  </button>
                )}
                <div className="relative z-50" ref={activeDropdown === file.id ? dropdownRef : null}>
                  <button
                    ref={activeDropdown === file.id ? buttonRef : null}
                    onClick={(e) => {
                      e.stopPropagation();
                      openMenuFor(file, e.currentTarget);
                    }}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                  {activeDropdown === file.id && activeFile && activeFile.id === file.id && (
                    <DropdownPortal>
                      <div
                        ref={dropdownRef}
                        className="w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1"
                        style={{ position: 'fixed', top: menuCoords.top, left: menuCoords.left, zIndex: 10000 }}
                      >
                        <button
                          onClick={() => handleActionClick('view', file)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </button>
                        <button
                          onClick={() => handleActionClick('download', file)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download
                        </button>
                        {!isSharedView && (
                          <button
                            onClick={() => handleActionClick('delete', file)}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        )}
                        <button
                          onClick={() => handleActionClick('audit', file)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Audit Log
                        </button>
                      </div>
                    </DropdownPortal>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
