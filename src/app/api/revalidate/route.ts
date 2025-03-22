import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// The secret token that only your webhook should know
const REVALIDATION_SECRET = process.env.REVALIDATION_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Verify the secret token
    if (body.secret !== REVALIDATION_SECRET) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
    
    // Get the path to revalidate (default to blog if not specified)
    const path = body.path || '/blog';
    
    // Revalidate the path
    revalidatePath(path);
    
    // Return a success response
    return NextResponse.json({ 
      revalidated: true, 
      now: Date.now(),
      message: `Path ${path} revalidated successfully` 
    });
    
  } catch (error) {
    // If there's an error, return a 500 response
    console.error('Revalidation error:', error);
    return NextResponse.json({ 
      message: 'Error revalidating',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}