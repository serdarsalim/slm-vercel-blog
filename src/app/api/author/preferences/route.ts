// src/app/api/author/preferences/route.ts
import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Get the author handle from the URL
    const handle = request.nextUrl.searchParams.get('handle');
    
    if (!handle) {
      return NextResponse.json({ 
        error: "Author handle is required" 
      }, { status: 400 });
    }

    // Get author preferences
    const { data, error } = await supabase
      .from("author_preferences")
      .select("*")
      .eq("handle", handle)
      .single();

    if (error) {
      console.error('Error fetching author preferences:', error);
      // Return default preferences as fallback
      return NextResponse.json({
        font_style: "serif",
        theme_colors: {}
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authorToken, handle, preferences } = body;

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

    // Update author preferences
    const { error } = await supabase
      .from("author_preferences")
      .upsert({
        handle: handle,
        ...preferences,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'handle'
      });

    if (error) {
      console.error('Error updating preferences:', error);
      return NextResponse.json({
        error: "Failed to update preferences"
      }, { status: 500 });
    }

    // Revalidate author pages
    revalidateTag(`author:${handle}`);
    revalidatePath(`/${handle}`, "page");

    return NextResponse.json({
      success: true,
      message: "Preferences updated successfully"
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}