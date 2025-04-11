import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; // For fetching
import { adminSupabase } from "@/lib/admin-supabase"; // For writing with elevated privileges
import { checkAdminAuth } from "@/lib/auth-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("=== APPROVAL DEBUG START ===");
    console.log("Request params:", params);
    
    // Authentication check (uncomment when needed)
    /*
    const adminCheck = await checkAdminAuth();
    if (!adminCheck.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    */
    
    const { id } = params;
    console.log("Processing approval for request ID:", id);
    
    // Get the request data first
    console.log("Fetching author request data...");
    const { data: authorRequest, error: fetchError } = await supabase
      .from("author_requests")
      .select("*")
      .eq("id", id)
      .single();
      
    if (fetchError) {
      console.error("🔴 Error fetching author request:", fetchError);
      return NextResponse.json({ error: `Failed to fetch request: ${fetchError.message}` }, { status: 500 });
    }
    
    if (!authorRequest) {
      console.error("🔴 Author request not found for ID:", id);
      return NextResponse.json({ error: "Author request not found" }, { status: 404 });
    }
    
    console.log("✅ Found author request:", JSON.stringify(authorRequest, null, 2));
    
    // Check if author already exists (handle is unique)
    const { data: existingAuthor } = await supabase
      .from("authors")
      .select("id, handle")
      .eq("handle", authorRequest.handle)
      .single();
      
    if (existingAuthor) {
      console.log("⚠️ Author with this handle already exists. Deleting request.");
      
      // Delete the request since author already exists
      const { error: deleteError } = await adminSupabase
        .from("author_requests")
        .delete()
        .eq("id", id);
        
      if (deleteError) {
        console.error("🔴 Error deleting request:", deleteError);
        throw new Error(`Failed to delete request: ${deleteError.message}`);
      }
      
      console.log("✅ Request deleted successfully");
      
      return NextResponse.json({
        success: true,
        message: "Author request approved successfully (author already exists)",
        author: {
          handle: authorRequest.handle,
          name: authorRequest.name,
        },
      });
    }
    
    // Create actual author record
    console.log("Creating author record in authors table...");
    const authorData = {
      handle: authorRequest.handle,
      name: authorRequest.name,
      email: authorRequest.email,
      bio: authorRequest.bio || null,
      website_url: authorRequest.website_url || null,
      api_token: authorRequest.api_token,
      created_at: new Date().toISOString(),
    };
    console.log("Author data to insert:", JSON.stringify(authorData, null, 2));
    
    const { error: authorError } = await adminSupabase.from("authors").insert(authorData);
    
    if (authorError) {
      console.error("🔴 Error creating author:", authorError);
      throw new Error(`Failed to create author record: ${authorError.message}`);
    }
    
    console.log("✅ Author created successfully");
    
    // Delete the request since author was created successfully
    console.log("Deleting the request...");
    const { error: deleteError } = await adminSupabase
      .from("author_requests")
      .delete()
      .eq("id", id);
      
    if (deleteError) {
      console.error("🔴 Warning: Could not delete author request:", deleteError);
      // Continue since the author was created successfully
    } else {
      console.log("✅ Request deleted successfully");
    }
    
    console.log("=== APPROVAL DEBUG END ===");
    return NextResponse.json({
      success: true,
      message: "Author request approved successfully",
      author: {
        handle: authorRequest.handle,
        name: authorRequest.name,
      },
    });
  } catch (error) {
    console.error("🔴 CRITICAL ERROR in approve process:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}