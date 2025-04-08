// src/app/api/sync-content/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { revalidatePath, revalidateTag } from "next/cache";

// Map CSV column names to database fields
const FIELD_MAPPING: Record<string, string> = {
  id: "id", // Explicit ID mapping
  title: "title",
  slug: "slug",
  content: "content",
  excerpt: "excerpt",
  date: "date",
  categories: "categories",
  featured: "featured",
  author: "author",
  featuredImage: "featuredImage",
  comment: "comment",
  socmed: "socmed",
  lastModified: "updated_at",
  position: "position",
};

/**
 * Improved date normalization that handles more formats
 */
function normalizeDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  
  try {
    // First try direct ISO conversion
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
    
    // Google Sheets format - often "YYYY-MM-DD HH:MM:SS+00"
    if (dateStr.includes(' ') && !dateStr.includes('T')) {
      // Replace space with T for ISO format
      let normalized = dateStr.replace(' ', 'T');
      
      // Add seconds if missing
      if (normalized.match(/T\d{2}:\d{2}$/)) {
        normalized += ':00';
      }
      
      // Add timezone if missing
      if (!normalized.includes('Z') && !normalized.includes('+') && !normalized.includes('-')) {
        normalized += 'Z';
      }
      
      // Add minutes to timezone offset if missing
      if (normalized.match(/[+-]\d{2}$/)) {
        normalized += ':00';
      }
      
      // Try parsing again
      const parsedDate = new Date(normalized);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString();
      }
    }
    
    // If all parsing fails, return current date
    console.warn(`Could not parse date: ${dateStr}, using current time`);
    return new Date().toISOString();
  } catch (e) {
    console.error(`Date parsing error for ${dateStr}:`, e);
    return new Date().toISOString();
  }
}

export async function POST(request: NextRequest) {
  // Generate a unique request ID for tracing this sync operation
  const requestId = `sync-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const startTime = Date.now();
  
  console.log(`[${requestId}] Starting sync operation`);
  
  try {
    // Get the secret token from env vars
    const secretToken = process.env.REVALIDATION_SECRET || "your_default_secret";
    const body = await request.json();

    // Validate request
    if (body.secret !== secretToken) {
      console.warn(`[${requestId}] Invalid token provided`);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Parse posts data from request
    const { posts = [], optimizeByDate = false } = body;

    if (!Array.isArray(posts) || posts.length === 0) {
      console.warn(`[${requestId}] No posts data provided`);
      return NextResponse.json(
        { error: "No posts data provided" },
        { status: 400 }
      );
    }

    console.log(`[${requestId}] Processing ${posts.length} posts with ID-based sync (optimizeByDate: ${optimizeByDate})`);

    // Set up the main sync process
    // Validate posts - Accept both string and numeric IDs
    const validPosts = posts.filter(post => {
      if (!post.id) {
        console.warn(`[${requestId}] Skipping post without ID`);
        return false;
      }
      return true;
    });

    console.log(`[${requestId}] Validated ${validPosts.length} of ${posts.length} posts`);

    // Convert all IDs to strings for consistent comparison
    const incomingIds = new Set(validPosts.map((p) => String(p.id)));
    
    // For revalidation purposes, we still collect slugs
    const incomingSlugs = new Map();
    validPosts.forEach(post => {
      if (post.id && post.slug) {
        incomingSlugs.set(String(post.id), post.slug);
      }
    });

    // Get all existing post IDs and their last modified dates
    const { data: existingPosts, error: fetchError } = await supabase
      .from("posts")
      .select("id, slug, updated_at");

    if (fetchError) {
      console.error(`[${requestId}] Error fetching existing posts:`, fetchError);
      throw new Error(`Database error: ${fetchError.message}`);
    }

    // Create mapping of existing IDs to their last modified dates - as strings
    const existingIds = new Set((existingPosts || []).map((p) => String(p.id)));
    const existingModifiedDates = new Map();
    const existingSlugsById = new Map(); // Keep track of slugs for revalidation
    
    (existingPosts || []).forEach((post) => {
      existingModifiedDates.set(String(post.id), post.updated_at);
      existingSlugsById.set(String(post.id), post.slug);
    });

    // Track operations
    let updated = 0;
    let inserted = 0;
    let deleted = 0;
    let skipped = 0;
    let errors = 0;

    console.log(`[${requestId}] Found ${existingIds.size} existing posts in database`);

    // Process in batches for better performance
    const BATCH_SIZE = 50;
    const updateBatch = [];
    const insertBatch = [];
    
    // First, categorize posts into update or insert batches
    for (const post of validPosts) {
      try {
        // Map fields using the field mapping
        const mappedPost: any = {};

        // Convert ID to string for consistency
        mappedPost.id = String(post.id);

        // Process each field with the mapping
        Object.entries(post).forEach(([key, value]) => {
          if (key === 'id') return; // Skip id as we already handled it
          
          const dbField = FIELD_MAPPING[key] || key;
          mappedPost[dbField] = value;
        });

        // Handle categories with text: prefix
        if (
          typeof post.categories === "string" &&
          post.categories.startsWith("text:")
        ) {
          mappedPost["categories"] = post.categories.substring(5);
        }

        // Handle boolean fields
        ['featured', 'comment', 'socmed'].forEach(field => {
          if (field in mappedPost) {
            mappedPost[field] = 
              mappedPost[field] === "TRUE" ||
              mappedPost[field] === "true" ||
              mappedPost[field] === true;
          }
        });

        // Handle categories as arrays
        if (
          "categories" in mappedPost &&
          typeof mappedPost["categories"] === "string"
        ) {
          let categoriesArray = [];

          if (mappedPost["categories"].includes("|")) {
            categoriesArray = mappedPost["categories"]
              .split("|")
              .map((c:string) => c.trim())
              .filter(Boolean);
          } else if (mappedPost["categories"].includes(",")) {
            categoriesArray = mappedPost["categories"]
              .split(",")
              .map((c:string) => c.trim())
              .filter(Boolean);
          } else if (mappedPost["categories"].trim()) {
            categoriesArray = [mappedPost["categories"].trim()];
          }

          mappedPost["categories"] = categoriesArray;
        }

        // Check if post exists BY ID (not slug)
        const exists = existingIds.has(String(post.id));

        if (exists) {
          const existingModifiedDate = existingModifiedDates.get(String(post.id));
          let incomingModifiedDate = post.lastModified;
          
          // ONLY skip update if optimizeByDate is true AND we have valid timestamps
          if (
            optimizeByDate === true && // <-- KEY FIX: Only optimize if flag is true
            existingModifiedDate &&
            incomingModifiedDate &&
            typeof incomingModifiedDate === "string"
          ) {
            // Normalize date formats before comparison
            const normalizedExisting = normalizeDate(existingModifiedDate);
            const normalizedIncoming = normalizeDate(incomingModifiedDate);
            
            const existingDate = new Date(normalizedExisting);
            const incomingDate = new Date(normalizedIncoming);
            
            if (!isNaN(existingDate.getTime()) && !isNaN(incomingDate.getTime())) {
              if (existingDate.getTime() >= incomingDate.getTime()) {
                console.log(`[${requestId}] Skipping post ID ${post.id} - not modified since last sync`);
                skipped++;
                continue;
              }
            }
          }

          // Always ensure we're storing the lastModified date correctly
          if (post.lastModified) {
            try {
              const parsedDate = new Date(post.lastModified);
              if (!isNaN(parsedDate.getTime())) {
                mappedPost["updated_at"] = parsedDate.toISOString();
              }
            } catch (e) {
              console.warn(`[${requestId}] Failed to parse lastModified date for post ID ${post.id}:`, e);
              mappedPost["updated_at"] = new Date().toISOString();
            }
          } else {
            mappedPost["updated_at"] = new Date().toISOString();
          }

          // Add to update batch
          updateBatch.push(mappedPost);
        } else {
          // Add created_at for new posts
          mappedPost["created_at"] = mappedPost["updated_at"] || new Date().toISOString();
          
          // Add to insert batch
          insertBatch.push(mappedPost);
        }
      } catch (err) {
        const identifier = post.id || "unknown";
        console.error(`[${requestId}] Error processing post ${identifier}:`, err);
        console.error(`[${requestId}] Problematic post data:`, JSON.stringify(post).substring(0, 500));
        errors++;
      }
    }

    console.log(`[${requestId}] Categorized posts: ${updateBatch.length} updates, ${insertBatch.length} inserts`);

    // Process update batch
    if (updateBatch.length > 0) {
      // Process in chunks to avoid overwhelming the database
      for (let i = 0; i < updateBatch.length; i += BATCH_SIZE) {
        const chunk = updateBatch.slice(i, i + BATCH_SIZE);
        console.log(`[${requestId}] Processing update chunk ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(updateBatch.length/BATCH_SIZE)}`);
        
        // Update each post individually to better trace errors
        for (const post of chunk) {
          try {
            const result = await supabase
              .from("posts")
              .update(post)
              .eq("id", post.id);
            
            if (result.error) {
              console.error(`[${requestId}] Error updating post ID ${post.id}:`, result.error);
              console.error(`[${requestId}] Post data causing error:`, JSON.stringify(post).substring(0, 500));
              errors++;
            } else {
              updated++;
            }
          } catch (error) {
            console.error(`[${requestId}] Exception updating post ID ${post.id}:`, error);
            errors++;
          }
        }
      }
    }

    // Process insert batch
    if (insertBatch.length > 0) {
      // Process in chunks to avoid overwhelming the database
      for (let i = 0; i < insertBatch.length; i += BATCH_SIZE) {
        const chunk = insertBatch.slice(i, i + BATCH_SIZE);
        console.log(`[${requestId}] Processing insert chunk ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(insertBatch.length/BATCH_SIZE)}`);
        
        try {
          const result = await supabase
            .from("posts")
            .upsert(chunk, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            });

          if (result.error) {
            console.error(`[${requestId}] Error inserting ${chunk.length} posts:`, result.error);
            console.error(`[${requestId}] First post in batch:`, JSON.stringify(chunk[0]).substring(0, 500));
            errors += chunk.length;
          } else {
            inserted += chunk.length;
          }
        } catch (error) {
          console.error(`[${requestId}] Exception inserting batch:`, error);
          errors += chunk.length;
        }
      }
    }

    // Find posts to delete (in DB but not in incoming data)
    const idsToDelete = Array.from(existingIds).filter(
      (id) => !incomingIds.has(id)
    );

    // Delete by ID instead of slug
    if (idsToDelete.length > 0) {
      console.log(`[${requestId}] Deleting ${idsToDelete.length} posts no longer in source`);
      
      // Process deletes in chunks as well
      for (let i = 0; i < idsToDelete.length; i += BATCH_SIZE) {
        const chunk = idsToDelete.slice(i, i + BATCH_SIZE);
        
        try {
          const result = await supabase
            .from("posts")
            .delete()
            .in("id", chunk);

          if (result.error) {
            console.error(`[${requestId}] Error deleting ${chunk.length} posts:`, result.error);
            errors += chunk.length;
          } else {
            deleted += chunk.length;
          }
        } catch (err) {
          console.error(`[${requestId}] Exception deleting batch:`, err);
          errors += chunk.length;
        }
      }
    }

    // Revalidate paths after database changes
    if (updated > 0 || inserted > 0 || deleted > 0) {
      console.log(`[${requestId}] Changes detected, revalidating cache...`);
      revalidateTag("posts");
      revalidatePath("/", "page");
      revalidatePath("/blog", "page");

      // Revalidate all specific post pages based on our known slugs
      const allSlugs = new Set([
        ...Array.from(incomingSlugs.values()),
        ...Array.from(existingSlugsById.values())
      ]);
      
      for (const slug of allSlugs) {
        if (slug) {
          revalidatePath(`/blog/${slug}`, "page");
        }
      }
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // in seconds

    console.log(`[${requestId}] Sync completed in ${duration.toFixed(2)}s with stats:`, { 
      updated, inserted, deleted, skipped, errors 
    });

    return NextResponse.json({
      success: true,
      stats: { updated, inserted, deleted, skipped, errors },
      syncTimestamp: new Date().toISOString(),
      requestId,
      duration: `${duration.toFixed(2)}s`
    });
  } catch (error) {
    console.error(`[${requestId}] Error processing sync request:`, error);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // in seconds
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        requestId,
        duration: `${duration.toFixed(2)}s`
      },
      { status: 500 }
    );
  }
}

// GET and OPTIONS handlers remain the same
export async function GET() {
  try {
    const { data: posts } = await supabase
      .from('posts')
      .select('*')
      .order('position', { ascending: false });
    
    return Response.json({ posts });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}