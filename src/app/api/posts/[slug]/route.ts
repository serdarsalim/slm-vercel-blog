// src/app/api/posts/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPostBySlugServer } from '@/app/utils/loadBlogServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // Add this to prevent caching

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Log request for debugging
    console.log(`API: Fetching post with slug "${params.slug}"`);
    
    // Generate cache busting parameters for loadBlogServer functions
    const post = await getPostBySlugServer(params.slug);
    
    if (!post) {
      console.log(`Post with slug "${params.slug}" not found`);
      return NextResponse.json(
        { error: `Post with slug "${params.slug}" not found` },
        { status: 404 }
      );
    }
    
    // Log successful fetch
    console.log(`Successfully retrieved post: ${post.title}`);
    
    // Return with cache prevention headers
    return new Response(JSON.stringify(post), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
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