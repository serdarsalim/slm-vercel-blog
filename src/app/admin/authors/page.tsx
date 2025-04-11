// src/app/admin/authors/page.tsx
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import AuthorDashboard from './AuthorDashboard';

// This page requires admin authentication
export default async function AdminAuthorsPage() {
  // Check admin cookies for authentication
  const cookieStore = cookies();
  const adminToken = cookieStore.get('admin_token')?.value;
  
  // Get the admin token from environment variables
  const validAdminToken = process.env.ADMIN_API_TOKEN;
  
  // If not authenticated, redirect to login
  if (!adminToken || adminToken !== validAdminToken) {
    redirect('/admin/login');
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Author Management
          </h1>
          
          <Suspense fallback={
            <div className="mt-6 flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
            </div>
          }>
            <AuthorDashboard adminToken={adminToken} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

