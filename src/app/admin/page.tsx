import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminSupabase } from '@/lib/admin-supabase';
import PostManager from './components/PostManager';

export default async function AdminPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('admin_token')?.value;
  const expected = process.env.ADMIN_API_TOKEN;

  if (!token || !expected || token !== expected) {
    redirect('/admin/login');
  }

  const { data, error } = await adminSupabase
    .from('posts')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Failed to load posts for admin:', error);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.3em] text-orange-500 mb-2">
          Admin
        </p>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
          Post Manager
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Create, edit, publish, and archive posts from one workspace.
        </p>
      </div>

      <PostManager initialPosts={data ?? []} />
    </div>
  );
}
