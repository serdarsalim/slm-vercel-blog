// src/app/api/author/authenticate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Utility function to verify author token - can be reused in other endpoints
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

// Test endpoint for authors to verify their token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authorToken, handle } = body;
    
    if (!authorToken || !handle) {
      return NextResponse.json({ 
        error: "Author token and handle are required" 
      }, { status: 400 });
    }
    
    const { valid, author } = await verifyAuthorToken(authorToken, handle);
    
    if (!valid) {
      return NextResponse.json({ 
        error: "Invalid author credentials" 
      }, { status: 401 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Authentication successful",
      author: {
        handle: author.handle,
        name: author.name
      }
    });
  } catch (error) {
    console.error("Error in author authentication:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}