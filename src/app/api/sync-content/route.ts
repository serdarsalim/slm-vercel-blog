// src/app/api/sync-content/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { revalidatePath, revalidateTag } from "next/cache";
import { PostgrestResponse } from "@supabase/supabase-js";

// Map CSV column names to database fields (adjust to match your sheet)
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
 * Robust date normalization with multiple fallback strategies
 */
function normalizeDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  
  try {
    // First try direct ISO conversion
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
    
    // If that fails, apply custom format conversions
    if (dateStr.includes(' ') && !dateStr.includes('T')) {
      // Replace space with T
      let normalized = dateStr.replace(' ', 'T');
      
      // Add minutes to timezone offset if missing
      if (normalized.match(/\+\d{2}$/) || normalized.match(/-\d{2}$/)) {
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

/**
 * Properly typed retry utility for database operations
 */
async function retryOperation<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      console.warn(`Operation failed (attempt ${attempt}/${maxRetries}):`, err);
      // Exponential backoff
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 100));
    }
  }
  throw lastError;
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
    const { posts = [] } = body;

    if (!Array.isArray(posts) || posts.length === 0) {
      console.warn(`[${requestId}] No posts data provided`);
      return NextResponse.json(
        { error: "No posts data provided" },
        { status: 400 }
      );
    }

    console.log(`[${requestId}] Processing ${posts.length} posts with ID-based sync...`);

    // Set up a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Sync operation timed out after 60s")), 60000);
    });

    // Set up the main sync promise
    const syncPromise = (async () => {
      // Validate posts - ONLY CHECK FOR ID AS REQUESTED
      const validPosts = posts.filter(post => {
        if (!post.id || typeof post.id !== 'string') {
          console.warn(`[${requestId}] Skipping post without valid ID`);
          return false;
        }
        return true;
      });

      console.log(`[${requestId}] Validated ${validPosts.length} of ${posts.length} posts`);

      // Extract all IDs from incoming posts for efficient comparison
      const incomingIds = new Set(validPosts.map((p) => p.id));
      
      // For revalidation purposes, we still collect slugs
      const incomingSlugs = new Map();
      validPosts.forEach(post => {
        if (post.id && post.slug) {
          incomingSlugs.set(post.id, post.slug);
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

      // Create mapping of existing IDs to their last modified dates
      const existingIds = new Set(existingPosts?.map((p) => p.id) || []);
      const existingModifiedDates = new Map();
      const existingSlugsById = new Map(); // Keep track of slugs for revalidation
      
      existingPosts?.forEach((post) => {
        existingModifiedDates.set(post.id, post.updated_at);
        existingSlugsById.set(post.id, post.slug);
      });

      // Track operations
      let updated = 0;
      let inserted = 0;
      let deleted = 0;
      let skipped = 0;
      let errors = 0;

      console.log(`[${requestId}] Found ${existingIds.size} existing posts in database`);

      // Process updates and inserts in batches for better performance
      const BATCH_SIZE = 50;
      const updateBatch = [];
      const insertBatch = [];
      
      // First, categorize posts into update or insert batches
      for (const post of validPosts) {
        try {
          // Map fields using the field mapping
          const mappedPost: any = {};

          // Process each field with the mapping
          Object.entries(post).forEach(([key, value]) => {
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
          if ("featured" in mappedPost) {
            mappedPost["featured"] =
              mappedPost["featured"] === "TRUE" ||
              mappedPost["featured"] === "true" ||
              mappedPost["featured"] === true;
          }

          if ("comment" in mappedPost) {
            mappedPost["comment"] =
              mappedPost["comment"] === "TRUE" ||
              mappedPost["comment"] === "true" ||
              mappedPost["comment"] === true;
          }

          if ("socmed" in mappedPost) {
            mappedPost["socmed"] =
              mappedPost["socmed"] === "TRUE" ||
              mappedPost["socmed"] === "true" ||
              mappedPost["socmed"] === true;
          }

          // Handle categories as arrays
          if (
            "categories" in mappedPost &&
            typeof mappedPost["categories"] === "string"
          ) {
            let categoriesArray = [];

            if (mappedPost["categories"].includes("|")) {
              categoriesArray = mappedPost["categories"]
                .split("|")
                .map((c) => c.trim())
                .filter(Boolean);
            } else if (mappedPost["categories"].includes(",")) {
              categoriesArray = mappedPost["categories"]
                .split(",")
                .map((c) => c.trim())
                .filter(Boolean);
            } else if (mappedPost["categories"].trim()) {
              categoriesArray = [mappedPost["categories"].trim()];
            }

            mappedPost["categories"] = categoriesArray;
          }

          // Check if post exists BY ID (not slug)
          const exists = existingIds.has(post.id);

          if (exists) {
            const existingModifiedDate = existingModifiedDates.get(post.id);
            let incomingModifiedDate = post.lastModified;
            
            // Skip update if post hasn't changed AND we have valid timestamps
            if (
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
          errors++;
        }
      }

      console.log(`[${requestId}] Categorized posts: ${updateBatch.length} updates, ${insertBatch.length} inserts`);

      // Process update batch
      if (updateBatch.length > 0) {
        // Process in chunks to avoid overwhelming the database
        for (let i = 0; i < updateBatch.length; i += BATCH_SIZE) {
          const chunk = updateBatch.slice(i, i + BATCH_SIZE);
          console.log(`[${requestId}] Processing update chunk ${i/BATCH_SIZE + 1} of ${Math.ceil(updateBatch.length/BATCH_SIZE)}`);
          
          // Update each post individually
          for (const post of chunk) {
            try {
              const result = await supabase
                .from("posts")
                .update(post)
                .eq("id", post.id);
              
              if (result.error) {
                console.error(`[${requestId}] Error updating post ID ${post.id}:`, result.error);
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
          console.log(`[${requestId}] Processing insert chunk ${i/BATCH_SIZE + 1} of ${Math.ceil(insertBatch.length/BATCH_SIZE)}`);
          
          try {
            const result = await supabase
              .from("posts")
              .upsert(chunk, { 
                onConflict: 'id',
                ignoreDuplicates: false 
              });

            if (result.error) {
              console.error(`[${requestId}] Error inserting ${chunk.length} posts:`, result.error);
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

      return {
        success: true,
        stats: { updated, inserted, deleted, skipped, errors },
        syncTimestamp: new Date().toISOString(),
        requestId,
        duration: `${duration.toFixed(2)}s`
      };
    })();

    // Race the sync operation against the timeout
    const result = await Promise.race([syncPromise, timeoutPromise]);
    return NextResponse.json(result);
    
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
    return Response.json({ error: error.message }, { status: 500 });
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