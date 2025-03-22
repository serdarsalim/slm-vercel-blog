// src/app/api/posts/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPostBySlugServer } from '@/app/utils/loadBlogServerPost';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const post = await getPostBySlugServer(params.slug);
    
    if (!post) {
      return NextResponse.json(
        { error: `Post with slug "${params.slug}" not found` },
        { status: 404 }
      );
    }
    
    return NextResponse.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}