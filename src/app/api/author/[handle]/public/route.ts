import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { handle: string } }
) {
  try {
    const { handle } = params;
    
    // Query the authors_public view (or authors table)
    const { data, error } = await supabase
      .from('authors_public') // Use your public authors view
      .select('name, handle')
      .eq('handle', handle)
      .single();
    
    if (error) {
      throw new Error(`Failed to fetch author data: ${error.message}`);
    }
    
    if (!data) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 }
      );
    }
    
    // Return in the format expected by your navbar component
    return NextResponse.json({
      author: {
        name: data.name,
        handle: data.handle
      }
    });
  } catch (error) {
    console.error('Error fetching author:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}