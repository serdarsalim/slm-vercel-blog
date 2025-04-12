// src/app/api/author/sync-content/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { revalidatePath, revalidateTag } from "next/cache";
import { verifyAuthorToken } from "@/lib/author-utils"; // Import the author token verification function

// Add at the top of the file
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching for this route

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
  handle: "author_handle",
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
    if (dateStr.includes(" ") && !dateStr.includes("T")) {
      // Replace space with T for ISO format
      let normalized = dateStr.replace(" ", "T");

      // Add seconds if missing
      if (normalized.match(/T\d{2}:\d{2}$/)) {
        normalized += ":00";
      }

      // Add timezone if missing
      if (
        !normalized.includes("Z") &&
        !normalized.includes("+") &&
        !normalized.includes("-")
      ) {
        normalized += "Z";
      }

      // Add minutes to timezone offset if missing
      if (normalized.match(/[+-]\d{2}$/)) {
        normalized += ":00";
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

// List of fields that should be excluded from the database
const EXCLUDED_FIELDS = ["rowIndex", "syncStatus"];

export async function POST(request: NextRequest) {
  const requestId = `sync-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const startTime = Date.now();
  const errorMessages: string[] = [];

  console.log(`[${requestId}] Starting sync operation`);

  try {
    const body = await request.json();
    
    // Extract and verify author credentials
    const { authorToken, handle, posts = [], optimizeByDate = false } = body;
    if (!authorToken || !handle) {
      return NextResponse.json({ error: "Author token and handle required" }, { status: 400 });
    }
    const { valid } = await verifyAuthorToken(authorToken, handle);
    if (!valid) {
      return NextResponse.json({ error: "Invalid author credentials" }, { status: 401 });
    }

    // Force author_handle on all posts using provided handle
    const postsWithAuthor = posts.map(post => ({ ...post, author_handle: handle }));

    console.log(
      `[${requestId}] Processing ${postsWithAuthor.length} posts with ID-based sync (optimizeByDate: ${optimizeByDate})`
    );

    // Validate posts - Accept both string and numeric IDs
    const validPosts = postsWithAuthor.filter((post) => {
      if (!post.id) {
        console.warn(`[${requestId}] Skipping post without ID`);
        errorMessages.push(
          `Skipping post without ID: ${JSON.stringify(post).substring(0, 100)}...`
        );
        return false;
      }
      return true;
    });

    // Separate posts based on publish status
    const postsToSync = [];
    const postsToDelete = [];
    for (const post of validPosts) {
      // If publish is false, mark for deletion
      if (
        post.publish === false ||
        post.publish === "FALSE" ||
        post.publish === "false"
      ) {
        console.log(
          `[${requestId}] Post ID ${post.id} marked for deletion due to publish=false`
        );
        postsToDelete.push(String(post.id));
      } else {
        postsToSync.push(post);
      }
    }

    const filteredPosts = postsToSync;
    console.log(
      `[${requestId}] ${filteredPosts.length} posts will be synced, ${postsToDelete.length} marked for deletion`
    );
    console.log(
      `[${requestId}] Validated ${filteredPosts.length} of ${postsWithAuthor.length} posts`
    );

    // Convert all IDs to strings for consistent comparison
    const incomingIds = new Set(filteredPosts.map((p) => String(p.id)));

    // For revalidation purposes, collect slugs (if available)
    const incomingSlugs = new Map<string, string>();
    filteredPosts.forEach((post) => {
      if (post.id && post.slug) {
        incomingSlugs.set(String(post.id), post.slug);
      }
    });

    // Get all existing posts from database
    const { data: existingPosts, error: fetchError } = await supabase
      .from("posts")
      .select("id, slug, updated_at");

    if (fetchError) {
      const errorMsg = `Error fetching existing posts: ${fetchError.message}`;
      console.error(`[${requestId}] ${errorMsg}`);
      errorMessages.push(errorMsg);
      throw new Error(`Database error: ${fetchError.message}`);
    }

    const existingIds = new Set((existingPosts || []).map((p) => String(p.id)));
    const existingModifiedDates = new Map<string, string>();
    const existingSlugsById = new Map<string, string>();

    (existingPosts || []).forEach((post) => {
      existingModifiedDates.set(String(post.id), post.updated_at);
      existingSlugsById.set(String(post.id), post.slug);
    });

    // Track operation statistics
    let updated = 0;
    let inserted = 0;
    let deleted = 0;
    let skipped = 0;
    let errors = 0;

    console.log(
      `[${requestId}] Found ${existingIds.size} existing posts in database`
    );

    // Process in batches for better performance
    const BATCH_SIZE = 10;
    const updateBatch: any[] = [];
    const insertBatch: any[] = [];

    // Categorize posts into update or insert batches
    for (const post of filteredPosts) {
      try {
        const mappedPost: any = {};
        // Convert ID to string for consistency
        mappedPost.id = String(post.id);

        // Map fields using FIELD_MAPPING; skip excluded fields
        Object.entries(post).forEach(([key, value]) => {
          if (key === "id") return;
          if (EXCLUDED_FIELDS.includes(key)) return;
          const dbField = FIELD_MAPPING[key] || key;
          mappedPost[dbField] = value;
        });

        // Handle categories with text prefix
        if (
          typeof post.categories === "string" &&
          post.categories.startsWith("text:")
        ) {
          mappedPost["categories"] = post.categories.substring(5);
        }

        // Convert boolean-like fields
        ["featured", "comment", "socmed"].forEach((field) => {
          if (field in mappedPost) {
            mappedPost[field] =
              mappedPost[field] === "TRUE" ||
              mappedPost[field] === "true" ||
              mappedPost[field] === true;
          }
        });
        delete mappedPost.publish;

        // Convert categories string to array if needed
        if (
          "categories" in mappedPost &&
          typeof mappedPost["categories"] === "string"
        ) {
          let categoriesArray = [];
          if (mappedPost["categories"].includes("|")) {
            categoriesArray = mappedPost["categories"]
              .split("|")
              .map((c: string) => c.trim())
              .filter(Boolean);
          } else if (mappedPost["categories"].includes(",")) {
            categoriesArray = mappedPost["categories"]
              .split(",")
              .map((c: string) => c.trim())
              .filter(Boolean);
          } else if (mappedPost["categories"].trim()) {
            categoriesArray = [mappedPost["categories"].trim()];
          }
          mappedPost["categories"] = categoriesArray;
        }

        // Check if post exists by ID
        const exists = existingIds.has(String(post.id));
        if (exists) {
          const existingModifiedDate = existingModifiedDates.get(String(post.id));
          let incomingModifiedDate = post.lastModified;
          // Only skip update if optimizeByDate is true and timestamps are valid
          if (
            optimizeByDate === true &&
            existingModifiedDate &&
            incomingModifiedDate &&
            typeof incomingModifiedDate === "string"
          ) {
            console.log(`[${requestId}] Post ID ${post.id} date comparison:`);
            console.log(`[${requestId}] - Existing: ${existingModifiedDate}`);
            console.log(`[${requestId}] - Incoming: ${incomingModifiedDate}`);

            try {
              // Normalize dates before comparison
              const normalizedExisting = normalizeDate(existingModifiedDate);
              const normalizedIncoming = normalizeDate(incomingModifiedDate);
              console.log(`[${requestId}] - Normalized existing: ${normalizedExisting}`);
              console.log(`[${requestId}] - Normalized incoming: ${normalizedIncoming}`);

              const existingDate = new Date(normalizedExisting);
              const incomingDate = new Date(normalizedIncoming);

              if (
                !isNaN(existingDate.getTime()) &&
                !isNaN(incomingDate.getTime())
              ) {
                console.log(
                  `[${requestId}] - Existing timestamp: ${existingDate.getTime()}`
                );
                console.log(
                  `[${requestId}] - Incoming timestamp: ${incomingDate.getTime()}`
                );
                if (existingDate.getTime() >= incomingDate.getTime()) {
                  console.log(
                    `[${requestId}] Skipping post ID ${post.id} - not modified since last sync`
                  );
                  skipped++;
                  continue;
                } else {
                  console.log(
                    `[${requestId}] Post ID ${post.id} is newer, updating`
                  );
                }
              } else {
                console.log(
                  `[${requestId}] Invalid date comparison for post ID ${post.id}, forcing update`
                );
              }
            } catch (e) {
              console.error(
                `[${requestId}] Error comparing dates for post ID ${post.id}:`,
                e
              );
            }
          }

          // Ensure lastModified date is stored correctly
          if (post.lastModified) {
            try {
              const parsedDate = new Date(post.lastModified);
              if (!isNaN(parsedDate.getTime())) {
                mappedPost["updated_at"] = parsedDate.toISOString();
              }
            } catch (e) {
              console.warn(
                `[${requestId}] Failed to parse lastModified date for post ID ${post.id}:`,
                e
              );
              mappedPost["updated_at"] = new Date().toISOString();
            }
          } else {
            mappedPost["updated_at"] = new Date().toISOString();
          }

          updateBatch.push(mappedPost);
        } else {
          // New post logic (always insert)
          console.log(
            `[${requestId}] New post ID ${post.id} detected, will insert`
          );
          mappedPost["created_at"] = new Date().toISOString();
          mappedPost["updated_at"] = post.lastModified
            ? normalizeDate(post.lastModified)
            : new Date().toISOString();
          insertBatch.push(mappedPost);
        }
      } catch (err) {
        const identifier = post.id || "unknown";
        const errorMsg = `Error processing post ${identifier}: ${
          err instanceof Error ? err.message : String(err)
        }`;
        console.error(`[${requestId}] ${errorMsg}`);
        console.error(
          `[${requestId}] Problematic post data:`,
          JSON.stringify(post).substring(0, 500)
        );
        errorMessages.push(errorMsg);
        errors++;
      }
    }

    console.log(
      `[${requestId}] Categorized posts: ${updateBatch.length} updates, ${insertBatch.length} inserts`
    );

    // Process insert batch first
    if (insertBatch.length > 0) {
      console.log(`[${requestId}] Processing ${insertBatch.length} inserts`);
      for (let i = 0; i < insertBatch.length; i += BATCH_SIZE) {
        const chunk = insertBatch.slice(i, i + BATCH_SIZE);
        console.log(
          `[${requestId}] Processing insert chunk ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(insertBatch.length / BATCH_SIZE)}`
        );
        for (const post of chunk) {
          try {
            console.log(
              `[${requestId}] Inserting post ID ${post.id}, data:`,
              JSON.stringify(post).substring(0, 200)
            );
            const result = await supabase.from("posts").insert([post]);
            if (result.error) {
              const errorMsg = `Error inserting post ID ${post.id}: ${result.error.message}`;
              console.error(`[${requestId}] ${errorMsg}`);
              errorMessages.push(errorMsg);
              errors++;
            } else {
              inserted++;
              console.log(
                `[${requestId}] Successfully inserted post ID ${post.id}`
              );
            }
          } catch (error) {
            const errorMsg = `Exception inserting post ID ${post.id}: ${
              error instanceof Error ? error.message : String(error)
            }`;
            console.error(`[${requestId}] ${errorMsg}`);
            errorMessages.push(errorMsg);
            errors++;
          }
        }
      }
    }

    // Process update batch
    if (updateBatch.length > 0) {
      for (let i = 0; i < updateBatch.length; i += BATCH_SIZE) {
        const chunk = updateBatch.slice(i, i + BATCH_SIZE);
        console.log(
          `[${requestId}] Processing update chunk ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(updateBatch.length / BATCH_SIZE)}`
        );
        for (const post of chunk) {
          try {
            console.log(`[${requestId}] Updating post ID ${post.id}`);
            const result = await supabase
              .from("posts")
              .update(post)
              .eq("id", post.id);
            if (result.error) {
              const errorMsg = `Error updating post ID ${post.id}: ${result.error.message}`;
              console.error(`[${requestId}] ${errorMsg}`);
              errorMessages.push(errorMsg);
              errors++;
            } else {
              updated++;
              console.log(
                `[${requestId}] Successfully updated post ID ${post.id}`
              );
            }
          } catch (error) {
            const errorMsg = `Exception updating post ID ${post.id}: ${
              error instanceof Error ? error.message : String(error)
            }`;
            console.error(`[${requestId}] ${errorMsg}`);
            errorMessages.push(errorMsg);
            errors++;
          }
        }
      }
    }

    // Determine posts to delete: posts in DB that are no longer present in the incoming data or are marked for deletion
    const idsToDelete = [
      ...Array.from(existingIds).filter((id) => !incomingIds.has(id)),
      ...postsToDelete.filter((id) => existingIds.has(id)),
    ];
    const uniqueIdsToDelete = [...new Set(idsToDelete)];

    console.log(
      `[${requestId}] Deleting ${uniqueIdsToDelete.length} posts (${postsToDelete.length} due to publish=false)`
    );

    if (uniqueIdsToDelete.length > 0) {
      console.log(
        `[${requestId}] Deleting ${uniqueIdsToDelete.length} posts no longer in source`
      );
      for (let i = 0; i < uniqueIdsToDelete.length; i += BATCH_SIZE) {
        const chunk = uniqueIdsToDelete.slice(i, i + BATCH_SIZE);
        try {
          const result = await supabase.from("posts").delete().in("id", chunk);
          if (result.error) {
            const errorMsg = `Error deleting posts: ${result.error.message}`;
            console.error(`[${requestId}] ${errorMsg}`);
            errorMessages.push(errorMsg);
            errors += chunk.length;
          } else {
            deleted += chunk.length;
          }
        } catch (err) {
          const errorMsg = `Exception deleting batch: ${
            err instanceof Error ? err.message : String(err)
          }`;
          console.error(`[${requestId}] ${errorMsg}`);
          errorMessages.push(errorMsg);
          errors += chunk.length;
        }
      }
    }

    // Revalidate cache if any changes occurred
    if (updated > 0 || inserted > 0 || deleted > 0) {
      console.log(`[${requestId}] Changes detected, revalidating cache...`);
      revalidateTag("posts");
      revalidatePath("/", "page");
      revalidatePath("/blog", "page");
      // Add author-specific revalidation
      revalidateTag(`author:${handle}`);
      revalidatePath(`/${handle}`, "page"); 

      // Revalidate individual post pages based on known slugs
      const allSlugs = new Set([
        ...Array.from(incomingSlugs.values()),
        ...Array.from(existingSlugsById.values()),
      ]);
      for (const slug of allSlugs) {
        if (slug) {
          revalidatePath(`/blog/${slug}`, "page");
        }
      }
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    console.log(
      `[${requestId}] Sync completed in ${duration.toFixed(2)}s with stats:`,
      { updated, inserted, deleted, skipped, errors }
    );

    return NextResponse.json(
      {
        success: true,
        stats: { updated, inserted, deleted, skipped, errors },
        syncTimestamp: new Date().toISOString(),
        requestId,
        duration: `${duration.toFixed(2)}s`,
        errorDetails: errorMessages.length > 0 ? errorMessages : undefined,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
          'Surrogate-Control': 'no-store',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  } catch (error) {
    console.error(`[${requestId}] Error processing sync request:`, error);
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        requestId,
        duration: `${duration.toFixed(2)}s`,
        errorDetails: errorMessages,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { data: posts } = await supabase
      .from("posts")
      .select("*")
      .order("position", { ascending: false });
    return NextResponse.json({ posts });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
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