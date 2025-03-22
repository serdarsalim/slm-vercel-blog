import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * GET handler that proxies requests to Vercel Blob Storage
 * This avoids CORS issues when fetching from the client
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch the CSV file from Vercel Blob storage
    const response = await fetch('https://9ilxqyx7fm3eyyfw.public.blob.vercel-storage.com/blogPosts.csv', {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch from blob storage: ${response.status} ${response.statusText}`);
      return NextResponse.json({ 
        error: 'Failed to fetch data from blob storage'
      }, { 
        status: response.status 
      });
    }
    
    // Get the CSV content
    const csvData = await response.text();
    
    // Return the CSV data with appropriate headers
    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Cache-Control': 'public, max-age=60', // Cache for 1 minute
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': '*',
      }
    });
    
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error fetching CSV data'
    }, { 
      status: 500 
    });
  }
}

/**
 * OPTIONS handler to handle preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}