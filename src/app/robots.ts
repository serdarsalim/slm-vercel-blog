// src/app/robots.ts (in addition to your public/robots.txt)
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/_next/', '/static/'],
    },
    sitemap: 'https://blog.serdarsalim.com/sitemap.xml',
  }
}
