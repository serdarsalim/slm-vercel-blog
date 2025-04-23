import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Use authors_public instead of authors table
    const { data, error } = await supabase
      .from('authors_public')
      .select('id, name, handle, bio, avatar_url, website_url')
      .eq('listing_status', true); // Only show authors with listing_status = true
    
    if (error) {
      console.error('Error fetching authors:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ authors: data });
  } catch (error) {
    console.error('Error fetching authors:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}