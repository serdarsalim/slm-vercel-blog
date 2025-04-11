// src/app/api/author/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Get the admin token from env vars (only admin can register authors)
    const adminToken = process.env.ADMIN_API_TOKEN || "your_admin_token";
    const body = await request.json();

    // Validate admin token
    if (body.adminToken !== adminToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate required fields
    const { handle, name, email } = body;
    if (!handle || !name || !email) {
      return NextResponse.json({ 
        error: "Handle, name, and email are required" 
      }, { status: 400 });
    }

    // Validate handle format (only alphanumeric and hyphens)
    if (!/^[a-z0-9-]+$/.test(handle)) {
      return NextResponse.json({
        error: "Handle must contain only lowercase letters, numbers, and hyphens"
      }, { status: 400 });
    }

    // Check if handle already exists
    const { data: existingAuthor } = await supabase
      .from("authors")
      .select("handle")
      .eq("handle", handle)
      .single();

    if (existingAuthor) {
      return NextResponse.json({
        error: "This handle is already taken"
      }, { status: 409 });
    }

    // Generate a secure API token for the author
    const apiToken = crypto.randomBytes(32).toString('hex');

    // Create author record
    const { data, error } = await supabase
      .from("authors")
      .insert([
        {
          handle,
          name,
          email,
          api_token: apiToken,
          bio: body.bio || null,
          avatar_url: body.avatarUrl || null,
          website_url: body.websiteUrl || null,
          social_links: body.socialLinks || {}
        }
      ])
      .select();

    if (error) {
      console.error('Error creating author:', error);
      return NextResponse.json({
        error: "Failed to create author"
      }, { status: 500 });
    }

    // Create default preferences
    await supabase.from("author_preferences").insert([
      {
        handle: handle,
        font_style: body.fontStyle || "serif",
        theme_colors: body.themeColors || {}
      }
    ]);

    // Return success with the API token (this will only be shown once)
    return NextResponse.json({
      success: true,
      message: `Author ${handle} created successfully`,
      author: {
        handle,
        name,
        email,
        apiToken // Include this so admin can provide it to the author
      }
    });
  } catch (error) {
    console.error('Error in author registration:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
