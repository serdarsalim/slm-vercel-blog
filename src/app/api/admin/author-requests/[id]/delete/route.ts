import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
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
    
    // First, fetch the request to get the handle
    const { data: authorRequest, error: fetchError } = await supabase
      .from('author_requests')
      .select('handle')
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
    const { data: authorData, error: authorFetchError } = await supabase
      .from('authors')
      .select('id')
      .eq('handle', handle)
      .single();
    
    // If author exists, delete them too
    if (!authorFetchError && authorData) {
      console.log(`Found matching author with handle ${handle}. Deleting...`);
      
      // DELETE POSTS FIRST - Add this code
      console.log(`Deleting posts for author ${handle}...`);
      const { error: postsError } = await adminSupabase
        .from('posts')
        .delete()
        .eq('author_handle', handle); // Notice author_handle here!
        
      if (postsError) {
        console.error("Error deleting author posts:", postsError);
        // Continue despite error - not critical
      } else {
        console.log("Author posts deleted successfully");
      }
      
      // DELETE PREFERENCES - Add this code
      console.log(`Deleting preferences for author ${handle}...`);
      const { error: prefsError } = await adminSupabase
        .from('author_preferences')
        .delete()
        .eq('author_handle', handle); // Notice author_handle here!
        
      if (prefsError) {
        console.error("Error deleting author preferences:", prefsError);
        // Continue despite error - not critical
      } else {
        console.log("Author preferences deleted successfully");
      }
      
      // DELETE THE AUTHOR - This already exists
      const { error: deleteAuthorError } = await adminSupabase
        .from('authors')
        .delete()
        .eq('handle', handle); // Correct - using handle for authors table
        
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