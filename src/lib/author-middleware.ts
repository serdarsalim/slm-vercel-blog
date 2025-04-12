// src/lib/author-middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "./supabase";

export interface AuthorRequest extends NextRequest {
  author?: {
    handle: string;
    name: string;
    email: string;
  };
}

/**
 * Middleware to authenticate author API requests
 * 
 * Usage:
 * ```
 * const { author, response } = await authenticateAuthor(request);
 * if (response) return response; // Return error response if authentication failed
 * 
 * // Continue with request handling using author data
 * console.log(`Request from author: ${author.name}`);
 * ```
 */
export async function authenticateAuthor(request: NextRequest) {
  try {
    // Try to get author token from Authorization header first
    const authHeader = request.headers.get('Authorization');
    let authorToken = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    // If no token in header, try to get from request body
    if (!authorToken) {
      const body = await request.json().catch(() => ({}));
      authorToken = body.authorToken || null;
      
      // Get handle from body if available
      const handle = body.handle;
      
      if (!authorToken || !handle) {
        return {
          author: null,
          response: NextResponse.json({ 
            error: "Author token and handle are required" 
          }, { status: 400 })
        };
      }
      
      // Verify token matches handle
      const { data, error } = await supabase
        .from("authors")
        .select("handle, name, email")
        .eq("handle", handle)
        .eq("api_token", authorToken)
        .single();
      
      if (error || !data) {
        return {
          author: null,
          response: NextResponse.json({ 
            error: "Invalid author credentials" 
          }, { status: 401 })
        };
      }
      
      // Authentication successful - proceed with request
      return {
        author: data,
        response: null
      };
    }
    
    // If we got here, something went wrong in the flow
    return {
      author: null,
      response: NextResponse.json({ 
        error: "Invalid authentication flow" 
      }, { status: 400 })
    };
  } catch (error) {
    console.error("Error in author authentication middleware:", error);
    return {
      author: null,
      response: NextResponse.json(
        { error: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      )
    };
  }
}