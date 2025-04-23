// src/app/api/admin/authors/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { adminSupabase } from "@/lib/admin-supabase";

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
    const { data, error } = await adminSupabase
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
    const { data: authorData, error: authorError } = await adminSupabase
      .from('authors')
      .select('handle, name')
      .eq('id', authorId)
      .single();
      
    if (authorError || !authorData) {
      console.error('Error finding author:', authorError);
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }
    
    const { handle, name } = authorData;
    console.log(`Deleting author: ${name} (${handle})`);
    
    // Delete author's posts first - using BOTH author and author_handle columns
    // Posts table has both fields according to the schema
    const { error: postsError1 } = await adminSupabase
      .from('posts')
      .delete()
      .eq('author_handle', handle);
      
    if (postsError1) {
      console.error(`Error deleting posts by author_handle for ${handle}:`, postsError1);
    }
    
    // Also try deleting by author column as backup
    const { error: postsError2 } = await adminSupabase
      .from('posts')
      .delete()
      .eq('author', handle);
      
    if (postsError2) {
      console.error(`Error deleting posts by author for ${handle}:`, postsError2);
    }
    
    // Delete the author
    const { error: deleteError } = await adminSupabase
      .from('authors')
      .delete()
      .eq('id', authorId);
      
    if (deleteError) {
      console.error(`Error deleting author ${handle}:`, deleteError);
      return NextResponse.json({ error: 'Failed to delete author' }, { status: 500 });
    }
    
    // Revalidate author's pages to remove them
    try {
      revalidatePath(`/${handle}`, 'page');
      revalidatePath(`/${handle}/blog`, 'page');
      revalidatePath('/', 'page'); // Revalidate homepage too
      revalidateTag('authors'); // Add a tag for authors list
      revalidateTag('posts');   // Add a tag for posts
    } catch (revalidateError) {
      console.error('Error revalidating paths:', revalidateError);
      // Continue despite error - still successful deletion
    }
    
    return NextResponse.json({
      success: true,
      message: `Author ${name} (${handle}) deleted successfully`
    });
  } catch (error) {
    console.error('Unexpected error in DELETE author:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


