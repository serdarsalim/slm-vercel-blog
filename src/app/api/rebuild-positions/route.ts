import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    // Get the secret token from env vars
    const secretToken = process.env.REVALIDATION_SECRET || "your_default_secret";
    const body = await request.json();

    // Validate request
    if (body.secret !== secretToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Optional: Specify a sort field (defaults to date)
    const { sortBy = "date", sortOrder = "desc" } = body;

    console.log(`Rebuilding position values sorted by ${sortBy} in ${sortOrder} order`);
    
    // 1. Fetch all posts sorted by the specified field
    const { data: posts, error: fetchError } = await supabase
      .from("posts")
      .select("id")
      .order(sortBy, { ascending: sortOrder === "asc" });
      
    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    
    if (!posts || posts.length === 0) {
      return NextResponse.json({ message: "No posts found to rebuild positions" });
    }
    
    console.log(`Found ${posts.length} posts to update`);
    
    // 2. Update each post with a new position value
    const updates = [];
    const BATCH_SIZE = 25; // Process in batches to avoid timeouts
    
    for (let i = 0; i < posts.length; i++) {
      const newPosition = i + 1; // Position starts at 1
      const postId = posts[i].id;
      
      // Add to update batch
      updates.push({ id: postId, position: newPosition });
      
      // Process in batches
      if (updates.length === BATCH_SIZE || i === posts.length - 1) {
        console.log(`Updating positions for batch of ${updates.length} posts`);
        
        // Update posts in a batch (only the position field)
        for (const update of updates) {
          const { error } = await supabase
            .from("posts")
            .update({ position: update.position })
            .eq("id", update.id);
          
          if (error) {
            console.error(`Error updating position for post ${update.id}:`, error);
          }
        }
        
        // Clear batch
        updates.length = 0;
      }
    }
    
    // 3. Revalidate paths
    revalidatePath("/", "page");
    revalidatePath("/blog", "page");
    
    return NextResponse.json({
      success: true,
      message: `Rebuilt position values for ${posts.length} posts`,
    });
  } catch (error) {
    console.error("Error rebuilding positions:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}