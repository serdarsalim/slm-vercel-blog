import { NextResponse } from 'next/server';
import { getServiceRoleClient } from "@/lib/auth-config";
import fs from 'fs/promises';
import path from 'path';

export async function GET(request) {
  try {
    // Add your security check here if needed
    const token = request.nextUrl.searchParams.get('token');
    if (token !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }
    
    const serviceRoleClient = getServiceRoleClient();
    const baseUrl = 'https://halqa.xyz';
    
    // Fetch data
    const { data: authors = [] } = await serviceRoleClient
      .from("authors")
      .select("handle, updated_at");
      
    const { data: posts = [] } = await serviceRoleClient
      .from("posts")
      .select("slug, author_handle, updated_at");
    
    // Build XML string
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;
    
    // Add authors and posts...
    for (const author of authors) {
      xml += `
  <url>
    <loc>${baseUrl}/${author.handle}</loc>
    <lastmod>${new Date(author.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }
    
    for (const post of posts) {
      xml += `
  <url>
    <loc>${baseUrl}/${post.author_handle}/${post.slug}</loc>
    <lastmod>${new Date(post.updated_at).toISOString()}</lastmod>
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