// app/api/revalidate-post/route.js
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { getRequiredEnvVar } from '@/lib/env';

const secretToken = getRequiredEnvVar('REVALIDATION_SECRET');

export async function POST(request) {
  console.log('==== 🔄 REVALIDATION REQUEST RECEIVED ====');
  console.log(`⏱️ Timestamp: ${new Date().toISOString()}`);
  
  // Parse the incoming JSON request
  let payload;
  try {
    payload = await request.json();
    
    // Log the author and post details immediately
    console.log(`👤 AUTHOR: ${payload.authorHandle || 'Unknown'}`);
    
    if (Array.isArray(payload.postDetails) && payload.postDetails.length > 0) {
      console.log(`📝 POSTS AFFECTED: ${payload.postDetails.length}`);
      payload.postDetails.forEach((post, index) => {
        console.log(`  ${index + 1}. ID: ${post.id || 'N/A'} | Title: ${post.title || 'Untitled'} | Slug: ${post.slug || 'N/A'}`);
      });
    } else {
      console.log(`📝 POSTS AFFECTED: None specified`);
    }
    
    console.log(`📦 PAYLOAD SUMMARY: ${payload.paths?.length || 0} paths, ${payload.tags?.length || 0} tags`);
  } catch (error) {
    console.error('❌ Failed to parse request body:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid JSON payload' 
    }, { status: 400 });
  }

  // Verify the secret token
  if (payload.secret !== secretToken) {
    console.error('🚫 Invalid revalidation token');
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid token' 
    }, { status: 401 });
  }

  try {
    const { paths, tags, authorHandle, postDetails, operation } = payload;
    
    // Log the operation type if provided
    if (operation) {
      console.log(`🔄 OPERATION TYPE: ${operation}`);
    }
    
    // Detailed logging for paths
    console.log(`==== 🔄 REVALIDATING PATHS ====`);
    if (Array.isArray(paths) && paths.length > 0) {
      paths.forEach((path, index) => {
        if (typeof path === 'string') {
          console.log(`  ${index + 1}. 🔄 ${path}`);
          revalidatePath(path);
        }
      });
      console.log(`✅ REVALIDATED ${paths.length} PATHS`);
    } else {
      console.log(`⚠️ NO PATHS TO REVALIDATE`);
    }
    
    // Detailed logging for tags
    console.log(`==== 🏷️ REVALIDATING TAGS ====`);
    if (Array.isArray(tags) && tags.length > 0) {
      tags.forEach((tag, index) => {
        if (typeof tag === 'string') {
          console.log(`  ${index + 1}. 🏷️ ${tag}`);
          revalidateTag(tag);
        }
      });
      console.log(`✅ REVALIDATED ${tags.length} TAGS`);
    } else {
      console.log(`⚠️ NO TAGS TO REVALIDATE`);
    }
    
    // Summary with author and operation details
    console.log(`==== ✅ REVALIDATION COMPLETE ====`);
    console.log(`👤 Author: ${authorHandle || 'None provided'}`);
    console.log(`📝 Posts: ${postDetails?.length || 0}`);
    console.log(`🔄 Operation: ${operation || 'Not specified'}`);
    console.log(`📄 Paths: ${paths?.length || 0}`);
    console.log(`🏷️ Tags: ${tags?.length || 0}`);
    console.log(`⏱️ Completed: ${new Date().toISOString()}`);
    console.log(`=======================================`);

    // Return a success response
    return NextResponse.json({
      success: true,
      authorHandle,
      postsAffected: postDetails?.length || 0,
      pathsRevalidated: paths?.length || 0,
      tagsRevalidated: tags?.length || 0,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('❌ REVALIDATION ERROR:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message
    }, { status: 500 });
  }
}
