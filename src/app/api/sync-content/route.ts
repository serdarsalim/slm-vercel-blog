// src/app/api/sync-content/route.ts
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
  'lastModified': 'last_modified_at' // New field mapping for tracking changes
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
    const { posts = [], incrementalSync = false } = body;
    
    if (!Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json({ error: 'No posts data provided' }, { status: 400 });
    }
    
    console.log(`Processing ${posts.length} posts for ${incrementalSync ? 'incremental' : 'full'} sync...`);
    
    // Extract all slugs from incoming posts for efficient comparison
    const incomingSlugs = new Set(posts.map(p => p.slug));
    
    // Get all existing post slugs for comparison
    const { data: existingPosts, error: fetchError } = await supabase
      .from('posts')
      .select('slug, last_modified_at');
    
    if (fetchError) {
      console.error('Error fetching existing posts:', fetchError);
      return NextResponse.json({ 
        error: `Database error: ${fetchError.message}` 
      }, { status: 500 });
    }
    
    // Create mapping of existing slugs to their last modified dates
    const existingSlugs = new Set(existingPosts?.map(p => p.slug) || []);
    const existingModifiedDates = new Map();
    existingPosts?.forEach(post => {
      existingModifiedDates.set(post.slug, post.last_modified_at);
    });
    
    // Track operations
    let updated = 0;
    let inserted = 0;
    let deleted = 0;
    let skipped = 0;
    let errors = 0;
    
    // Process updates and inserts one by one for better error handling
    for (const post of posts) {
      try {
        // Map fields using the field mapping
        const mappedPost = {};
        
        // Process each field with the mapping
        Object.entries(post).forEach(([key, value]) => {
          // Get the corresponding database field name, or use the original if not in mapping
          const dbField = FIELD_MAPPING[key] || key;
          mappedPost[dbField] = value;
        });
        
        // Special handling for booleans and arrays
        if ('featured' in mappedPost) {
          mappedPost['featured'] = mappedPost['featured'] === 'TRUE' || 
                                   mappedPost['featured'] === 'true' || 
                                   mappedPost['featured'] === true;
        }
        
        if ('comment' in mappedPost) {
          mappedPost['comment'] = mappedPost['comment'] === 'TRUE' || 
                                  mappedPost['comment'] === 'true' || 
                                  mappedPost['comment'] === true;
        }
        
        if ('socmed' in mappedPost) {
          mappedPost['socmed'] = mappedPost['socmed'] === 'TRUE' || 
                                 mappedPost['socmed'] === 'true' || 
                                 mappedPost['socmed'] === true;
        }
        
    
        
        // Handle categories
        if ('categories' in mappedPost && typeof mappedPost['categories'] === 'string') {
          // Try to convert string categories to array
          let categoriesArray = [];
          
          if (mappedPost['categories'].includes('|')) {
            categoriesArray = mappedPost['categories'].split('|').map(c => c.trim()).filter(Boolean);
          } else if (mappedPost['categories'].includes(',')) {
            categoriesArray = mappedPost['categories'].split(',').map(c => c.trim()).filter(Boolean);
          } else if (mappedPost['categories'].trim()) {
            categoriesArray = [mappedPost['categories'].trim()];
          }
          
          mappedPost['categories'] = categoriesArray;
        }
        
        // Add timestamps
        mappedPost['updated_at'] = new Date().toISOString();
        
        // If no explicit last_modified_at, use the current time
        if (!mappedPost['last_modified_at']) {
          mappedPost['last_modified_at'] = new Date().toISOString();
        }
        
        // Check if post exists
        const exists = existingSlugs.has(post.slug);
        
        if (exists) {
          // For incremental sync, check if the post has been modified
          if (incrementalSync) {
            const existingModifiedDate = existingModifiedDates.get(post.slug);
            const incomingModifiedDate = mappedPost['last_modified_at'];
            
            // Skip update if post hasn't changed (and we have valid timestamps)
            if (existingModifiedDate && incomingModifiedDate && 
                new Date(existingModifiedDate) >= new Date(incomingModifiedDate)) {
              skipped++;
              continue;
            }
          }
          
          // Update existing post
          const { error } = await supabase
            .from('posts')
            .update(mappedPost)
            .eq('slug', post.slug);
          
          if (error) {
            console.error(`Error updating post ${post.slug}:`, error);
            errors++;
          } else {
            updated++;
          }
        } else {
          // Add created_at for new posts
          mappedPost['created_at'] = new Date().toISOString();
          
          // Insert new post
          const { error } = await supabase
            .from('posts')
            .insert([mappedPost]);
          
          if (error) {
            console.error(`Error inserting post ${post.slug}:`, error);
            errors++;
          } else {
            inserted++;
          }
        }
      } catch (err) {
        console.error(`Error processing post ${post.slug}:`, err);
        errors++;
      }
    }
    
   // After processing individual posts, handle deletions
    
// Find posts to delete (in DB but not in incoming data)
const slugsToDelete = Array.from(existingSlugs).filter(slug => !incomingSlugs.has(slug));
    
// Only delete posts in full sync mode (not incremental)
if (!incrementalSync && slugsToDelete.length > 0) {
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .in('slug', slugsToDelete);
    
    if (error) {
      console.error('Error deleting posts:', error);
      errors += slugsToDelete.length;
    } else {
      deleted = slugsToDelete.length;
    }
  } catch (err) {
    console.error('Error deleting posts:', err);
    errors += slugsToDelete.length;
  }
}
    
    // Revalidate paths after database changes
    if (updated > 0 || inserted > 0 || deleted > 0) {
      console.log('Changes detected, revalidating cache...');
      revalidateTag('posts');
      revalidatePath('/', 'page');
      revalidatePath('/blog', 'page');
      
      // Additional specific revalidations for newly added posts
      if (inserted > 0) {
        // Get slugs of newly inserted posts
        const newPosts = posts.filter(post => {
          const mappedSlug = post.slug || '';
          return !existingSlugs.has(mappedSlug);
        });
        
        // Revalidate each new post page individually
        for (const post of newPosts) {
          if (post.slug) {
            revalidatePath(`/blog/${post.slug}`, 'page');
          }
        }
      }
    }
    
    const syncTimestamp = new Date().toISOString();
    
    return NextResponse.json({
      success: true,
      stats: { updated, inserted, deleted, skipped, errors },
      syncTimestamp: syncTimestamp,
      timestamp: syncTimestamp
    });
    
  } catch (error) {
    console.error('Error processing sync request:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Add OPTIONS handler for CORS preflight requests
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