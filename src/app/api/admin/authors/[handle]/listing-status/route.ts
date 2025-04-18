import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from "next/cache";

export async function POST(
  request: NextRequest,
  { params }: { params: { handle: string } }
) {
  try {
    // Get admin token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const adminToken = authHeader ? authHeader.replace('Bearer ', '') : null;
    const validAdminToken = process.env.ADMIN_API_TOKEN;
    
    if (!adminToken || adminToken !== validAdminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { handle } = params;
    
    // Get the new listing status from request body
    const body = await request.json();
    const { listing_status } = body;
    
    if (!listing_status || !["listed", "unlisted"].includes(listing_status)) {
      return NextResponse.json({ error: 'Invalid listing status value' }, { status: 400 });
    }
    
    // Create admin client with service role key to bypass RLS
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    // First check if author exists
    const { data: authorExists, error: checkError } = await adminSupabase
      .from('authors')
      .select('handle')
      .eq('handle', handle)
      .maybeSingle();
      
    if (checkError || !authorExists) {
      return NextResponse.json({ error: `Author with handle ${handle} not found` }, { status: 404 });
    }
    
    // Update author listing_status using admin client
    const { error } = await adminSupabase
      .from('authors')
      .update({ listing_status })
      .eq('handle', handle);
    
    if (error) {
      return NextResponse.json({ 
        error: 'Failed to update author listing status', 
        details: error 
      }, { status: 500 });
    }
    
    // Revalidate the relevant paths
    revalidatePath(`/${handle}`, 'page');
    revalidatePath(`/${handle}/blog`, 'page');
    revalidatePath('/authors', 'page'); 
    revalidatePath('/', 'page');
    
    return NextResponse.json({
      success: true,
      message: `Author ${handle} listing status updated to ${listing_status}`
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to update author listing status', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}