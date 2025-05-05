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
    
    // Format date without milliseconds
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toISOString().replace(/\.\d+Z$/, 'Z');
    };
    
    // IMPORTANT: Split into declaration and content to guarantee it's included
    const xmlDeclaration = '<?xml version="1.0" encoding="UTF-8"?>';
    let xmlContent = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Add homepage
    xmlContent += `  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${formatDate(new Date())}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;
    
    // Add authors
    for (const author of authors) {
      xmlContent += `
  <url>
    <loc>${baseUrl}/${author.handle}</loc>
    <lastmod>${formatDate(author.updated_at)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }
    
    // Add posts
    for (const post of posts) {
      xmlContent += `
  <url>
    <loc>${baseUrl}/${post.author_handle}/${post.slug}</loc>
    <lastmod>${formatDate(post.updated_at)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }
    
    // Close the XML
    xmlContent += '\n</urlset>';
    
    // Combine declaration and content with a newline between
    const completeXml = xmlDeclaration + '\n' + xmlContent;

    // Write to file with explicit UTF-8 encoding
    const publicDir = path.join(process.cwd(), 'public');
    fs.writeFileSync(
      path.join(publicDir, 'sitemap.xml'), 
      completeXml, 
      { encoding: 'utf8' }
    );
    
    console.log('Sitemap generated successfully');
  } catch (error) {
    console.error("Error generating sitemap:", error);
    process.exit(1);
  }
}

generateSitemap();