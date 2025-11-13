import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getServerSession } from 'next-auth';
import { adminSupabase } from '@/lib/admin-supabase';
import { authOptions, getServiceRoleClient } from '@/lib/auth-config';

function normalizeCategories(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
  }

  if (typeof input === 'string') {
    return input
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const client = getServiceRoleClient();
  const { data: author } = await client
    .from('authors')
    .select('id, role, handle, name, author_id')
    .eq('email', session.user.email)
    .maybeSingle();

  if (!author || author.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { author };
}

async function triggerRevalidation(slug?: string) {
  try {
    revalidateTag('posts');
    revalidatePath('/', 'page');
    revalidatePath('/blog', 'page');
    if (slug) {
      revalidatePath(`/posts/${slug}`, 'page');
    }
  } catch (error) {
    console.error('Error triggering revalidation:', error);
  }
}

export async function GET() {
  const adminCheck = await ensureAdmin();
  if ('error' in adminCheck) return adminCheck.error;

  const { data, error } = await adminSupabase
    .from('posts')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }

  return NextResponse.json({ posts: data ?? [] });
}

export async function POST(request: NextRequest) {
  const adminCheck = await ensureAdmin();
  if ('error' in adminCheck) return adminCheck.error;
  const { author } = adminCheck;

  try {
    const body = await request.json();

    if (!body.title || !body.slug || !body.content) {
      return NextResponse.json(
        { error: 'Title, slug, and content are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const newPost = {
      title: body.title.trim(),
      slug: body.slug.trim(),
      content: body.content,
      excerpt: body.excerpt?.trim() || '',
      date: body.date || now,
      categories: normalizeCategories(body.categories),
      featured: Boolean(body.featured),
      author: body.author?.trim() || author?.name || 'HALQA',
      author_handle: body.author_handle?.trim() || author?.handle || 'halqa',
      featuredImage: body.featuredImage?.trim() || '',
      comment: body.comment ?? true,
      socmed: body.socmed ?? true,
      published: Boolean(body.published),
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await adminSupabase
      .from('posts')
      .insert(newPost)
      .select('*')
      .single();

    if (error || !data) {
      console.error('Failed to create post:', error);
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }

    await triggerRevalidation(data.slug);

    return NextResponse.json({ post: data });
  } catch (error) {
    console.error('Unexpected error creating post:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
