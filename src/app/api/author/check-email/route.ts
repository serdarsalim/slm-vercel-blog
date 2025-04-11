import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get email from query parameters
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }
    
    // First check author_requests table
    const { data: requestsData, error: requestsError } = await supabase
      .from('author_requests')
      .select('id')
      .eq('email', email)
      .limit(1);
    
    if (requestsError) {
      throw new Error('Failed to check author requests');
    }
    
    // If found in requests, email already exists
    if (requestsData && requestsData.length > 0) {
      return NextResponse.json({ exists: true });
    }
    
    // Next check authors table
    const { data: authorsData, error: authorsError } = await supabase
      .from('authors')
      .select('id')
      .eq('email', email)
      .limit(1);
    
    if (authorsError) {
      throw new Error('Failed to check authors');
    }
    
    // Return whether email exists in either table
    return NextResponse.json({ 
      exists: (authorsData && authorsData.length > 0) 
    });
  } catch (error) {
    console.error('Error checking email:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}