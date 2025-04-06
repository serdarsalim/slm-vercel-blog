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
    
    if (!body.slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }
    
    console.log(`Revalidating post: ${body.slug}`);
    
    // First revalidate the path and tags
    revalidateTag('posts');
    revalidatePath(`/blog/${body.slug}`, 'page');
    
    // Wait for the revalidation to take effect (important!)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Force-fetch the post to warm the cache
    const post = await getPostBySlugServer(body.slug);
    
    if (!post) {
      console.warn(`Post not found after revalidation: ${body.slug}`);
      return NextResponse.json({
        success: false,
        message: 'Post not found after revalidation'
      });
    }
    
    console.log(`Successfully revalidated and verified: ${body.slug}`);
    
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