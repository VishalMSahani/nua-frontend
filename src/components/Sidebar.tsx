'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white/80 backdrop-blur-sm border-r border-gray-200/50">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center shrink-0 px-6 mb-8">
          <div className="flex items-center justify-center">
           <Image src="/logo.png" alt="NUA Logo" width={160} height={160} />
          </div>
        </div>

        <nav className="mt-5 flex-1 px-4 space-y-2">
          <Link
            href="/"
            className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              pathname === '/' 
                ? 'text-white shadow-md' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            style={pathname === '/' ? { backgroundColor: 'rgb(231, 86, 80)' } : {}}
          >
            <svg className={`mr-3 h-5 w-5 ${pathname === '/' ? 'text-white' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            My Files
          </Link>

          <Link
            href="/shared"
            className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              pathname === '/shared' 
                ? 'text-white shadow-md' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            style={pathname === '/shared' ? { backgroundColor: 'rgb(231, 86, 80)' } : {}}
          >
            <svg className={`mr-3 h-5 w-5 ${pathname === '/shared' ? 'text-white' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Shared
          </Link>
        </nav>

        <div className="shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex items-center w-full">
            <div>
              <div className="inline-flex items-center justify-center h-9 w-9 rounded-full text-white text-sm font-medium" style={{ backgroundColor: 'rgb(231, 86, 80)' }}>
                {user?.fullName?.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate max-w-25">{user?.fullName}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="ml-2 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
              title="Logout"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
