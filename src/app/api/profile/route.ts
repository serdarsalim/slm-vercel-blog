import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { supabase } from "@/lib/supabase";
import { createClient } from '@supabase/supabase-js';

// Create service role client for privileged operations
const serviceRoleClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!, 
  { auth: { persistSession: false } }
);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Looking up profile for email:", session.user.email);
    
    // Use serviceRoleClient instead of supabase client
    const { data: author } = await serviceRoleClient
      .from("authors")
      .select("*")
      .eq("email", session.user.email)
      .maybeSingle();

    console.log("Author lookup result:", author);
    
    if (author) {
      return NextResponse.json({ profile: author });
    }

    // Also use serviceRoleClient here
    const { data: request } = await serviceRoleClient
      .from("author_requests")
      .select("*")
      .eq("email", session.user.email)
      .maybeSingle();

    console.log("Request lookup result:", request);
    
    if (request) {
      return NextResponse.json({ profile: request });
    }

    return NextResponse.json({ profile: null });
  } catch (error) {
    console.error("Error getting profile:", error);
    return NextResponse.json(
      { error: "Failed to get profile" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, handle, bio, website_url } = body;

    if (!name || !handle) {
      return NextResponse.json(
        { error: "Name and handle are required" },
        { status: 400 }
      );
    }

    // Validate handle format
    if (!/^[a-zA-Z0-9_-]+$/.test(handle)) {
      return NextResponse.json(
        {
          error: "Handle can only contain letters, numbers, underscores, and hyphens",
        },
        { status: 400 }
      );
    }

    // Check if handle is already taken by another user
    const { data: existingHandle } = await serviceRoleClient
      .from("authors")
      .select("email")
      .eq("handle", handle)
      .not("email", "eq", session.user.email)
      .maybeSingle();

    if (existingHandle) {
      return NextResponse.json(
        { error: "This handle is already taken" },
        { status: 400 }
      );
    }

    // First check if user exists in authors table
    const { data: author } = await serviceRoleClient
      .from("authors")
      .select("id")
      .eq("email", session.user.email)
      .maybeSingle();

    if (author) {
      // Update existing author
      const { error: updateError } = await serviceRoleClient
        .from("authors")
        .update({
          name,
          handle,
          bio,
          website_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", author.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      // Update the request
      const { error: updateRequestError } = await serviceRoleClient
        .from("author_requests")
        .update({
          name,
          handle,
          bio,
          website_url,
          updated_at: new Date().toISOString(),
        })
        .eq("email", session.user.email);

      if (updateRequestError) {
        throw updateRequestError;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}