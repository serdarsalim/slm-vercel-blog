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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the new visibility status from request body
    const body = await request.json();
    const { visibility } = body;
    
    if (!visibility || !["visible", "hidden"].includes(visibility)) {
      return NextResponse.json({ error: 'Invalid visibility value' }, { status: 400 });
    }
    
    // Update author visibility in database
    const { error } = await supabase
      .from('authors')
      .update({ visibility })
      .eq('handle', handle);
      
    if (error) {
      console.error('Error updating author visibility:', error);
      return NextResponse.json({ error: 'Failed to update author visibility' }, { status: 500 });
    }
    
    // Revalidate the relevant paths
    revalidatePath(`/${handle}`, 'page');
    revalidatePath(`/${handle}/blog`, 'page');
    revalidatePath('/authors', 'page'); 
    revalidatePath('/', 'page');
    
    return NextResponse.json({
      success: true,
      message: `Author ${handle} visibility updated to ${visibility}`
    });
  } catch (error) {
    console.error('Unexpected error updating visibility:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}