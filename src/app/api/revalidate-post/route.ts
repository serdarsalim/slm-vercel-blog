// src/app/api/revalidate-post/route.ts
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  const body = await request.json();
  
  // Validate token
  if (body.secret !== process.env.REVALIDATION_SECRET) {
    return Response.json({ success: false, error: 'Invalid token' }, { status: 401 });
  }
  
  try {
    console.log('==== 🔍 SELECTIVE REVALIDATION STARTED ====');
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log(`👤 Author: ${body.authorHandle}`);
    
    // Revalidate all tags first (for data cache)
    if (body.tags && body.tags.length > 0) {
      console.log(`♻️ Revalidating ${body.tags.length} tags...`);
      body.tags.forEach((tag: string) => {
        revalidateTag(tag);
      });
    }
    
    // Then revalidate paths (for router cache)
    if (body.paths) {
      console.log(`📋 REVALIDATING THESE SPECIFIC PATHS:`);
      body.paths.forEach((path: string, idx: number) => {
        console.log(`👉 ${idx+1}. ${path}`);
        revalidatePath(path, 'page');
      });
    }
    
    return Response.json({
      revalidated: true,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return Response.json({ 
      revalidated: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// Add OPTIONS handler for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}