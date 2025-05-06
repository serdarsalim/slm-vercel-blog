import { NextResponse } from 'next/server';

// This ensures only Vercel can trigger this endpoint
export const runtime = 'edge';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  // Verify the request is from Vercel Cron
  if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  
  try {
    // Call your existing sitemap refresh endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/refresh-sitemap?token=${process.env.REVALIDATION_SECRET}`, {
      method: 'GET'
    });
    
    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Sitemap refresh triggered successfully',
      result
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to refresh sitemap'
    }, { status: 500 });
  }
}