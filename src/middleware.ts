import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define static routes that should not be treated as author handles
const STATIC_ROUTES = [
  '/home',
  '/about',
  '/blog',
  '/join',
  '/terms',
  '/privacy',
  '/authors',
  '/admin'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Handle CORS for API routes
  if (pathname.startsWith('/api/')) {
    // Handle preflight OPTIONS request first
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // For actual API requests, add CORS headers to the response
    const response = NextResponse.next();
    
    // Add the CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    return response;
  }
  
  // Check if this is a static route - if so, just continue
  if (isStaticRoute(pathname)) {
    return NextResponse.next();
  }
  
  // Check if this could be an author handle route
  if (isAuthorHandleRoute(pathname)) {
    // At this point, we know:
    // 1. It's not a static route like /home or /about
    // 2. It matches the pattern of an author handle
    
    // Let the [handle] route handler check if the author exists
    return NextResponse.next();
  }
  
  // For all other routes, proceed normally
  return NextResponse.next();
}

// Helper function to check if a pathname is a static route
function isStaticRoute(pathname: string): boolean {
  // Check exact matches first
  if (STATIC_ROUTES.includes(pathname)) {
    return true;
  }
  
  // Check if it's a nested path under a static route
  return STATIC_ROUTES.some(route => 
    pathname.startsWith(`${route}/`) && route !== '/'
  );
}

// Helper function to check if a pathname looks like an author handle route
function isAuthorHandleRoute(pathname: string): boolean {
  // Pattern: /handle or /handle/blog or /handle/blog/something
  // But not /api/something or other special paths
  
  // Split the pathname into segments
  const segments = pathname.split('/').filter(Boolean);
  
  // If no segments or starts with a reserved keyword, it's not an author route
  if (segments.length === 0 || isReservedSegment(segments[0])) {
    return false;
  }
  
  // Check if the first segment matches author handle pattern (alphanumeric, underscores, hyphens)
  return /^[a-zA-Z0-9_-]+$/.test(segments[0]);
}

// Helper function to check if a segment is reserved
function isReservedSegment(segment: string): boolean {
  // List of reserved first-segment names that aren't author handles
  const reserved = ['api', 'admin', 'blog', 'about', 'join', 'authors', 'assets', 'images'];
  return reserved.includes(segment.toLowerCase());
}

// Configure which routes middleware applies to
export const config = {
  matcher: [
    // Apply to all API routes
    '/api/:path*',
    
    // Apply to potential author routes (but not to static asset routes)
    '/((?!_next/|static/|public/|favicon.ico).*)',
  ],
};