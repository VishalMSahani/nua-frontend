'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  fullName: string;
  email: string;
}

interface FileItem {
  id: string;
  filename: string;
}

interface ShareDialogProps {
  file: FileItem;
  onClose: () => void;
}

export default function ShareDialog({ file, onClose }: ShareDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [shareLink, setShareLink] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Not authenticated');
        setLoadingUsers(false);
        return;
      }
      
      const response = await axios.get('http://localhost:3001/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.users) {
        setUsers(response.data.users);
      } else {
        setUsers([]);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error('Users endpoint not found. Please ensure backend is running.');
      } else if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login again.');
      } else {
        toast.error('Failed to load users. Check if backend is running on port 3001.');
      }
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleGenerateLinkAndShare = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user to share with');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const shareUsersPayload: any = {
        fileId: file.id,
        userIds: selectedUsers
      };
      
      if (expiryDate) {
        shareUsersPayload.expiresAt = new Date(expiryDate).toISOString();
      }
      
      await axios.post(
        'http://localhost:3001/api/share/users',
        shareUsersPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const payload: any = { fileId: file.id };
      if (expiryDate) {
        payload.expiresAt = new Date(expiryDate).toISOString();
      }

      const linkResponse = await axios.post(
        'http://localhost:3001/api/share/link',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShareLink(linkResponse.data.shareLink.url);
      toast.success('File shared successfully with selected users!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to share file');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      toast.success('Link copied to clipboard!');
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Share File</h3>
              <p className="text-xs text-gray-500 mt-1 truncate max-w-md">{file.filename}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition p-1"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(85vh-220px)]">
          {!shareLink ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Select users to share with
                </label>
                <input
                  type="text"
                  placeholder="Search by name or email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(231,86,80)] focus:border-[rgb(231,86,80)] placeholder:text-gray-400 transition"
                />
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {loadingUsers ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[rgb(231,86,80)] mx-auto mb-2"></div>
                    <p className="text-xs text-gray-500">Loading...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="h-10 w-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-xs text-gray-600 font-medium">
                      {users.length === 0 ? 'No users available' : 'No users found'}
                    </p>
                  </div>
                ) : (
                  filteredUsers.map(user => (
                    <label
                      key={user._id}
                      className="flex items-center p-2.5 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition border border-transparent hover:border-blue-200"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => toggleUserSelection(user._id)}
                        className="mr-3 h-4 w-4 rounded border-gray-300 text-[rgb(231,86,80)] focus:ring-[rgb(231,86,80)]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>

              {selectedUsers.length > 0 && (
                <div className="px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs font-medium text-blue-900">
                    {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Access Expiry (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={expiryDate}
                  min={getMinDateTime()}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  placeholder="dd-mm-yyyy --:--"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(231,86,80)] focus:border-[rgb(231,86,80)] text-gray-700 transition"
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Sets expiry for both user access and shareable link. Leave empty for permanent access.
                </p>
              </div>

              <div className="px-3 py-2.5 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-xs font-medium text-yellow-900">Security Notice</p>
                    <p className="text-xs text-yellow-700 mt-0.5">
                      File will be shared with selected users and a link will be generated. Only authenticated users can access files via the link.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs font-medium text-green-900">
                    Shared with {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="px-3 py-3 bg-blue-50 rounded-lg space-y-2.5 border border-blue-200">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <p className="text-xs font-medium text-blue-900">Shareable Link</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-lg text-xs text-gray-700"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-2 bg-[rgb(231,86,80)] text-white rounded-lg hover:opacity-90 transition flex items-center gap-1.5 text-xs font-medium"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                </div>
                {expiryDate && (
                  <p className="text-xs text-blue-700">
                    Expires: {new Date(expiryDate).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          {shareLink ? (
            <button
              onClick={onClose}
              className="px-4 py-2 text-white font-medium rounded-lg transition"
              style={{ backgroundColor: 'rgb(231, 86, 80)' }}
            >
              Done
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 font-medium bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateLinkAndShare}
                disabled={loading || selectedUsers.length === 0}
                className="px-4 py-2 text-white font-medium rounded-lg transition disabled:opacity-50 flex items-center gap-2"
                style={{ backgroundColor: 'rgb(231, 86, 80)' }}
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Generate Link and Share
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
