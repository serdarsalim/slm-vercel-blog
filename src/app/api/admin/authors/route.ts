// src/app/api/admin/authors/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { revalidatePath, revalidateTag } from "next/cache";

// GET - Fetch all authors
export async function GET(request: NextRequest) {
  try {
    // Verify admin token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const adminToken = authHeader ? authHeader.replace('Bearer ', '') : null;
    const validAdminToken = process.env.ADMIN_API_TOKEN;
    
    if (!adminToken || adminToken !== validAdminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch all authors
    const { data, error } = await supabase
      .from('authors')
      .select('*')
      .order('name');
      
    if (error) {
      console.error('Error fetching authors:', error);
      return NextResponse.json({ error: 'Failed to fetch authors' }, { status: 500 });
    }
    
    return NextResponse.json({ authors: data });
  } catch (error) {
    console.error('Unexpected error in GET authors:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an author
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const adminToken = authHeader ? authHeader.replace('Bearer ', '') : null;
    const validAdminToken = process.env.ADMIN_API_TOKEN;
    
    if (!adminToken || adminToken !== validAdminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get author ID from request body
    const body = await request.json();
    const { authorId } = body;
    
    if (!authorId) {
      return NextResponse.json({ error: 'Author ID is required' }, { status: 400 });
    }
    
    // Get author handle before deletion for revalidation
    const { data: authorData } = await supabase
      .from('authors')
      .select('handle')
      .eq('id', authorId)
      .single();
      
    const handle = authorData?.handle;
    
    // Delete author's posts first
    if (handle) {
      const { error: postsError } = await supabase
        .from('posts')
        .delete()
        .eq('handle', handle);
        
      if (postsError) {
        console.error('Error deleting author posts:', postsError);
        return NextResponse.json({ error: 'Failed to delete author posts' }, { status: 500 });
      }
      
      // Delete author preferences
      const { error: prefsError } = await supabase
        .from('author_preferences')
        .delete()
        .eq('handle', handle);
        
      if (prefsError) {
        console.error('Error deleting author preferences:', prefsError);
        // Continue despite error - not critical
      }
    }
    
    // Delete the author
    const { error } = await supabase
      .from('authors')
      .delete()
      .eq('id', authorId);
      
    if (error) {
      console.error('Error deleting author:', error);
      return NextResponse.json({ error: 'Failed to delete author' }, { status: 500 });
    }
    
    // Revalidate author's pages to remove them
    if (handle) {
      try {
        revalidatePath(`/${handle}`, 'page');
        revalidatePath(`/${handle}/blog`, 'page');
        revalidatePath('/', 'page'); // Revalidate homepage too
      } catch (revalidateError) {
        console.error('Error revalidating paths:', revalidateError);
        // Continue despite error - still successful deletion
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Author deleted successfully'
    });
  } catch (error) {
    console.error('Unexpected error in DELETE author:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}



