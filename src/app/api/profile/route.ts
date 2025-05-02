import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, getServiceRoleClient } from "@/lib/auth-config";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get client at runtime
    const serviceRoleClient = getServiceRoleClient();
    
    const { data: author } = await serviceRoleClient
      .from("authors")
      .select("*")
      .eq("email", session.user.email)
      .maybeSingle();
    
    if (author) {
      return NextResponse.json({ profile: author });
    }

    const { data: request } = await serviceRoleClient
      .from("author_requests")
      .select("*")
      .eq("email", session.user.email)
      .maybeSingle();
    
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
    const serviceRoleClient = getServiceRoleClient();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, handle, bio, website_url, avatar_url } = body;

    // Check for required fields
    if (!name || !handle) {
      return NextResponse.json(
        { error: "Name and handle are required" },
        { status: 400 }
      );
    }

    // First check if user exists in authors table to check admin status
    const { data: existingAuthor } = await serviceRoleClient
      .from("authors")
      .select("id, role, handle")
      .eq("email", session.user.email)
      .maybeSingle();

    // Check if the user is an admin
    const isAdmin = existingAuthor?.role === "admin";

    // For non-admin users, validate handle format and minimum length
    if (!isAdmin) {
      // Validate handle format
      if (!/^[a-zA-Z0-9_-]+$/.test(handle)) {
        return NextResponse.json(
          { error: "Handle can only contain letters, numbers, underscores, and hyphens" },
          { status: 400 }
        );
      }
      
      // Validate minimum handle length for non-admins
      if (handle.length < 4) {
        return NextResponse.json(
          { error: "Handle must be at least 4 characters long" },
          { status: 400 }
        );
      }
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

    // Check pending requests table too
    const { data: pendingHandle } = await serviceRoleClient
      .from("author_requests")
      .select("email")
      .eq("handle", handle)
      .not("email", "eq", session.user.email)
      .maybeSingle();
    
    if (pendingHandle) {
      return NextResponse.json(
        { error: "This handle is already taken by a pending user" },
        { status: 400 }
      );
    }

    if (existingAuthor) {
      // Update the author - posts will be fine since they're linked by ID
      const { error: updateError } = await serviceRoleClient
        .from("authors")
        .update({
          name,
          handle,
          bio,
          website_url: website_url || null,
          avatar_url: avatar_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingAuthor.id);

      if (updateError) {
        console.error("Error updating author:", updateError);
        return NextResponse.json(
          { error: "Failed to update profile: " + updateError.message },
          { status: 500 }
        );
      }

      // Optionally update the denormalized author_handle in posts
      // This is not critical since the foreign key relationship uses author_id
      await serviceRoleClient
        .from("posts")
        .update({ author_handle: handle })
        .eq("author_id", existingAuthor.id);
      
              // ADD THESE LINES - Critical for refreshing the UI!
      console.log("🔄 Revalidating paths after profile update");
      revalidatePath('/authors'); // Revalidate authors listing
      revalidatePath(`/${handle}`); // Revalidate author's own page
      revalidatePath('/'); // Revalidate homepage if it shows authors
      

    } else {
      // Update the request - no foreign key issues here
      const { error: updateRequestError } = await serviceRoleClient
        .from("author_requests")
        .update({
          name,
          handle,
          bio,
          website_url: website_url || null,
          avatar_url: avatar_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq("email", session.user.email);

      if (updateRequestError) {
        console.error("Error updating request:", updateRequestError);
        return NextResponse.json(
          { error: "Failed to update profile request: " + updateRequestError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "An error occurred while updating your profile" },
      { status: 500 }
    );
  }
}