import { NextRequest, NextResponse } from 'next/server';
import { getPostBySlugServer } from '@/app/utils/loadBlogServer';

// Remove dynamic = 'force-dynamic' to allow caching
export const runtime = 'nodejs';

// Set revalidation time instead
export const revalidate = 86400; // 24 hours

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    console.log(`API: Fetching post with slug "${params.slug}"`);
    
    // Get the post with revalidation tag
    const post = await getPostBySlugServer(params.slug);
    
    if (!post) {
      console.log(`Post with slug "${params.slug}" not found`);
      return NextResponse.json(
        { error: `Post with slug "${params.slug}" not found` },
        { status: 404 }
      );
    }
    
    console.log(`Successfully retrieved post: ${post.title}`);
    
    // Return with cache-friendly headers
    return NextResponse.json(post, {
      headers: {
        // Use stale-while-revalidate pattern instead of no-cache
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'
      }
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}