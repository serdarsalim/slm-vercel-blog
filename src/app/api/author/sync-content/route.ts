// src/app/api/author/sync-content/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(request: NextRequest) {
  const requestId = `author-sync-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const startTime = Date.now();
  const errorMessages: string[] = [];

  console.log(`[${requestId}] Starting author content sync operation`);

  try {
    // Get the secret token from env vars
    const secretToken = process.env.REVALIDATION_SECRET || "your_default_secret";
    const body = await request.json();

    // Extract author token and handle
    const { authorToken, handle } = body;

    if (!authorToken || !handle) {
      return NextResponse.json({ 
        error: "Author token and handle are required" 
      }, { status: 400 });
    }

    // Verify the author exists and token is valid
    const { data: authorData, error: authorError } = await supabase
      .from("authors")
      .select("handle, api_token")
      .eq("handle", handle)
      .eq("api_token", authorToken)
      .single();

    if (authorError || !authorData) {
      console.warn(`[${requestId}] Invalid author credentials for ${handle}`);
      return NextResponse.json({ 
        error: "Invalid author credentials" 
      }, { status: 401 });
    }

    console.log(`[${requestId}] Author ${handle} authenticated successfully`);

    // Parse posts data from request
    const { posts = [], optimizeByDate = false } = body;

    if (!Array.isArray(posts) || posts.length === 0) {
      console.warn(`[${requestId}] No posts data provided`);
      return NextResponse.json(
        { error: "No posts data provided" },
        { status: 400 }
      );
    }

    console.log(
      `[${requestId}] Processing ${posts.length} posts with ID-based sync for author ${handle}`
    );

    // Add handle to all posts
    const postsWithAuthor = posts.map(post => ({
      ...post,
      author_handle: handle
    }));

    // Rest of your sync logic (same as your current implementation)
    // ...
    // Example of validating posts and processing them:
    const validPosts = postsWithAuthor.filter((post) => {
      if (!post.id) {
        console.warn(`[${requestId}] Skipping post without ID`);
        errorMessages.push(
          `Skipping post without ID: ${JSON.stringify(post).substring(
            0,
            100
          )}...`
        );
        return false;
      }
      return true;
    });

    // Separate posts based on publish status
    const postsToSync = [];
    const postsToDelete = [];

    // First pass: categorize posts based on 'publish' value
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
        // Otherwise add to sync list
        postsToSync.push(post);
      }
    }

    // Continue with your existing sync logic...
    // ...

    // Revalidate paths for this specific author
    revalidateTag(`author:${handle}`);
    revalidatePath(`/${handle}`, "page");
    revalidatePath(`/${handle}/blog`, "page");

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // in seconds

    console.log(
      `[${requestId}] Author sync completed in ${duration.toFixed(2)}s for ${handle}`
    );

    return NextResponse.json({
      success: true,
      message: `Content synced successfully for author ${handle}`,
      timestamp: new Date().toISOString(),
      requestId,
      duration: `${duration.toFixed(2)}s`
    });
  } catch (error) {
    console.error(`[${requestId}] Error processing author sync request:`, error);

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // in seconds

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

