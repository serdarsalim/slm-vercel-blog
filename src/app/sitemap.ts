// src/app/sitemap.ts - This single file handles everything automatically
import { getServiceRoleClient } from "@/lib/auth-config";

export default async function sitemap() {
  const serviceRoleClient = getServiceRoleClient();
  const baseUrl = 'https://halqa.xyz';
  
  // Automatically get ALL authors and posts in one file
  const { data: authors } = await serviceRoleClient
    .from("authors")
    .select("handle, updated_at");
    
  const { data: posts } = await serviceRoleClient
    .from("posts")
    .select("slug, author_handle, updated_at");
  
  // Build URLs for everything automatically
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      priority: 1.0
    },
    // Authors - automatic for all current and future authors
    ...(authors?.map(author => ({
      url: `${baseUrl}/${author.handle}`,
      lastModified: new Date(author.updated_at),
      priority: 0.8
    })) || []),
    // Posts - automatic for all current and future posts
    ...(posts?.map(post => ({
      url: `${baseUrl}/${post.author_handle}/${post.slug}`,
      lastModified: new Date(post.updated_at),
      priority: 0.7
    })) || [])
  ];
}