import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/admin-supabase';
import { revalidatePath } from 'next/cache';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { handle: string } }
) {
  try {
    // 1. Get admin token from request
    const authHeader = request.headers.get('Authorization');
    const adminToken = authHeader ? authHeader.replace('Bearer ', '') : null;
    const validAdminToken = process.env.ADMIN_API_TOKEN;
    
    if (!adminToken || adminToken !== validAdminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { handle } = params;
    
    // 2. Check if author exists
    const { data: authorExists, error: checkError } = await adminSupabase
      .from('authors')
      .select('handle, id')
      .eq('handle', handle)
      .maybeSingle();
      
    if (checkError || !authorExists) {
      return NextResponse.json({ error: `Author with handle ${handle} not found` }, { status: 404 });
    }
    
    // 3. Delete author's posts
    const { error: postsError } = await adminSupabase
      .from('posts')
      .delete()
      .eq('author_id', authorExists.id);
    
    if (postsError) {
      console.error(`Error deleting posts for ${handle}:`, postsError);
    }
    
    // 4. Delete author's preferences
    const { error: prefsError } = await adminSupabase
      .from('preferences')
      .delete()
      .eq('author_id', authorExists.id);
    
    if (prefsError) {
      console.error(`Error deleting preferences for ${handle}:`, prefsError);
    }
    
    // 5. Finally delete the author
    const { error } = await adminSupabase
      .from('authors')
      .delete()
      .eq('handle', handle);
    
    if (error) {
      return NextResponse.json({ error: `Failed to delete author: ${error.message}` }, { status: 500 });
    }
    
    // 6. Revalidate relevant paths
    revalidatePath('/admin/authors', 'page');
    
    return NextResponse.json({
      success: true,
      message: `Author ${handle} has been permanently deleted`
    });
  } catch (error) {
    console.error('Error deleting author:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}