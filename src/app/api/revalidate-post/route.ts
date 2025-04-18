// src/app/api/revalidate-post/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  const secretToken = process.env.REVALIDATION_SECRET || 'your_default_secret';

  try {
    const body = await request.json();
    
    if (body.secret !== secretToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Handle the content_updated flag for general content updates
    const isContentUpdate = body.content_updated === true;
    
    if (isContentUpdate) {
      console.log('Performing general content update revalidation');
      
      // Revalidate all key tags and paths for content updates
      revalidateTag('posts');
      revalidatePath('/', 'page');
      revalidatePath('/blog', 'page');
      
      // No specific post to fetch, just acknowledge the revalidation
      return NextResponse.json({
        success: true,
        message: 'General content update revalidation completed',
        timestamp: new Date().toISOString()
      });
    }
    
    // Otherwise we need specific post details
    if (!body.slug || !body.author_handle) {
      return NextResponse.json({ error: 'For specific post revalidation, both slug and author_handle are required' }, { status: 400 });
    }
    
    console.log(`Revalidating post: ${body.author_handle}/${body.slug}`);
    
    // Revalidate the specific post
    revalidateTag('posts');
    revalidateTag(`post-${body.slug}`);
    revalidatePath(`/${body.author_handle}/${body.slug}`, 'page');
    revalidatePath(`/blog/${body.slug}`, 'page'); // For backwards compatibility
    
    return NextResponse.json({
      success: true,
      message: `Post revalidated: ${body.author_handle}/${body.slug}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error revalidating post:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}