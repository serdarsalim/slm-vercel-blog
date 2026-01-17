import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/data";

const BASE_URL = "https://blog.serdarsalim.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();

  const postEntries = posts
    .filter((post) => post?.slug)
    .map((post) => ({
      url: `${BASE_URL}/posts/${post.slug}`,
      lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
    }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
    },
    ...postEntries,
  ];
}
