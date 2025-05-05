import { NextResponse } from 'next/server';
import { getServiceRoleClient } from "@/lib/auth-config";

export async function GET() {
  try {
    const serviceRoleClient = getServiceRoleClient();
    const baseUrl = 'https://halqa.xyz';
    
    // Fetch data
    const { data: authors = [] } = await serviceRoleClient
      .from("authors")
      .select("handle, updated_at");
      
    const { data: posts = [] } = await serviceRoleClient
      .from("posts")
      .select("slug, author_handle, updated_at");
    
    // Build XML string manually - no type issues with this approach
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;
    
    // Add all author URLs
    for (const author of authors) {
      xml += `
  <url>
    <loc>${baseUrl}/${author.handle}</loc>
    <lastmod>${new Date(author.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }
    
    // Add all post URLs
    for (const post of posts) {
      xml += `
  <url>
    <loc>${baseUrl}/${post.author_handle}/${post.slug}</loc>
    <lastmod>${new Date(post.updated_at).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }
    
    // Close the XML
    xml += `
</urlset>`;
    
    // Return with correct content type
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
      }
    });
  } catch (error) {
    console.error("Error generating sitemap:", error);
    
    // Fallback minimal sitemap
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://halqa.xyz</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <priority>1.0</priority>
  </url>
</urlset>`, {
      headers: {
        'Content-Type': 'application/xml'
      }
    });
  }
}