'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import MobileNav from './MobileNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  
  if (isAuthPage || loading || !user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'rgb(239, 250, 248)' }}>
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader />
        {children}
        <MobileNav />
      </div>
    </div>
  );
}
