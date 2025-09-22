require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function generateSitemap() {
  // Load environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const baseUrl = 'https://halqa.co';

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials not found in environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Helper: format date without milliseconds
  const formatDate = iso => iso.split('.')[0] + 'Z';

  try {
    // Fetch authors and posts
    const [{ data: authors = [] }, { data: posts = [] }] = await Promise.all([
      supabase.from('authors').select('handle, updated_at'),
      supabase.from('posts').select('slug, author_handle, updated_at')
    ]);

    // Start XML with declaration
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Add homepage
    xml += `  <url>
`;
    xml += `    <loc>${baseUrl}</loc>
`;
    xml += `    <lastmod>${formatDate(new Date().toISOString())}</lastmod>
`;
    xml += `    <changefreq>daily</changefreq>
`;
    xml += `    <priority>1.0</priority>
`;
    xml += `  </url>
`;

    // Add each author
    authors.forEach(({ handle, updated_at }) => {
      xml += `  <url>
`;
      xml += `    <loc>${baseUrl}/${handle}</loc>
`;
      xml += `    <lastmod>${formatDate(new Date(updated_at).toISOString())}</lastmod>
`;
      xml += `    <changefreq>weekly</changefreq>
`;
      xml += `    <priority>0.8</priority>
`;
      xml += `  </url>
`;
    });

    // Add each post
    posts.forEach(({ author_handle, slug, updated_at }) => {
      xml += `  <url>
`;
      xml += `    <loc>${baseUrl}/${author_handle}/${slug}</loc>
`;
      xml += `    <lastmod>${formatDate(new Date(updated_at).toISOString())}</lastmod>
`;
      xml += `    <changefreq>monthly</changefreq>
`;
      xml += `    <priority>0.7</priority>
`;
      xml += `  </url>
`;
    });

    // Close urlset
    xml += `</urlset>`;

    // Ensure public directory exists
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

    // Write sitemap.xml
    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf8');

    console.log('✅ Sitemap generated successfully at public/sitemap.xml');
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

generateSitemap();
