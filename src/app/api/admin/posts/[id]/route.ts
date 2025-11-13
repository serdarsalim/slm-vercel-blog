import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { adminSupabase } from '@/lib/admin-supabase';
import { isAdminRequest } from '@/lib/admin-auth';

function normalizeCategories(input: unknown): string[] | undefined {
  if (input === undefined) return undefined;

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    const fields = [
      'title',
      'slug',
      'content',
      'excerpt',
      'date',
      'featured',
      'author',
      'author_handle',
      'featuredImage',
      'comment',
      'socmed',
      'published',
    ] as const;

    fields.forEach((field) => {
      if (field in body) {
        updates[field] = body[field];
      }
    });

    const categories = normalizeCategories(body.categories);
    if (categories !== undefined) {
      updates.categories = categories;
    }

    const { data, error } = await adminSupabase
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      console.error('Failed to update post:', error);
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }

    await triggerRevalidation(data.slug);

    return NextResponse.json({ post: data });
  } catch (error) {
    console.error('Unexpected error updating post:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
  }

  const { data: existing, error: fetchError } = await adminSupabase
    .from('posts')
    .select('slug')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    console.error('Error locating post before delete:', fetchError);
  }

  const { error } = await adminSupabase.from('posts').delete().eq('id', id);

  if (error) {
    console.error('Failed to delete post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }

  await triggerRevalidation(existing?.slug);

  return NextResponse.json({ success: true });
}
