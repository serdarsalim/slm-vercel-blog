// src/app/api/author/authenticate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAuthorToken } from "@/lib/author-utils";

// ONLY export the POST handler
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