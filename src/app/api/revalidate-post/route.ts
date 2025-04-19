// app/api/revalidate-post/route.js
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

// Environment variable for your token (set this in Vercel)
const REVALIDATION_TOKEN = process.env.REVALIDATION_TOKEN;

export async function POST(request) {
  console.log('🔄 Revalidation request received');
  
  // Parse the incoming JSON request
  let payload;
  try {
    payload = await request.json();
    console.log('📦 Payload received:', JSON.stringify({
      paths: payload.paths?.length,
      tags: payload.tags?.length,
      author: payload.authorHandle,
      forceRefresh: payload.forceRefresh,
      postCount: payload.postDetails?.length
    }));
  } catch (error) {
    console.error('❌ Failed to parse request body:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid JSON payload' 
    }, { status: 400 });
  }

  // Verify the secret token
  const { secret, paths, tags, authorHandle, postDetails } = payload;

  if (!secret || secret !== REVALIDATION_TOKEN) {
    console.error('🚫 Invalid revalidation token');
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid token' 
    }, { status: 401 });
  }

  try {
    // Create a detailed log of what we're revalidating
    console.log(`==== 🔄 REVALIDATION PROCESSING ====`);
    console.log(`⏱️ Time: ${new Date().toISOString()}`);
    console.log(`👤 Author: ${authorHandle || 'N/A'}`);
    
    // Track revalidation actions
    const revalidatedPaths = [];
    const revalidatedTags = [];

    // Process paths for revalidation
    if (Array.isArray(paths) && paths.length > 0) {
      for (const path of paths) {
        if (typeof path === 'string') {
          console.log(`🔄 Revalidating path: ${path}`);
          revalidatePath(path);
          revalidatedPaths.push(path);
        }
      }
      console.log(`✅ Revalidated ${revalidatedPaths.length} paths`);
    }

    // Process tags for revalidation
    if (Array.isArray(tags) && tags.length > 0) {
      for (const tag of tags) {
        if (typeof tag === 'string') {
          console.log(`🏷️ Revalidating tag: ${tag}`);
          revalidateTag(tag);
          revalidatedTags.push(tag);
        }
      }
      console.log(`✅ Revalidated ${revalidatedTags.length} tags`);
    }

    // Log post details if available
    if (Array.isArray(postDetails) && postDetails.length > 0) {
      console.log(`📝 Posts affected: ${postDetails.length}`);
      postDetails.forEach((post, index) => {
        console.log(`  ${index + 1}. ${post.title || 'Untitled'} (${post.slug})`);
      });
    }

    console.log(`==== ✅ REVALIDATION COMPLETE ====`);

    // Return a success response with detailed information
    return NextResponse.json({
      success: true,
      revalidated: {
        paths: revalidatedPaths,
        tags: revalidatedTags,
      },
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    // Log the error for debugging
    console.error('❌ Revalidation error:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Revalidation failed',
    }, { status: 500 });
  }
}