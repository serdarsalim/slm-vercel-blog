// src/app/admin/layout.tsx - Admin layout with auth context
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import AdminNavbar from './AdminNavbar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if the user is logged in from cookies
  const cookieStore = cookies();
  const adminToken = cookieStore.get('admin_token')?.value;
  
  // Only show the navbar if the user is logged in
  const showNavbar = adminToken && !String(cookieStore.get('admin_login_redirect')?.value);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white">
      {showNavbar && <AdminNavbar />}
      
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-10 h-10 border-4 border-gray-200 dark:border-gray-700 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
      }>
        {children}
      </Suspense>
    </div>
  );
}

