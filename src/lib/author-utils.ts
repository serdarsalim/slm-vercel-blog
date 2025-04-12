// Create this new file
import { supabase } from "@/lib/supabase";

export async function verifyAuthorToken(token: string, handle: string) {
  try {
    const { data, error } = await supabase
      .from("authors")
      .select("handle, name, email, role")
      .eq("handle", handle)
      .eq("api_token", token)
      .single();
    
    if (error || !data) {
      return { valid: false, author: null };
    }
    
    return { valid: true, author: data };
  } catch (err) {
    console.error("Error verifying author token:", err);
    return { valid: false, author: null };
  }
}

export async function isAdminAuthor(token: string, handle: string) {
  try {
    const { data, error } = await supabase
      .from("authors")
      .select("role")
      .eq("handle", handle)
      .eq("api_token", token)
      .single();
    
    if (error || !data) {
      return false;
    }
    
    return data.role === 'admin';
  } catch (err) {
    console.error("Error checking admin status:", err);
    return false;
  }
}

export async function checkAuthorPostQuota(handle: string) {
  try {
    // First get author details to check role
    const { data: author, error: authorError } = await supabase
      .from('authors')
      .select('role')
      .eq('handle', handle)
      .single();
    
    if (authorError) {
      return { withinQuota: false, error: authorError.message };
    }
    
    // Admin authors have unlimited posts
    if (author.role === 'admin') {
      return { withinQuota: true, unlimited: true };
    }
    
    // Count existing posts for this author
    const { count, error: countError } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('author_handle', handle);
    
    if (countError) {
      return { withinQuota: false, error: countError.message };
    }
    
    // Regular authors are limited to 10 posts
    const REGULAR_AUTHOR_LIMIT = 10;
    const postsRemaining = REGULAR_AUTHOR_LIMIT - (count || 0);
    
    return { 
      withinQuota: postsRemaining > 0,
      postsCount: count || 0,
      postsRemaining: Math.max(0, postsRemaining)
    };
  } catch (e) {
    console.error(`Exception checking quota for ${handle}:`, e);
    return { withinQuota: false, error: String(e) };
  }
}