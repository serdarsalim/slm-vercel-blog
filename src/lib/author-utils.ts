// Create this new file
import { supabase } from "@/lib/supabase";

export async function verifyAuthorToken(token: string, handle: string) {
  try {
    const { data, error } = await supabase
      .from("authors")
      .select("handle, name, email")
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