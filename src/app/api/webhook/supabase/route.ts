import { NextResponse } from 'next/server';
import { getServiceRoleClient } from "@/lib/auth-config";
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    // Verify webhook signature if you have one configured
    const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;

    if (webhookSecret) {
      const signature = request.headers.get('x-webhook-signature');
      if (signature !== webhookSecret) {
        return NextResponse.json({ success: false, message: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    // Parse webhook payload
    const payload = await request.json();
    console.log('Supabase webhook triggered:', payload);

    // Check if the change affects content that should trigger a sitemap update
    const affectedTables = ['posts', 'authors'];
    const tableName = payload.table || payload.schema?.table;

    if (!affectedTables.includes(tableName)) {
      return NextResponse.json({
        success: true,
        message: `Table ${tableName} does not require sitemap update`
      });
    }

    // Generate new sitemap
    const serviceRoleClient = getServiceRoleClient();
    const baseUrl = 'https://blog.serdarsalim.com';

    // Fetch data
    const { data: posts = [] } = await serviceRoleClient
      .from("posts")
      .select("slug, updated_at")
      .eq('published', true);

    // Format date without milliseconds
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toISOString().replace(/\.\d+Z$/, 'Z');
    };

    // Build XML string
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${formatDate(new Date().toISOString())}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

    // Add posts
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

    // Write to file
    const publicDir = path.join(process.cwd(), 'public');
    await fs.writeFile(path.join(publicDir, 'sitemap.xml'), xml);

    console.log('Sitemap updated automatically via webhook');

    return NextResponse.json({
      success: true,
      message: 'Sitemap updated successfully via webhook',
      updatedAt: new Date().toISOString(),
      triggeredBy: tableName
    });

  } catch (error) {
    console.error("Error in Supabase webhook:", error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update sitemap via webhook',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
