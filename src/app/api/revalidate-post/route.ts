// src/app/api/revalidate-post/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  const secretToken = process.env.REVALIDATION_SECRET || 'your_default_secret';

  try {
    const body = await request.json();
    
    // Log the entire request for debugging
    console.log('\n==== 📥 REVALIDATION REQUEST RECEIVED ====');
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    // Validate token
    if (body.secret !== secretToken && body.token !== secretToken) {
      console.log('❌ INVALID TOKEN PROVIDED');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // SELECTIVE REVALIDATION - NEW FORMAT
    if (Array.isArray(body.paths) || Array.isArray(body.tags)) {
      console.log(`\n==== 🔍 SELECTIVE REVALIDATION STARTED ====`);
      console.log(`📅 Timestamp: ${new Date().toISOString()}`);
      console.log(`👤 Author: ${body.authorHandle || 'Unknown'}`);
      
      // 1. Revalidate tags first
      if (Array.isArray(body.tags) && body.tags.length > 0) {
        console.log(`\n♻️ Revalidating ${body.tags.length} tags...`);
        body.tags.forEach((tag: string) => {
          console.log(`   🏷️ Revalidating tag: ${tag}`);
          revalidateTag(tag);
        });
      } else {
        // Always revalidate posts tag
        console.log(`\n♻️ Revalidating 'posts' tag by default...`);
        revalidateTag('posts');
      }
      
      // 2. Then revalidate paths
      if (Array.isArray(body.paths) && body.paths.length > 0) {
        console.log(`\n📋 REVALIDATING THESE SPECIFIC PATHS:`);
        
        body.paths.forEach((path: string, idx: number) => {
          // Skip API routes
          if (path.startsWith('/api/')) {
            console.log(`   ⚠️ ${idx+1}. ${path} (SKIPPED - API route)`);
            return;
          }
          
          // Determine path type for better logging
          const pathParts = path.split('/').filter(Boolean);
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
          console.log(`   ${icon} ${idx+1}. ${path} (${pathType})`);
          
          // Ensure path starts with / for revalidatePath
          const normalizedPath = path.startsWith('/') ? path : `/${path}`;
          revalidatePath(normalizedPath, 'page');
        });
      } else {
        console.log('⚠️ No paths provided for revalidation');
      }
      
      // Final summary
      console.log(`\n✅ SELECTIVE REVALIDATION COMPLETE`);
      console.log(`   📄 Paths revalidated: ${Array.isArray(body.paths) ? body.paths.length : 0}`);
      console.log(`   🏷️ Tags revalidated: ${Array.isArray(body.tags) ? body.tags.length : 1}`); // +1 for 'posts' tag
      console.log(`===========================================\n`);
      
      return NextResponse.json({
        success: true,
        revalidated: true,
        message: `Revalidation complete for ${body.authorHandle || 'Unknown'}`,
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
        revalidated: true,
        message: 'General content update revalidation completed',
        timestamp: new Date().toISOString()
      });
    }
    
    // LEGACY: Otherwise we need specific post details
    if (!body.slug && !body.author_handle && (!body.paths || body.paths.length === 0)) {
      return NextResponse.json({ 
        error: 'Missing required fields. Need either slug+author_handle or paths array' 
      }, { status: 400 });
    }
    
    // LEGACY: Handle single post revalidation format
    if (body.slug && body.author_handle) {
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
        revalidated: true,
        message: `Post revalidated: ${body.author_handle}/${body.slug}`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Fallback general revalidation if we couldn't determine the specific format
    console.log('\n⚠️ USING FALLBACK GENERAL REVALIDATION');
    console.log('Request did not match any specific format, doing general revalidation');
    
    revalidateTag('posts');
    revalidatePath('/', 'page');
    
    console.log('✅ FALLBACK REVALIDATION COMPLETE');
    console.log('===========================================\n');
    
    return NextResponse.json({
      success: true,
      revalidated: true,
      message: 'Fallback revalidation completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ ERROR REVALIDATING:', error);
    return NextResponse.json(
      { success: false, revalidated: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Add OPTIONS handler for CORS
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