'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function MobileHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="lg:hidden bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-base font-bold" style={{ backgroundColor: 'rgb(231, 86, 80)' }}>
            N
          </div>
          <span className="ml-2 text-lg font-bold text-gray-900">NUA</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
            <div className="inline-flex items-center justify-center h-6 w-6 rounded-full text-white text-xs font-medium" style={{ backgroundColor: 'rgb(231, 86, 80)' }}>
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-medium text-gray-900 max-w-20 truncate">{user?.fullName}</span>
          </div>
          <button
            onClick={logout}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
