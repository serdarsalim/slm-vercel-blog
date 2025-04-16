import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function POST(
  request: NextRequest,
  { params }: { params: { handle: string } }
) {
  try {
    const { handle } = params;
    
    // Verify admin token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const adminToken = authHeader ? authHeader.replace('Bearer ', '') : null;
    const validAdminToken = process.env.ADMIN_API_TOKEN;
    
    if (!adminToken || adminToken !== validAdminToken) {
      console.error('Unauthorized attempt to update author listing status');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log(`Authorized request to update listing status for author: ${handle}`);
    
    // Get the new listing status from request body
    const body = await request.json();
    const { listing_status } = body;
    
    console.log(`Requested listing_status: ${listing_status}`);
    
    if (!listing_status || !["listed", "unlisted"].includes(listing_status)) {
      console.error(`Invalid listing_status value: ${listing_status}`);
      return NextResponse.json({ error: 'Invalid listing status value' }, { status: 400 });
    }
    
    // Update author listing_status in database
    const { error } = await supabase
      .from('authors')
      .update({ listing_status })
      .eq('handle', handle);
      
    if (error) {
      console.error('Error updating author listing status:', error);
      return NextResponse.json({ error: 'Failed to update author listing status' }, { status: 500 });
    }
    
    console.log(`Successfully updated author ${handle} listing status to ${listing_status}`);
    
    // Revalidate the relevant paths
    revalidatePath(`/${handle}`, 'page');
    revalidatePath(`/${handle}/blog`, 'page');
    revalidatePath('/authors', 'page'); 
    revalidatePath('/', 'page');
    
    return NextResponse.json({
      success: true,
      message: `Author ${handle} listing status updated to ${listing_status}`
    });
  } catch (error) {
    console.error('Unexpected error updating listing status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}