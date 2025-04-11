
// app/api/author/request-join/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body - this comes from the join form
    const { name, handle, email, bio, website } = await request.json();
    
    // Validate required fields
    if (!name || !handle || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Validate handle format
    if (!/^[a-zA-Z0-9_-]+$/.test(handle)) {
      return NextResponse.json({ 
        error: 'Handle can only contain letters, numbers, underscores, and hyphens' 
      }, { status: 400 });
    }

    // Check if handle is already taken
    const { data: existingAuthor } = await supabase
      .from('authors')
      .select('id')
      .eq('handle', handle.toLowerCase())
      .single();
    
    if (existingAuthor) {
      return NextResponse.json({ error: 'This handle is already taken' }, { status: 400 });
    }
    
    // Check if there's a pending request for this handle
    const { data: existingRequest } = await supabase
      .from('author_requests')
      .select('id')
      .eq('handle', handle.toLowerCase())
      .single();
      
    if (existingRequest) {
      return NextResponse.json({ error: 'There is already a pending request for this handle' }, { status: 400 });
    }
    
    // Generate an API token for the author (they'll get this after approval)
    const apiToken = randomBytes(32).toString('hex');
    
    // Create the author request
    const { error: requestError } = await supabase
      .from('author_requests')
      .insert({
        handle: handle.toLowerCase(),
        name,
        email,
        bio: bio || null,
        website_url: website || null,
        api_token: apiToken,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
    
    if (requestError) {
      console.error('Error creating author request:', requestError);
      return NextResponse.json({ 
        error: 'Failed to create author request' 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Your request has been submitted and will be reviewed'
    });
    
  } catch (error) {
    console.error('Join request error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}