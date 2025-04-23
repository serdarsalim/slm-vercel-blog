import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/admin-supabase';
import { revalidatePath } from 'next/cache';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { handle: string } }
) {
  try {
    // 1. Auth check remains the same
    const authHeader = request.headers.get('Authorization');
    const adminToken = authHeader ? authHeader.replace('Bearer ', '') : null;
    const validAdminToken = process.env.ADMIN_API_TOKEN;
    
    if (!adminToken || adminToken !== validAdminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { handle } = params;
    
    // 2. Check if author exists and get avatar_url
    const { data: authorExists, error: checkError } = await adminSupabase
      .from('authors')
      .select('handle, id, avatar_url') // Added avatar_url
      .eq('handle', handle)
      .maybeSingle();
      
    if (checkError || !authorExists) {
      return NextResponse.json({ error: `Author with handle ${handle} not found` }, { status: 404 });
    }
    
    // NEW: Delete author's avatar if it exists
    if (authorExists.avatar_url) {
      console.log(`Deleting avatar for author: ${authorExists.avatar_url}`);
      const avatarPath = getStoragePathFromUrl(authorExists.avatar_url);
      
      if (avatarPath) {
        const { error: avatarDeleteError } = await adminSupabase
          .storage
          .from('avatars')
          .remove([avatarPath]);
          
        if (avatarDeleteError) {
          console.error("Error deleting author avatar:", avatarDeleteError);
          // Continue despite error - not critical
        } else {
          console.log("Author avatar deleted successfully");
        }
      }
    }
    
    // 3. Delete author's posts - FIXED COLUMN NAMES
    console.log(`Deleting posts for author: ${handle}`);
    
    // Try using author_handle
    const { error: postsError1 } = await adminSupabase
      .from('posts')
      .delete()
      .eq('author_handle', handle);
    
    if (postsError1) {
      console.log(`Using author_handle failed: ${postsError1.message}, trying 'author' column...`);
      
      // Try using author column as backup
      const { error: postsError2 } = await adminSupabase
        .from('posts')
        .delete()
        .eq('author', handle);
        
      if (postsError2) {
        console.error(`Error deleting posts for ${handle}:`, postsError2);
      }
    }
    
    // 4. Skip preferences table since it's not in use
    console.log("Skipping preferences table deletion as it's not currently in use");
    
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
    revalidatePath('/', 'page');
    
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

// Helper function to extract storage path from a full URL
function getStoragePathFromUrl(url: string): string | null {
  try {
    if (!url) return null;
    
    console.log("Extracting path from URL:", url);
    
    // Handle different URL formats
    const storagePathMatch = url.match(/\/storage\/v1\/object\/(?:public|sign)\/avatars\/(.+?)(?:\?.*)?$/);
    
    if (storagePathMatch && storagePathMatch[1]) {
      console.log("Found path:", storagePathMatch[1]);
      return storagePathMatch[1];
    }
    
    // Fallback pattern
    const altMatch = url.match(/avatars\/(.+?)(?:\?.*)?$/);
    if (altMatch && altMatch[1]) {
      console.log("Found path (alt):", altMatch[1]);
      return altMatch[1];
    }
    
    console.log("Could not extract path from URL");
    return null;
  } catch (error) {
    console.error("Failed to parse storage path from URL:", error);
    return null;
  }
}