import { NextResponse } from 'next/server';
import { loadBlogPostsServer, processCsvData } from '@/app/utils/loadBlogServer';


export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
      // Force every request to generate a new response
      // Generate a new timestamp to ensure fresh data from blob storage
      const timestamp = Date.now();
      
      // Use a completely fresh URL every time
      const freshBlobUrl = `https://9ilxqyx7fm3eyyfw.public.blob.vercel-storage.com/blogPosts.csv?t=${timestamp}&r=${Math.random()}`;
      
      // Force a direct fetch to the blob storage 
      const response = await fetch(freshBlobUrl, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-store, must-revalidate, max-age=0',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch from blob: ${response.status}`);
      }
      
      const csvText = await response.text();
      
      // Process the CSV text directly
      const posts = await processCsvData(csvText);
      
      // Log the first post title to verify the data
      console.log(`Returning ${posts.length} posts, First post: ${posts[0]?.title}`);
      
      return NextResponse.json(posts, {
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Updated': new Date().toISOString() // Add a header to show when this was generated
        }
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
      
      // Fall back to the standard loadBlogPostsServer method
      const posts = await loadBlogPostsServer();
      
      return NextResponse.json(posts, { 
        status: 200, 
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Fallback': 'true'
        }
      });
    }
  }