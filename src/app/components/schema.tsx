'use client';

import { Suspense } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useBlogPosts } from '../hooks/blogService';

function SchemaContent() {
  const { posts } = useBlogPosts();
  const pathname = usePathname();
  
  // Function to convert relative URLs to absolute URLs
  const getAbsoluteUrl = (relativeUrl) => {
    const baseUrl = "https://halqa.xyz";
    
    // Check if the URL is already absolute
    if (!relativeUrl || relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
      return relativeUrl || `${baseUrl}/default-image.png`;
    }
    
    // Make sure relativeUrl starts with a slash
    const normalizedRelativeUrl = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
    
    // Combine base URL with relative URL
    return `${baseUrl}${normalizedRelativeUrl}`;
  };
  
  // Blog schema - using posts instead of templates
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Serdar Salim Domurcuk",
    "description": "Digital notes, essays, and research on design, technology, and independent publishing by Serdar Salim Domurcuk.",
    "url": "https://halqa.xyz",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": posts.map((post, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "BlogPosting",
          "headline": post.title,
          "description": post.excerpt,
          "image": getAbsoluteUrl(post.featuredImage),
          "datePublished": post.date,
          "author": {
            "@type": "Person",
            "name": post.author || "Serdar Salim Domurcuk"
          },
          "url": `https://halqa.xyz/posts/${post.slug}`
        }
      }))
    }
  };

  // Identity schema for the site owner
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Serdar Salim Domurcuk", 
    "url": "https://halqa.xyz",
    "logo": {
      "@type": "ImageObject",
      "url": "https://halqa.xyz/logo.png",
      "width": "180",
      "height": "180"
    }, 
    "sameAs": [
      // Add your social links here
    ],
    "description": "Writer, designer, and systems thinker sharing experiments at the intersection of publishing, technology, and independent work."
  };

  // WebSite schema for better SEO
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": "https://halqa.xyz",
    "name": "Serdar Salim Domurcuk",
    "description": "Digital notes on design, technology, and self-directed work by Serdar Salim Domurcuk.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://halqa.xyz/?search={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  // Add webpage schema for the current page
  const webpageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "url": `https://halqa.xyz${pathname}`,
    "name": pathname === "/" 
      ? "Serdar Salim Domurcuk" 
      : `${pathname.substring(1).charAt(0).toUpperCase() + pathname.substring(2)} | Serdar Salim Domurcuk`,
    "description": "Writing, research notes, and product experiments on design, technology, and publishing.",
    "isPartOf": {
      "@type": "WebSite",
      "name": "Serdar Salim Domurcuk",
      "url": "https://halqa.xyz"
    }
  };

  return (
    <>
      <Script
        id="schema-blog"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(blogSchema)
        }}
      />
      <Script
        id="schema-organization"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema)
        }}
      />
      <Script
        id="schema-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema)
        }}
      />
      <Script
        id="schema-webpage"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webpageSchema)
        }}
      />
    </>
  );
}

export default function Schema() {
  return (
    <Suspense fallback={null}>
      <SchemaContent />
    </Suspense>
  );
}
