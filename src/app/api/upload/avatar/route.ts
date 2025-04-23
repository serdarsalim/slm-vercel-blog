import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, getServiceRoleClient } from "@/lib/auth-config";
import sharp from 'sharp';

export const maxDuration = 60; // Longer timeout for uploads and image processing

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const formData = await request.formData();
    const file = formData.get('avatar') as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: "Only images are allowed" }, { status: 400 });
    }
    
    // Increased size limit since we'll be optimizing the image
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }
    
    // Get service role client for storage operations
    const serviceRoleClient = getServiceRoleClient();
    
    // Get original file as buffer
    const originalBuffer = await file.arrayBuffer();
    const originalSize = file.size;
    
    // Optimize image with Sharp
    const optimizedBuffer = await sharp(Buffer.from(originalBuffer))
  .resize(400, 400, { // Double the resolution for higher quality (was 200x200)
    fit: 'cover',
    position: 'center'
  })
  .jpeg({ quality: 90 }) // Increase quality from 80 to 90
  .toBuffer();
    
    // Calculate size reduction
    const optimizedSize = optimizedBuffer.length;
    const reduction = Math.round((1 - (optimizedSize / originalSize)) * 100);
    
    // Check if the user already has an avatar
    let existingAvatarPath = null;
    
    // First check if user exists in authors table to get current avatar
    const { data: author } = await serviceRoleClient
      .from("authors")
      .select("id, avatar_url")
      .eq("email", session.user.email)
      .maybeSingle();
    
    // If no author record, check author_requests
    if (!author) {
      const { data: authorRequest } = await serviceRoleClient
        .from("author_requests")
        .select("id, avatar_url")
        .eq("email", session.user.email)
        .maybeSingle();
        
      if (authorRequest?.avatar_url) {
        existingAvatarPath = getStoragePathFromUrl(authorRequest.avatar_url);
      }
    } else if (author.avatar_url) {
      existingAvatarPath = getStoragePathFromUrl(author.avatar_url);
    }
    
    // Use consistent filename for the user - either reuse existing or create standard one
    const userFilePath = existingAvatarPath || `public/${session.user.email}/avatar.jpg`;
    
    // Upload optimized image to avatars bucket (overwriting if exists)
    const { data, error } = await serviceRoleClient
      .storage
      .from('avatars')
      .upload(userFilePath, optimizedBuffer, {
        contentType: 'image/jpeg', // Always JPEG after our optimization
        upsert: true // This ensures we overwrite any existing file
      });
    
    if (error) {
      console.error("Error uploading avatar:", error);
      return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 });
    }
    
    // Get the public URL
    const { data: publicURL } = serviceRoleClient
      .storage
      .from('avatars')
      .getPublicUrl(userFilePath);
    
    // Add cache-busting parameter to the URL to prevent browser caching
    const cacheBustedUrl = addCacheBustingToUrl(publicURL.publicUrl);
    
    // Update the author's avatar_url
    await updateAuthorAvatar(session.user.email, cacheBustedUrl, serviceRoleClient);
    
    // Optional: If we have an old avatar path that's different from the new one, delete it
    if (existingAvatarPath && existingAvatarPath !== userFilePath) {
      try {
        await serviceRoleClient
          .storage
          .from('avatars')
          .remove([existingAvatarPath]);
      } catch (deleteError) {
        // Just log but continue - not critical if old avatar deletion fails
        console.warn("Failed to delete old avatar:", deleteError);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      avatar_url: cacheBustedUrl,
      originalSize,
      optimizedSize,
      reduction
    });
    
  } catch (error) {
    console.error("Error handling avatar upload:", error);
    return NextResponse.json(
      { error: "Failed to process avatar" },
      { status: 500 }
    );
  }
}

// Helper to update avatar URL in the database
async function updateAuthorAvatar(email: string, avatar_url: string, client: any) {
  // First check if user exists in authors table
  const { data: author } = await client
    .from("authors")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (author) {
    await client
      .from("authors")
      .update({ avatar_url, updated_at: new Date().toISOString() })
      .eq("id", author.id);
  } else {
    await client
      .from("author_requests")
      .update({ avatar_url, updated_at: new Date().toISOString() })
      .eq("email", email);
  }
}
// Helper to add cache-busting parameter to URLs
function addCacheBustingToUrl(url: string): string {
    if (!url) return url;
    
    // Add a timestamp to prevent browser caching
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}`;
  }
// Helper to extract storage path from a full URL
function getStoragePathFromUrl(url: string): string | null {
    try {
      if (!url) return null;
      
      console.log("Extracting path from URL:", url);
      
      // More reliable regex pattern that handles different URL structures
      const storagePathMatch = url.match(/\/storage\/v1\/object\/(?:public|sign)\/avatars\/(.+?)(?:\?.*)?$/);
      
      if (storagePathMatch && storagePathMatch[1]) {
        console.log("Found path:", storagePathMatch[1]);
        return storagePathMatch[1];
      }
      
      // Fallback pattern
      const altMatch = url.match(/avatars\/(.+?)(?:\?.*)?$/);
      if (altMatch && altMatch[1]) {
        console.log("Found path (alt):", altMatch[1]);
        return altMatch[1];
      }
      
      console.log("Could not extract path from URL");
      return null;
    } catch (error) {
      console.error("Failed to parse storage path from URL:", error);
      return null;
    }
  }