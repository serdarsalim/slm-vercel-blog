// scripts/generate-sitemap.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function generateSitemap() {
  // Create Supabase client using environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials not found in environment variables');
    process.exit(1);
  }
  
  const serviceRoleClient = createClient(supabaseUrl, supabaseKey);
  const baseUrl = 'https://halqa.xyz';
  
  try {
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
    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml);
    
    console.log('Sitemap generated successfully');
  } catch (error) {
    console.error("Error generating sitemap:", error);
    process.exit(1);
  }
}

generateSitemap();