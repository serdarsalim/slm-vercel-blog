// src/app/api/sync-content/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { revalidatePath, revalidateTag } from "next/cache";

// Map CSV column names to database fields (adjust to match your sheet)
const FIELD_MAPPING: Record<string, string> = {
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
  lastModified: "updated_at", // New field mapping for tracking changes
  position: "position", // Add this new mapping
};


// Add this helper function at the top of your file
// Add this helper function at the top of your file
function normalizeDate(dateStr: string): string {
  if (!dateStr) return '';
  
  // Convert "2025-04-07 10:28:45+00" to "2025-04-07T10:28:45+00:00"
  if (dateStr.includes(' ') && !dateStr.includes('T')) {
    // Replace space with T
    dateStr = dateStr.replace(' ', 'T');
    
    // Add minutes to timezone offset if missing
    if (dateStr.match(/\+\d{2}$/) || dateStr.match(/-\d{2}$/)) {
      dateStr += ':00';
    }
  }
  
  return dateStr;
}


export async function POST(request: NextRequest) {
  try {
    // Get the secret token from env vars
    const secretToken =
      process.env.REVALIDATION_SECRET || "your_default_secret";

    const body = await request.json();

    // Validate request
    if (body.secret !== secretToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Parse posts data from request
    const { posts = [] } = body;

    if (!Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json(
        { error: "No posts data provided" },
        { status: 400 }
      );
    }

    console.log(
      `Processing ${posts.length} posts with smart sync...`
    );



    
    // Extract all slugs from incoming posts for efficient comparison
    const incomingSlugs = new Set(posts.map((p) => p.slug));

    // Get all existing post slugs for comparison
    const { data: existingPosts, error: fetchError } = await supabase
      .from("posts")
      .select("slug, updated_at");

    if (fetchError) {
      console.error("Error fetching existing posts:", fetchError);
      return NextResponse.json(
        {
          error: `Database error: ${fetchError.message}`,
        },
        { status: 500 }
      );
    }

    // Create mapping of existing slugs to their last modified dates
    const existingSlugs = new Set(existingPosts?.map((p) => p.slug) || []);
    const existingModifiedDates = new Map();
    existingPosts?.forEach((post) => {
      existingModifiedDates.set(post.slug, post.updated_at);
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

        // Handle the special 'text:' prefix for categories
        if (
          typeof post.categories === "string" &&
          post.categories.startsWith("text:")
        ) {
          mappedPost["categories"] = post.categories.substring(5); // Remove the prefix
        }

        // Special handling for booleans and arrays
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

        // Handle categories
        if (
          "categories" in mappedPost &&
          typeof mappedPost["categories"] === "string"
        ) {
          // Try to convert string categories to array
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

        // Add timestamps
        mappedPost["updated_at"] = new Date().toISOString();

        // If no explicit updated_at, use the current time
        if (!mappedPost["updated_at"]) {
          mappedPost["updated_at"] = new Date().toISOString();
        }

        // Check if post exists
        const exists = existingSlugs.has(post.slug);

        if (exists) {
          const existingModifiedDate = existingModifiedDates.get(post.slug);
          let incomingModifiedDate = post.lastModified;
          
          console.log(`Comparing dates for ${post.slug}:`, {
            existingDate: existingModifiedDate,
            incomingDate: incomingModifiedDate,
          });
          
          // Skip update if post hasn't changed AND we have valid timestamps
          if (
            existingModifiedDate &&
            incomingModifiedDate &&
            typeof incomingModifiedDate === "string"
          ) {
            // Normalize date formats before comparison
            const normalizedExisting = normalizeDate(existingModifiedDate);
            const normalizedIncoming = normalizeDate(incomingModifiedDate);
            
            console.log(`Normalized dates for ${post.slug}:`, {
              existingDate: normalizedExisting,
              incomingDate: normalizedIncoming,
            });
            
            const existingDate = new Date(normalizedExisting);
            const incomingDate = new Date(normalizedIncoming);
            
            if (!isNaN(existingDate.getTime()) && !isNaN(incomingDate.getTime())) {
              // Log timestamps to verify comparison
              console.log(`Date timestamps for ${post.slug}:`, {
                existing: existingDate.getTime(),
                incoming: incomingDate.getTime(),
                difference: existingDate.getTime() - incomingDate.getTime()
              });
              
              if (existingDate.getTime() >= incomingDate.getTime()) {
                console.log(`Skipping post ${post.slug} - not modified since last sync`);
                skipped++;
                continue;
              } else {
                console.log(`Updating post ${post.slug} - modified since last sync`);
              }
            }
          } else {
            console.log(`Missing date information for ${post.slug}, forcing update`);
          }

          // Always ensure we're storing the lastModified date correctly
          if (post.lastModified) {
            // For storage in the database, standardize the date format
            try {
              const parsedDate = new Date(post.lastModified);
              if (!isNaN(parsedDate.getTime())) {
                mappedPost["updated_at"] = parsedDate.toISOString();
              }
            } catch (e) {
              console.error(
                `Failed to parse lastModified date for ${post.slug}:`,
                e
              );
              // Still update the post, but use current time as fallback
              mappedPost["updated_at"] = new Date().toISOString();
            }
          } else {
            // If no lastModified provided, use current time
            mappedPost["updated_at"] = new Date().toISOString();
          }

          // Update existing post
          const { error } = await supabase
            .from("posts")
            .update(mappedPost)
            .eq("slug", post.slug);

          if (error) {
            console.error(`Error updating post ${post.slug}:`, error);
            errors++;
          } else {
            updated++;
          }
        } else {
          // Add created_at for new posts
          mappedPost["created_at"] = new Date().toISOString();

          // Insert new post
          const { error } = await supabase.from("posts").insert([mappedPost]);

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

    // Find posts to delete (in DB but not in incoming data)
    const slugsToDelete = Array.from(existingSlugs).filter(
      (slug) => !incomingSlugs.has(slug)
    );

    // Always perform deletions regardless of sync mode
    if (slugsToDelete.length > 0) {
      try {
        const { error } = await supabase
          .from("posts")
          .delete()
          .in("slug", slugsToDelete);

        if (error) {
          console.error("Error deleting posts:", error);
          errors += slugsToDelete.length;
        } else {
          deleted = slugsToDelete.length;
        }
      } catch (err) {
        console.error("Error deleting posts:", err);
        errors += slugsToDelete.length;
      }
    }

    // Revalidate paths after database changes
    if (updated > 0 || inserted > 0 || deleted > 0) {
      console.log("Changes detected, revalidating cache...");
      revalidateTag("posts");
      revalidatePath("/", "page");
      revalidatePath("/blog", "page");

      // Additional specific revalidations for newly added posts
      if (inserted > 0) {
        // Get slugs of newly inserted posts
        const newPosts = posts.filter((post) => {
          const mappedSlug = post.slug || "";
          return !existingSlugs.has(mappedSlug);
        });

        // Revalidate each new post page individually
        for (const post of newPosts) {
          if (post.slug) {
            revalidatePath(`/blog/${post.slug}`, "page");
          }
        }
      }
    }

    const syncTimestamp = new Date().toISOString();

    return NextResponse.json({
      success: true,
      stats: { updated, inserted, deleted, skipped, errors },
      syncTimestamp: syncTimestamp,
      timestamp: syncTimestamp,
    });
  } catch (error) {
    console.error("Error processing sync request:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// In your Next.js API route for fetching posts
export async function GET() {
  try {
    const { data: posts } = await supabase
      .from('posts')
      .select('*')
      .order('position', { ascending: false }); // Use descending to show newest posts first
    
    return Response.json({ posts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Add OPTIONS handler for CORS preflight requests
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
