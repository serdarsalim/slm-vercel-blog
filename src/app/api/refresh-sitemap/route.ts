import { NextResponse } from 'next/server';
import { getServiceRoleClient } from "@/lib/auth-config";
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    // Check if this is a Google verification file request
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    if (pathname.match(/\/google\w+\.html$/)) {
      // Skip processing Google verification files
      return new NextResponse(null, { status: 404 });
    }


    // Add your security check here if needed
    const token = request.nextUrl.searchParams.get('token');
    if (token !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }
    
    const serviceRoleClient = getServiceRoleClient();
    const baseUrl = 'https://blog.serdarsalim.com';
    
    // Fetch data
    const { data: posts = [] } = await serviceRoleClient
      .from("posts")
      .select("slug, updated_at")
      .eq('published', true);
    
    // Format date without milliseconds
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toISOString().replace(/\.\d+Z$/, 'Z');
    };
    
    // Build XML string - NO BLANK LINE before XML declaration!
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${formatDate(new Date().toISOString())}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;
    
    for (const post of posts) {
      xml += `
  <url>
    <loc>${baseUrl}/posts/${post.slug}</loc>
    <lastmod>${formatDate(post.updated_at)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }
    
    xml += `
</urlset>`;

    // Write to a static file
    const publicDir = path.join(process.cwd(), 'public');
    await fs.writeFile(path.join(publicDir, 'sitemap.xml'), xml);
    
    return NextResponse.json({ success: true, message: 'Sitemap updated successfully' });
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return NextResponse.json({ success: false, message: 'Failed to update sitemap' }, { status: 500 });
  }
}
