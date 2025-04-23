import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/admin-supabase';
import { checkAdminAuth } from '@/lib/auth-utils';

export async function POST(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    console.log("=== DELETE REQUEST DEBUG START ===");
    
    // Check admin authentication
    const adminCheck = await checkAdminAuth();
    if (!adminCheck.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    console.log("Deleting request with ID:", id);
    
    // First, fetch the request to get the handle and avatar_url
    const { data: authorRequest, error: fetchError } = await adminSupabase
      .from('author_requests')
      .select('handle, avatar_url') // Added avatar_url
      .eq('id', id)
      .single();
      
    if (fetchError) {
      console.error("Error fetching request:", fetchError);
      return NextResponse.json({ 
        error: `Could not find request: ${fetchError.message}` 
      }, { status: 404 });
    }
    
    // Save the handle for potential author deletion
    const handle = authorRequest.handle;
    console.log(`Request has handle: ${handle}. Checking for matching author...`);
    
    // Delete avatar for request if exists
    if (authorRequest.avatar_url) {
      console.log(`Deleting avatar for request: ${authorRequest.avatar_url}`);
      const avatarPath = getStoragePathFromUrl(authorRequest.avatar_url);
      if (avatarPath) {
        const { error: avatarDeleteError } = await adminSupabase
          .storage
          .from('avatars')
          .remove([avatarPath]);
          
        if (avatarDeleteError) {
          console.error("Error deleting request avatar:", avatarDeleteError);
          // Continue despite error - not critical
        } else {
          console.log("Request avatar deleted successfully");
        }
      }
    }
    
    // Delete the request
    const { error: deleteRequestError } = await adminSupabase
      .from('author_requests')
      .delete()
      .eq('id', id);
      
    if (deleteRequestError) {
      console.error("Error deleting request:", deleteRequestError);
      throw new Error(`Failed to delete request: ${deleteRequestError.message}`);
    }
    
    console.log("Request deleted successfully");
    
    // Check if there's a matching author in the authors table
    const { data: authorData, error: authorFetchError } = await adminSupabase
      .from('authors')
      .select('id, avatar_url') // Added avatar_url
      .eq('handle', handle)
      .single();
    
    // If author exists, delete them too
    if (!authorFetchError && authorData) {
      console.log(`Found matching author with handle ${handle}. Deleting...`);
      
      // Delete avatar for author if exists
      if (authorData.avatar_url) {
        console.log(`Deleting avatar for author: ${authorData.avatar_url}`);
        const avatarPath = getStoragePathFromUrl(authorData.avatar_url);
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
      
      // DELETE POSTS FIRST
      console.log(`Deleting posts for author ${handle}...`);
      const { error: postsError } = await adminSupabase
        .from('posts')
        .delete()
        .eq('author_handle', handle);
        
      if (postsError) {
        console.error("Error deleting author posts:", postsError);
        // Continue despite error - not critical
      } else {
        console.log("Author posts deleted successfully");
      }
      
      // DELETE PREFERENCES
      console.log(`Deleting preferences for author ${handle}...`);
      const { error: prefsError } = await adminSupabase
        .from('author_preferences')
        .delete()
        .eq('author_handle', handle);
        
      if (prefsError) {
        console.error("Error deleting author preferences:", prefsError);
        // Continue despite error - not critical
      } else {
        console.log("Author preferences deleted successfully");
      }
      
      // DELETE THE AUTHOR
      const { error: deleteAuthorError } = await adminSupabase
        .from('authors')
        .delete()
        .eq('handle', handle);
        
      if (deleteAuthorError) {
        console.error("Error deleting author:", deleteAuthorError);
        return NextResponse.json({
          success: true,
          message: 'Author request deleted successfully, but failed to delete matching author',
          authorError: deleteAuthorError.message
        });
      }
      
      console.log("Author deleted successfully");
      console.log("=== DELETE REQUEST DEBUG END ===");
      
      return NextResponse.json({
        success: true,
        message: 'Author request and matching author deleted successfully'
      });
    }
    
    console.log("No matching author found");
    console.log("=== DELETE REQUEST DEBUG END ===");
    
    return NextResponse.json({
      success: true,
      message: 'Author request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting author request:', error);
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