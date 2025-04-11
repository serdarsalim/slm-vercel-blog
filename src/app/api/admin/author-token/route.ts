// src/app/api/admin/author-token/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Verify admin token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const adminToken = authHeader ? authHeader.replace('Bearer ', '') : null;
    const validAdminToken = process.env.ADMIN_API_TOKEN;
    
    if (!adminToken || adminToken !== validAdminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get author handle from request body
    const body = await request.json();
    const { handle } = body;
    
    if (!handle) {
      return NextResponse.json({ error: 'Author handle is required' }, { status: 400 });
    }
    
    // Generate a new API token
    const newApiToken = crypto.randomBytes(32).toString('hex');
    
    // Update author's API token
    const { data, error } = await supabase
      .from('authors')
      .update({ api_token: newApiToken })
      .eq('handle', handle)
      .select('name')
      .single();
      
    if (error) {
      console.error('Error updating author token:', error);
      return NextResponse.json({ error: 'Failed to update author token' }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: `API token regenerated for ${data.name}`,
      apiToken: newApiToken
    });
  } catch (error) {
    console.error('Unexpected error in regenerate author token:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}