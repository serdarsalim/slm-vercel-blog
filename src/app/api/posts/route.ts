// src/app/api/posts/route.ts
import { NextResponse } from 'next/server';
import { loadBlogPostsServer } from '@/app/utils/loadBlogServer';

// These variables persist between requests in production - server memory cache
let cachedPosts = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

// Keep dynamic to ensure the function runs on each request
export const dynamic = 'force-dynamic';

export async function GET(request) {
    const now = Date.now();
    
    // Check if we have valid cached posts
    if (cachedPosts && (now - cacheTimestamp < CACHE_TTL)) {
        console.log(`Serving ${cachedPosts.length} posts from memory cache (age: ${Math.round((now - cacheTimestamp)/1000)}s)`);
        
        // Return cached posts with headers indicating cache source
        return NextResponse.json(cachedPosts, {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=3600, s-maxage=86400',
                'Expires': new Date(now + 3600000).toUTCString(),
                'X-Cache': 'HIT',
                'X-Cache-Age': `${Math.round((now - cacheTimestamp)/1000)}s`
            }
        });
    }
    
    // If we reach here, cache is empty or stale
    console.log('Cache miss or expired, fetching fresh data');
    
    try {
        // Fetch fresh data using your existing loadBlogPostsServer function
        const posts = await loadBlogPostsServer();
        
        // Update our cache
        cachedPosts = posts;
        cacheTimestamp = now;
        
        console.log(`Updated cache with ${posts.length} posts at ${new Date().toISOString()}`);
        
        return NextResponse.json(posts, {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=3600, s-maxage=86400',
                'Expires': new Date(now + 3600000).toUTCString(),
                'X-Cache': 'MISS',
                'X-Updated': new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        
        // If we still have cached posts but they're expired, use them anyway in case of error
        if (cachedPosts) {
            console.log('Error fetching fresh data, using stale cache');
            return NextResponse.json(cachedPosts, {
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=1800, s-maxage=3600', // Shorter TTL for stale data
                    'Expires': new Date(now + 1800000).toUTCString(),
                    'X-Cache': 'STALE',
                    'X-Cache-Age': `${Math.round((now - cacheTimestamp)/1000)}s`
                }
            });
        }
        
        // Last resort fallback with empty array
        return NextResponse.json([], {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'X-Error': error.message || 'Unknown error'
            }
        });
    }
}