import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { handle, authorToken } = body;
    
    if (!handle || !authorToken) {
      return NextResponse.json({ 
        success: false, 
        error: "Handle and author token are required" 
      }, { status: 400 });
    }
    
    // Verify in Supabase
    const { data, error } = await supabase
      .from("authors")
      .select("handle, name")
      .eq("handle", handle)
      .eq("api_token", authorToken)
      .single();
    
    if (error || !data) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid credentials" 
      }, { status: 401 });
    }
    
    return NextResponse.json({
      success: true,
      author: {
        handle: data.handle,
        name: data.name
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Authentication failed" 
    }, { status: 500 });
  }
}

// Optional: Add this to handle OPTIONS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}