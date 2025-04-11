// src/app/api/author/revalidate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { revalidatePath, revalidateTag } from "next/cache"; // Add this import

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authorToken, handle, path, slug } = body;

    if (!authorToken || !handle) {
      return NextResponse.json({ 
        error: "Author token and handle are required" 
      }, { status: 400 });
    }

    // Verify author identity
    const { data: authorData, error: authorError } = await supabase
      .from("authors")
      .select("handle")
      .eq("handle", handle)
      .eq("api_token", authorToken)
      .single();

    if (authorError || !authorData) {
      return NextResponse.json({ 
        error: "Invalid author credentials" 
      }, { status: 401 });
    }

    // Revalidate author content
    revalidateTag(`author:${handle}`);
    
    // Revalidate specific routes
    revalidatePath(`/${handle}`, "page");
    
    if (path) {
      revalidatePath(`/${handle}${path.startsWith('/') ? path : `/${path}`}`, "page");
    }
    
    if (slug) {
      revalidatePath(`/${handle}/blog/${slug}`, "page");
    }

    return NextResponse.json({
      success: true,
      message: `Cache revalidated for author ${handle}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error revalidating author content:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}