// src/app/api/revalidate-post/route.ts
// src/app/api/revalidate-post/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getPostBySlugServer } from '@/lib/data';

export async function POST(request: NextRequest) {
  const secretToken = process.env.REVALIDATION_SECRET || 'your_default_secret';

  try {
    const body = await request.json();
    
    if (body.secret !== secretToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    if (!body.slug || !body.author_handle) {
      return NextResponse.json({ error: 'Both slug and author_handle are required' }, { status: 400 });
    }
    
    console.log(`Revalidating post: ${body.author_handle}/${body.slug}`);
    
    // First revalidate the path with the new URL structure (without /blog/)
    revalidateTag('posts');
    revalidatePath(`/${body.author_handle}/${body.slug}`, 'page');
    
    // Wait for the revalidation to take effect (important!)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Force-fetch the post to warm the cache
    // Since getPostBySlugServer only takes slug parameter, we'll use that for now
    const post = await getPostBySlugServer(body.slug);
    
    if (!post) {
      console.warn(`Post not found after revalidation: ${body.author_handle}/${body.slug}`);
      return NextResponse.json({
        success: false,
        message: 'Post not found after revalidation'
      });
    }
    
    console.log(`Successfully revalidated and verified: ${body.author_handle}/${body.slug}`);
    
    return NextResponse.json({
      success: true,
      message: `Post revalidated and verified: ${post.title}`
    });
  } catch (error) {
    console.error('Error revalidating post:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}