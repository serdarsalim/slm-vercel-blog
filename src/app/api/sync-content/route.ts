// src/app/api/sync-content/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { revalidatePath, revalidateTag } from "next/cache";

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
    const secretToken = process.env.REVALIDATION_SECRET || "your_default_secret";
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

    console.log(`Processing ${posts.length} posts with ID-based sync...`);

    // Extract all IDs from incoming posts for efficient comparison
    // Filter out any falsy IDs (null, undefined, empty strings)
    const incomingIds = new Set(posts.map((p) => p.id).filter(Boolean));
    
    // For revalidation purposes, we still need slugs
    const incomingSlugs = new Map();
    posts.forEach(post => {
      if (post.id && post.slug) {
        incomingSlugs.set(post.id, post.slug);
      }
    });

    // Get all existing post IDs and their last modified dates
    const { data: existingPosts, error: fetchError } = await supabase
      .from("posts")
      .select("id, slug, updated_at");

    if (fetchError) {
      console.error("Error fetching existing posts:", fetchError);
      return NextResponse.json(
        { error: `Database error: ${fetchError.message}` },
        { status: 500 }
      );
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

    // Process updates and inserts
    for (const post of posts) {
      try {
        // Skip posts without IDs
        if (!post.id) {
          console.warn("Skipping post without ID:", post.title || post.slug || "unknown");
          skipped++;
          continue;
        }
        
        // Map fields using the field mapping
        const mappedPost = {};

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

        // Add timestamps
        mappedPost["updated_at"] = new Date().toISOString();

        // Check if post exists BY ID (not slug)
        const exists = existingIds.has(post.id);

        if (exists) {
          const existingModifiedDate = existingModifiedDates.get(post.id);
          let incomingModifiedDate = post.lastModified;
          
          console.log(`Comparing dates for post ID ${post.id}:`, {
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
            
            const existingDate = new Date(normalizedExisting);
            const incomingDate = new Date(normalizedIncoming);
            
            if (!isNaN(existingDate.getTime()) && !isNaN(incomingDate.getTime())) {
              if (existingDate.getTime() >= incomingDate.getTime()) {
                console.log(`Skipping post ID ${post.id} - not modified since last sync`);
                skipped++;
                continue;
              } else {
                console.log(`Updating post ID ${post.id} - modified since last sync`);
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
              console.error(
                `Failed to parse lastModified date for post ID ${post.id}:`,
                e
              );
              mappedPost["updated_at"] = new Date().toISOString();
            }
          }

          // Update existing post BY ID (not slug)
          const { error } = await supabase
            .from("posts")
            .update(mappedPost)
            .eq("id", post.id);

          if (error) {
            console.error(`Error updating post ID ${post.id}:`, error);
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
            console.error(`Error inserting post ID ${post.id}:`, error);
            errors++;
          } else {
            inserted++;
          }
        }
      } catch (err) {
        const identifier = post.id || post.slug || "unknown";
        console.error(`Error processing post ${identifier}:`, err);
        errors++;
      }
    }

    // Find posts to delete (in DB but not in incoming data)
    const idsToDelete = Array.from(existingIds).filter(
      (id) => !incomingIds.has(id)
    );

    // Delete by ID instead of slug
    if (idsToDelete.length > 0) {
      try {
        const { error } = await supabase
          .from("posts")
          .delete()
          .in("id", idsToDelete);

        if (error) {
          console.error("Error deleting posts:", error);
          errors += idsToDelete.length;
        } else {
          deleted = idsToDelete.length;
        }
      } catch (err) {
        console.error("Error deleting posts:", err);
        errors += idsToDelete.length;
      }
    }

    // Revalidate paths after database changes
    if (updated > 0 || inserted > 0 || deleted > 0) {
      console.log("Changes detected, revalidating cache...");
      revalidateTag("posts");
      revalidatePath("/", "page");
      revalidatePath("/blog", "page");

      // Revalidate new post pages (using slugs for path construction)
      if (inserted > 0) {
        // Get new posts that have slugs
        const newPosts = posts.filter((post) => {
          return post.id && post.slug && !existingIds.has(post.id);
        });

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