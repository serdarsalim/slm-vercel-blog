import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/admin-supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { handle: string } }
) {
  try {
    console.log("=== REVOKE DEBUG START ===");
    
    // Verify admin token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const adminToken = authHeader ? authHeader.replace('Bearer ', '') : null;
    const validAdminToken = process.env.ADMIN_API_TOKEN;
    
    if (!adminToken || adminToken !== validAdminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { handle } = params;
    console.log(`Revoking author with handle: ${handle}`);
    
    // Get author data before moving
    const { data: author, error: fetchError } = await adminSupabase
      .from("authors")
      .select("*")
      .eq("handle", handle)
      .single();
      
    if (fetchError || !author) {
      console.log(`Author not found with handle: ${handle}`);
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }
    
    console.log(`Found author: ${author.name} (${author.handle})`);
    
    // First, delete any existing requests with this handle
    console.log(`Checking for existing author_requests with handle ${handle}`);
    const { data: existingRequests } = await adminSupabase
      .from("author_requests")
      .select('id')
      .eq("handle", handle);
      
    if (existingRequests && existingRequests.length > 0) {
      console.log(`Found ${existingRequests.length} existing request(s) for this handle. Deleting...`);
      
      const { error: deleteRequestsError } = await adminSupabase
        .from("author_requests")
        .delete()
        .eq("handle", handle);
        
      if (deleteRequestsError) {
        console.error(`Error deleting existing requests: ${deleteRequestsError.message}`);
      } else {
        console.log(`Successfully deleted existing request(s)`);
      }
    } else {
      console.log(`No existing requests found for handle ${handle}`);
    }
    
    // Create a new rejected request entry
    console.log(`Creating new rejected author request`);
    const { error: insertError } = await adminSupabase
      .from("author_requests")
      .insert({
        handle: author.handle,
        name: author.name,
        email: author.email,
        bio: author.bio || null,
        website_url: author.website_url || null,
        api_token: author.api_token,
        status: "rejected",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error(`Failed to create rejected request: ${insertError.message}`);
      return NextResponse.json(
        { error: `Failed to create request record: ${insertError.message}` },
        { status: 500 }
      );
    }
    
    console.log(`Rejected request created successfully`);
    
    // Delete the author
    console.log(`Deleting author from authors table`);
    const { error: deleteError } = await adminSupabase
      .from("authors")
      .delete()
      .eq("handle", handle);
    
    if (deleteError) {
      console.error(`Failed to delete author: ${deleteError.message}`);
      return NextResponse.json(
        { error: `Failed to delete author: ${deleteError.message}` },
        { status: 500 }
      );
    }
    
    console.log(`Author deleted successfully`);
    console.log("=== REVOKE DEBUG END ===");
    
    return NextResponse.json({
      success: true,
      message: "Author access has been revoked"
    });
  } catch (error) {
    console.error(`CRITICAL ERROR in revoke: ${error}`);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}