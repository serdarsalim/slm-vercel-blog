// app/api/preferences/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('preferences')
      .select('value')
      .eq('key', 'site')
      .single();
    
    if (error) throw error;
    
    // Return JUST the value object, not the whole record
    return NextResponse.json(data.value, {
      headers: {
        'Cache-Control': 'private, max-age=60'
      }
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { fontStyle: 'serif' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const secretToken = process.env.REVALIDATION_SECRET || 'your_default_secret';
    const body = await request.json();
    
    // Validate request
    if (body.secret !== secretToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    if (!body.preferences) {
      return NextResponse.json({ error: 'No preferences provided' }, { status: 400 });
    }
    
    // Update preferences
    const { error } = await supabase
      .from('preferences')
      .update({ 
        value: body.preferences,
        updated_at: new Date().toISOString()
      })
      .eq('key', 'site');
    
    if (error) throw error;
    
    // Revalidate paths
    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}