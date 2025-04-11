import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { randomBytes, createHash } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { token, name, handle, email, bio, password } = await request.json();
    
    // Validate required fields
    if (!token || !name || !handle || !email || !password) {
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
      .eq('handle', handle)
      .single();
    
    if (existingAuthor) {
      return NextResponse.json({ error: 'This handle is already taken' }, { status: 400 });
    }
    
    // Verify the invitation token
    const { data: invitation, error: invitationError } = await supabase
      .from('author_invitations')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single();
    
    if (invitationError || !invitation) {
      return NextResponse.json({ 
        error: 'Invalid or already used invitation token' 
      }, { status: 400 });
    }
    
    // Generate a salt and hash the password
    const salt = randomBytes(16).toString('hex');
    const hashedPassword = createHash('sha256')
      .update(password + salt)
      .digest('hex');
    
    // Generate an API token for the author
    const apiToken = randomBytes(32).toString('hex');
    
    // Create the author
    const { data: author, error: authorError } = await supabase
      .from('authors')
      .insert({
        handle,
        name,
        email,
        bio,
        password_hash: hashedPassword,
        salt,
        api_token: apiToken,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (authorError) {
      console.error('Error creating author:', authorError);
      return NextResponse.json({ 
        error: 'Failed to create author account' 
      }, { status: 500 });
    }
    
    // Mark the invitation as used
    await supabase
      .from('author_invitations')
      .update({
        used: true,
        used_by: author.id,
        used_at: new Date().toISOString()
      })
      .eq('id', invitation.id);
    
    // Create initial author preferences
    await supabase
      .from('author_preferences')
      .insert({
        author_id: author.id,
        font_style: 'sans-serif',
        theme_colors: {},
        featured_posts: [],
        sidebar_widgets: []
      });
    
    return NextResponse.json({
      success: true,
      author: {
        id: author.id,
        handle: author.handle,
        name: author.name
      },
      apiToken // Return the API token that the author will need to publish posts
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}