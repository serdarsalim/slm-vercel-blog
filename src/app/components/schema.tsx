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
    // Base URL for the site (update to your blog URL)
    const baseUrl = "https://slm-blog.netlify.app";
    
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
    "name": "SLM Blog",
    "description": "Digital notes on my interests.",
    "url": "https://slm-blog.netlify.app",
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
            "name": post.author || "Serdar Salim"
          },
          "url": `https://slm-blog.netlify.app/blog/${post.slug}`
        }
      }))
    }
  };

  // Organization schema for your brand
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "SLM Blog", 
    "url": "https://slm-blog.netlify.app",
    "logo": {
      "@type": "ImageObject",
      "url": "https://slm-blog.netlify.app/logo.png",
      "width": "180",
      "height": "180"
    }, 
    "sameAs": [
      // Add your social links here
    ],
    "description": "Digital notes on my interests."
  };

  // WebSite schema for better SEO
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": "https://slm-blog.netlify.app",
    "name": "SLM Blog",
    "description": "Digital notes on my interests.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://slm-blog.netlify.app/?search={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  // Add webpage schema for the current page
  const webpageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "url": `https://slm-blog.netlify.app${pathname}`,
    "name": pathname === "/" 
      ? "SLM Blog | Digital notes on my interests" 
      : `${pathname.substring(1).charAt(0).toUpperCase() + pathname.substring(2)} | SLM Blog`,
    "description": "Digital notes on my interests.",
    "isPartOf": {
      "@type": "WebSite",
      "name": "SLM Blog",
      "url": "https://slm-blog.netlify.app"
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