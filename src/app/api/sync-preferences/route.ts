import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    // Get the secret token from env vars
    const secretToken = process.env.REVALIDATION_SECRET || "your_default_secret";
    const body = await request.json();

    // Validate request
    if (body.secret !== secretToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { preferences } = body;

    if (!preferences) {
      return NextResponse.json(
        { error: "No preferences data provided" },
        { status: 400 }
      );
    }

    // Update or insert preferences
    // Update or insert preferences
const { error } = await supabase
.from('preferences')
.upsert({ 
  key: 'site',
  value: preferences,
  updated_at: new Date().toISOString()
}, {
  onConflict: 'key'
});
    
    if (error) {
      console.error('Error updating preferences:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
    
    // Revalidate paths
    console.log("Preferences updated, revalidating paths...");
    revalidatePath("/", "page");

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      updated: true
    });
  } catch (error) {
    console.error("Error processing preferences sync request:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}