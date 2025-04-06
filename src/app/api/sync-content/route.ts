// /Users/slm/my-portfolio/vercel-blog/src/app/api/sync-content/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { revalidatePath, revalidateTag } from 'next/cache';

// Map CSV column names to database fields (adjust to match your sheet)
const FIELD_MAPPING: Record<string, string> = {
  'title': 'title',
  'slug': 'slug', 
  'content': 'content',
  'excerpt': 'excerpt',
  'date': 'date',
  'categories': 'categories',
  'featured': 'featured',
  'author': 'author',
  'featuredImage': 'featuredImage',
  'comment': 'comment',
  'socmed': 'socmed',
  'load': 'published'
};

export async function POST(request: NextRequest) {
  try {
    // Get the secret token from env vars
    const secretToken = process.env.REVALIDATION_SECRET || 'your_default_secret';
    
    const body = await request.json();
    
    // Validate request
    if (body.secret !== secretToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Parse posts data from request
    const { posts = [] } = body;
    
    if (!Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json({ error: 'No posts data provided' }, { status: 400 });
    }
    
    console.log(`Processing ${posts.length} posts for sync...`);
    
    // Get all existing post slugs for comparison
    const { data: existingPosts } = await supabase
      .from('posts')
      .select('slug');
    
    const existingSlugs = new Set(existingPosts?.map(p => p.slug) || []);
    const newSlugs = new Set(posts.map(p => p.slug));
    
    // Find posts to delete (in DB but not in sheet)
    const slugsToDelete = Array.from(existingSlugs).filter(slug => !newSlugs.has(slug));
    
    // Track operations
    let updated = 0;
    let inserted = 0;
    let deleted = 0;
    let errors = 0;
    
    // Process updates and inserts
    for (const post of posts) {
      try {
        // Check if this post exists
        const exists = existingSlugs.has(post.slug);
        
        if (exists) {
          // Update existing post
          const { error } = await supabase
            .from('posts')
            .update({
              ...post,
              updated_at: new Date().toISOString()
            })
            .eq('slug', post.slug);
          
          if (error) throw error;
          updated++;
        } else {
          // Insert new post
          const { error } = await supabase
            .from('posts')
            .insert([{
              ...post,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }]);
          
          if (error) throw error;
          inserted++;
        }
      } catch (err) {
        console.error(`Error processing post ${post.slug}:`, err);
        errors++;
      }
    }
    
    // Delete posts that were removed from the sheet
    if (slugsToDelete.length > 0) {
      try {
        const { error } = await supabase
          .from('posts')
          .delete()
          .in('slug', slugsToDelete);
        
        if (error) throw error;
        deleted = slugsToDelete.length;
      } catch (err) {
        console.error('Error deleting posts:', err);
        errors++;
      }
    }
    
    // Revalidate paths after database changes
    revalidateTag('posts');
    revalidatePath('/', 'page');
    revalidatePath('/blog', 'page');
    
    return NextResponse.json({
      success: true,
      stats: { updated, inserted, deleted, errors },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error processing sync request:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}