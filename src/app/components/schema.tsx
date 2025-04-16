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
    // Base URL for the site (updated to your domain)
    const baseUrl = "https://writeaway.blog";
    
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
    "name": "WriteAway Blog",
    "description": "The world's first spreadsheet-powered publishing platform.",
    "url": "https://writeaway.blog",
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
            "name": post.author
          },
          "url": `https://writeaway.blog/${post.author_handle}/${post.slug}`
        }
      }))
    }
  };

  // Organization schema for your brand
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "WriteAway Blog", 
    "url": "https://writeaway.blog",
    "logo": {
      "@type": "ImageObject",
      "url": "https://writeaway.blog/logo.png",
      "width": "180",
      "height": "180"
    }, 
    "sameAs": [
      // Add your social links here
    ],
    "description": "The world's first spreadsheet-powered publishing platform."
  };

  // WebSite schema for better SEO
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": "https://writeaway.blog",
    "name": "WriteAway Blog",
    "description": "The world's first spreadsheet-powered publishing platform.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://writeaway.blog/?search={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  // Add webpage schema for the current page
  const webpageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "url": `https://writeaway.blog${pathname}`,
    "name": pathname === "/" 
      ? "WriteAway Blog | Write On Sheets, Publish Anywhere" 
      : `${pathname.substring(1).charAt(0).toUpperCase() + pathname.substring(2)} | WriteAway Blog`,
    "description": "The world's first spreadsheet-powered publishing platform.",
    "isPartOf": {
      "@type": "WebSite",
      "name": "WriteAway Blog",
      "url": "https://writeaway.blog"
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