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
    
    // NEW: Handle paths array for selective revalidation
    if (Array.isArray(body.paths) && body.paths.length > 0) {
      console.log(`\n==== 🔍 SELECTIVE REVALIDATION STARTED ====`);
      console.log(`📅 Timestamp: ${new Date().toISOString()}`);
      console.log(`👤 Author: ${body.authorHandle || 'Unknown'}`);
      console.log(`🔢 Paths to revalidate: ${body.paths.length}`);
      
      // 1. Always revalidate posts tag for consistency
      console.log(`\n♻️ Revalidating general 'posts' tag...`);
      revalidateTag('posts');
      
      // 2. Revalidate each specific path with detailed logging
      console.log(`\n📋 REVALIDATING THESE SPECIFIC PATHS:`);
      
      const revalidatedPaths = [];
      const revalidatedTags = [];
      
      body.paths.forEach((path, index) => {
        // Process the path to determine what type it is
        const pathParts = path.split('/').filter(Boolean);
        
        // Skip API routes
        if (path.startsWith('/api/')) {
          console.log(`   ⚠️ ${index+1}. ${path} (SKIPPED - API route)`);
          return;
        }
        
        // Determine path type
        let pathType = 'unknown';
        let icon = '🔄';
        
        if (path === '/' || path === '') {
          pathType = 'homepage';
          icon = '🏠';
        } else if (pathParts.length === 1) {
          pathType = 'author';
          icon = '👤';
        } else if (pathParts.length >= 2) {
          pathType = 'post';
          icon = '📝';
        }
        
        // Log the path being revalidated
        console.log(`   ${icon} ${index+1}. ${path} (${pathType})`);
        
        // Ensure path starts with / for revalidatePath
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        
        // Revalidate the path
        revalidatePath(normalizedPath, 'page');
        revalidatedPaths.push(normalizedPath);
        
        // For posts, also revalidate specific tags
        if (pathType === 'post' && pathParts.length >= 2) {
          const authorHandle = pathParts[0];
          const slug = pathParts[1];
          
          // Revalidate post-specific tags
          revalidateTag(`post-${slug}`);
          revalidateTag(`post-${authorHandle}-${slug}`);
          
          console.log(`      ✓ Also revalidated tags: post-${slug}, post-${authorHandle}-${slug}`);
          revalidatedTags.push(`post-${slug}`);
          revalidatedTags.push(`post-${authorHandle}-${slug}`);
        }
      });
      
      // 3. Final summary
      console.log(`\n✅ SELECTIVE REVALIDATION COMPLETE`);
      console.log(`   📄 Paths revalidated: ${revalidatedPaths.length}`);
      console.log(`   🏷️ Tags revalidated: ${revalidatedTags.length + 1}`); // +1 for 'posts' tag
      console.log(`===========================================\n`);
      
      return NextResponse.json({
        success: true,
        message: `Selectively revalidated ${revalidatedPaths.length} paths and ${revalidatedTags.length + 1} tags`,
        paths: revalidatedPaths,
        tags: ['posts', ...revalidatedTags],
        timestamp: new Date().toISOString()
      });
    }
    
    // LEGACY: Handle the content_updated flag for general content updates
    const isContentUpdate = body.content_updated === true;
    
    if (isContentUpdate) {
      console.log('\n==== 🔄 GENERAL CONTENT UPDATE REVALIDATION ====');
      console.log('📅 Timestamp: ' + new Date().toISOString());
      
      // Revalidate all key tags and paths for content updates
      console.log('♻️ Revalidating general tags and paths...');
      revalidateTag('posts');
      revalidatePath('/', 'page');
      revalidatePath('/blog', 'page');
      
      console.log('✅ GENERAL REVALIDATION COMPLETE');
      console.log('===========================================\n');
      
      // No specific post to fetch, just acknowledge the revalidation
      return NextResponse.json({
        success: true,
        message: 'General content update revalidation completed',
        timestamp: new Date().toISOString()
      });
    }
    
    // LEGACY: Otherwise we need specific post details
    if (!body.slug || !body.author_handle) {
      return NextResponse.json({ error: 'For specific post revalidation, both slug and author_handle are required' }, { status: 400 });
    }
    
    console.log(`\n==== 📝 SINGLE POST REVALIDATION ====`);
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log(`👤 Author: ${body.author_handle}`);
    console.log(`📄 Post: ${body.slug}`);
    
    // Revalidate the specific post
    console.log('\n♻️ Revalidating tags and paths...');
    revalidateTag('posts');
    revalidateTag(`post-${body.slug}`);
    revalidateTag(`post-${body.author_handle}-${body.slug}`);
    
    // Log each path being revalidated
    console.log(`   📝 /${body.author_handle}/${body.slug}`);
    revalidatePath(`/${body.author_handle}/${body.slug}`, 'page');
    
    console.log(`   👤 /${body.author_handle}`);
    revalidatePath(`/${body.author_handle}`, 'page');
    
    console.log(`   🏠 /`);
    revalidatePath('/', 'page');
    
    // For backwards compatibility
    console.log(`   📜 /blog/${body.slug} (backwards compatibility)`);
    revalidatePath(`/blog/${body.slug}`, 'page');
    
    console.log('\n✅ SINGLE POST REVALIDATION COMPLETE');
    console.log('===========================================\n');
    
    return NextResponse.json({
      success: true,
      message: `Post revalidated: ${body.author_handle}/${body.slug}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ ERROR REVALIDATING:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Add OPTIONS handler for CORS like the other endpoints
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}