'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg z-50">
      <div className="grid grid-cols-2 gap-1 px-2 py-2">
        <Link
          href="/"
          className={`flex flex-col items-center justify-center py-3 px-4 rounded-xl transition ${
            pathname === '/' 
              ? 'text-white shadow-md' 
              : 'text-gray-600 hover:bg-gray-50'
          }`}
          style={pathname === '/' ? { backgroundColor: 'rgb(231, 86, 80)' } : {}}
        >
          <svg className={`h-6 w-6 mb-1 ${pathname === '/' ? 'text-white' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span className="text-xs font-medium">My Files</span>
        </Link>
        <Link
          href="/shared"
          className={`flex flex-col items-center justify-center py-3 px-4 rounded-xl transition ${
            pathname === '/shared' 
              ? 'text-white shadow-md' 
              : 'text-gray-600 hover:bg-gray-50'
          }`}
          style={pathname === '/shared' ? { backgroundColor: 'rgb(231, 86, 80)' } : {}}
        >
          <svg className={`h-6 w-6 mb-1 ${pathname === '/shared' ? 'text-white' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span className="text-xs font-medium">Shared</span>
        </Link>
      </div>
    </nav>
  );
}
