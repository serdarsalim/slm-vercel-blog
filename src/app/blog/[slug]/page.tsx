"use client";

import { Suspense, useState, useRef, lazy, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { usePostBySlug, getPreferences } from "@/app/hooks/blogService";
import Link from "next/link";
import Utterances from "@/app/components/Utterances";
import VirtualizedCsvViewer from "@/app/components/VirtualizedCsvViewer";
export default function BlogPostPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white relative">
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin w-10 h-10 border-4 border-orange-500 rounded-full border-t-transparent"></div>
          </div>
        }
      >
        <BlogPostContent />
      </Suspense>
    </div>
  );
}



// Add this helper function (e.g., near the top of your component)
const openSharePopup = (url: string, title: string = "Share") => {
  const width = 600;
  const height = 600;
  const left = window.screen.width / 2 - width / 2;
  const top = window.screen.height / 2 - height / 2;
  window.open(
    url,
    title.replace(/\s+/g, ""),
    `width=${width},height=${height},top=${top},left=${left},scrollbars=yes`
  );
};

function BlogPostContent() {
  const [fontStyle, setFontStyle] = useState("serif");
  const params = useParams();
  const router = useRouter();
  const slug =
    typeof params.slug === "string"
      ? params.slug
      : Array.isArray(params.slug)
      ? params.slug[0]
      : "";

  const { post, loading, error } = usePostBySlug(slug);
  const [readingProgress, setReadingProgress] = useState(0);
  const [tableOfContents, setTableOfContents] = useState<
    { id: string; text: string; level: string }[]
  >([]);

  // Add state for dark mode tracking and processed content
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [processedContent, setProcessedContent] = useState("");

  // Add this effect to fetch settings
  useEffect(() => {
    async function fetchSettings() {
      const { fontStyle } = await getPreferences();
      setFontStyle(fontStyle);
    }

    fetchSettings();
  }, []);

  // Calculate reading progress on scroll and extract headings for TOC...
  useEffect(() => {
    if (!post) return;

    // Extract headings for the table of contents
    if (post.content) {
      // Extract headings code (keep as is)
      const headings = [];
      const regex = /<h([2-3])[^>]*>(.*?)<\/h\1>/g;
      let match;
      while ((match = regex.exec(post.content)) !== null) {
        const level = match[1];
        const text = match[2].replace(/<[^>]*>/g, "");
        const id = text.toLowerCase().replace(/[^\w]+/g, "-");
        headings.push({ id, text, level });
      }
      setTableOfContents(headings);
    }

    // Check if content contains YouTube videos or images
    const hasYouTubeVideo =
      post.content &&
      (post.content.includes("youtube.com/embed") ||
        post.content.includes("youtu.be"));

    // Check for image tags properly
    const hasImages =
      post.content &&
      (post.content.includes("<img") || post.content.includes("image/"));

    // Skip scroll tracking if YouTube videos or images are present
    if (hasYouTubeVideo || hasImages) {
      setReadingProgress(0); // Reset progress
      return; // Exit early - don't add scroll listener
    }

    // Only add scroll event listener if no YouTube videos present
    const updateReadingProgress = () => {
      const currentProgress = window.scrollY;
      const scrollHeight = document.body.scrollHeight - window.innerHeight;
      if (scrollHeight) {
        setReadingProgress(
          Number((currentProgress / scrollHeight).toFixed(2)) * 100
        );
      }
    };

    window.addEventListener("scroll", updateReadingProgress);
    return () => window.removeEventListener("scroll", updateReadingProgress);
  }, [post]);

  // Add effect to detect dark mode changes
  useEffect(() => {
    // Check dark mode immediately
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };

    // Run on mount
    checkDarkMode();

    // Set up observer for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          checkDarkMode();
        }
      });
    });

    // Start observing
    observer.observe(document.documentElement, { attributes: true });

    // Clean up
    return () => observer.disconnect();
  }, []);

  // Process content when dark mode changes or content changes
  useEffect(() => {
    if (!post?.content) return;

    // Process the HTML content with current dark mode state
    const htmlWithProcessedColors = processHtmlContent(
      post.content,
      isDarkMode
    );
    setProcessedContent(htmlWithProcessedColors);
  }, [post?.content, isDarkMode]);

  // Modified to accept isDarkMode as a parameter
  const processHtmlContent = (htmlContent: string, isDark: boolean): string => {
    // First, check if this is a CSV file by looking for typical patterns
    if (htmlContent.includes('<div class="ql-code-block-container"') && 
    (htmlContent.match(/,/g) || []).length > 20 && 
    // Count the number of code blocks - if there are many, it's probably a CSV
    (htmlContent.match(/<div class="ql-code-block"/g) || []).length > 15 &&
    // Check if content has typical CSV patterns (many commas per line)
    htmlContent.includes(',') && 
    !htmlContent.includes('<h1') && 
    !htmlContent.includes('<h2') && 
    !htmlContent.includes('<h3')) {
  
  // Fast path for CSVs - minimal processing, just basic styling
  return `<div class="csv-content" style="overflow-x:auto;max-width:100%;">
            ${htmlContent}
          </div>`;
}




    let processedContent = htmlContent;






    htmlContent = htmlContent.replace(
      /(?<!<p[^>]*>)(<br\s*\/?>\s*){2,}(?![^<]*<\/p>)/g,
      '<div class="double-break"></div>'
    );



    // Add this function inside processHtmlContent
    const processImageTag = (match) => {
      // Extract src and other attributes
      const srcMatch = match.match(/src=["']([^"']*)["']/i);
      const src = srcMatch ? srcMatch[1] : "";
      const classMatch = match.match(/class=["']([^"']*)["']/i);
      const classAttr = classMatch ? ` class="${classMatch[1]}"` : "";
      const altMatch = match.match(/alt=["']([^"']*)["']/i);
      const alt = altMatch ? ` alt="${altMatch[1]}"` : "";

      // Preserve other attributes but override style
      let otherAttrs = match
        .replace(/src=["'][^"']*["']/i, "")
        .replace(/style=["'][^"']*["']/i, "")
        .replace(/class=["'][^"']*["']/i, "")
        .replace(/alt=["'][^"']*["']/i, "")
        .replace(/<img\s/i, "")
        .replace(/>$/, "");

      // Create new image tag with responsive styling
      return `<img src="${src}"${classAttr}${alt} style="max-width:100%;height:auto;object-fit:contain;" loading="lazy" ${otherAttrs}>`;
    };

    // Replace all image tags using the function
    processedContent = processedContent.replace(
      /<img[^>]*>/gi,
      processImageTag
    );
// Replace this line in your processHtmlContent function:
processedContent = processedContent.replace(
  /<div class="ql-code-block"[^>]*>([\s\S]*?)<\/div>/gi,
  '<div style="font-family:monospace;font-size:0.875rem;line-height:1.5;color:#e5e7eb;white-space:pre-wrap;display:block;padding:0;margin:0;">$1</div>'
);

    // Process code blocks directly in the HTML
processedContent = processedContent.replace(
  /<div class="ql-code-block-container"[^>]*>([\s\S]*?)<\/div>/gi,
  '<div style="background-color:#1e293b;border-radius:0.5rem;margin:1.5rem 0;padding:1rem;overflow-x:auto;display:block;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06);">$1</div>'
);

// Then process individual code block lines
processedContent = processedContent.replace(
  /<div class="ql-code-block"[^>]*>([\s\S]*?)<\/div>/gi,
  '<div style="font-family:monospace;font-size:0.875rem;line-height:1.5;color:#e5e7eb;white-space:pre;display:block;padding:0;margin:0;">$1</div>'
);

// For dark mode, adjust styles dynamically
if (isDark) {
  processedContent = processedContent.replace(
    /<div style="background-color:#1e293b;/gi,
    '<div style="background-color:#0f172a;'
  );
}

    // Update both YouTube regex replacements to include these parameters:
    processedContent = processedContent.replace(
      /<iframe(.*?)src="https:\/\/www\.youtube\.com\/embed\/(.*?)"(.*?)><\/iframe>/g,
      '<div class="video-container" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%"><iframe$1src="https://www.youtube.com/embed/$2?enablejsapi=1&playsinline=1&rel=0"$3 style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>'
    );

    // And update the backup regex too:
    processedContent = processedContent.replace(
      /<iframe(?:.*?)src="(?:(?:https?:)?\/\/)?(?:www\.)?youtube\.com\/embed\/([^"]+)"(?:.*?)><\/iframe>/gi,
      '<div class="video-container" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%"><iframe src="https://www.youtube.com/embed/$1?enablejsapi=1&playsinline=1&rel=0" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>'
    );
    // 2. Fix aspect ratio for images by adding specific styles
    processedContent = processedContent.replace(
      /<img(.*?)style="([^"]*?)(width|height):[^"]*?(width|height):[^"]*?"(.*?)>/gi,
      '<img$1style="max-width:100%;height:auto;object-fit:contain;"$5 loading="lazy">'
    );

    // Handle images with style but no width/height
    processedContent = processedContent.replace(
      /<img(.*?)style="(?!.*?(width|height))[^"]*?"(.*?)>/gi,
      '<img$1style="max-width:100%;height:auto;object-fit:contain;"$3 loading="lazy">'
    );

    // Handle images with no style
    processedContent = processedContent.replace(
      /<img(?![^>]*?style=)(.*?)>/gi,
      '<img style="max-width:100%;height:auto;object-fit:contain;"$1 loading="lazy">'
    );
    // First process font sizes (keep this part)
    processedContent = processedContent.replace(
      /style="([^"]*)font-size:\s*(\d+)px([^"]*)"/g,
      (match, before, size, after) => {
        let scaledValue = parseInt(size, 10);
        scaledValue = Math.round(scaledValue * 1.7);
        return `style="${before}font-size: ${scaledValue}px${after}"`;
      }
    );

    // FONT TAG COLOR TRANSFORMATION - Only if in dark mode
    if (isDark) {
      processedContent = processedContent.replace(
        /<font\s+color="(#[0-9a-f]{3,6})"([^>]*)>/gi,
        (match, color, rest) => {
          // Parse the hex color
          const r = parseInt(color.slice(1, 3) || color.slice(1, 2), 16);
          const g = parseInt(color.slice(3, 5) || color.slice(2, 3), 16);
          const b = parseInt(color.slice(5, 7) || color.slice(3, 4), 16);

          // Special case for black or very dark colors
          if (
            (r < 30 && g < 30 && b < 30) ||
            color.toLowerCase() === "#000000" ||
            color.toLowerCase() === "#000"
          ) {
            // Use light gray instead of trying to brighten black
            return `<font color="#CCCCCC"${rest}>`;
          }

          // Rest of your existing code for other colors
          let brightR, brightG, brightB;
          const isReddish = r > 180 && g < 100;
          const isYellowish = r > 180 && g > 180;

          if (isReddish) {
            // Less intense adjustment for red
            brightR = Math.min(255, Math.round(r * 1.2));
            brightG = Math.min(255, Math.round(g * 1.8));
            brightB = Math.min(255, Math.round(b * 2.2));
          } else if (isYellowish) {
            // Modest adjustment for yellow to prevent washing out
            brightR = Math.min(255, Math.round(r * 1.1));
            brightG = Math.min(255, Math.round(g * 1.1));
            brightB = Math.min(255, Math.round(b * 2.5));
          } else {
            // Default adjustment for other colors
            brightR = Math.min(255, Math.round(r * 2.2));
            brightG = Math.min(255, Math.round(g * 2.2));
            brightB = Math.min(255, Math.round(b * 2.5));
          }

          // Create new hex color
          const newColor = `#${brightR.toString(16).padStart(2, "0")}${brightG
            .toString(16)
            .padStart(2, "0")}${brightB.toString(16).padStart(2, "0")}`;

          return `<font color="${newColor}"${rest}>`;
        }
      );
    }

    return processedContent;
  };

  // Process HTML content for headings
  const renderHtml = () => {
    if (!processedContent) return { __html: "" };
    
    // Detect if content is likely a CSV
    const isCsvContent = processedContent.includes('<div class="csv-content"');
    
    if (isCsvContent) {
      // Return the CSV wrapper but don't process further
      return { __html: processedContent };
    }

    let finalContent = processedContent;
    // Clean up leading headings
    finalContent = finalContent.replace(
      /^(?:\s*<h[1-6][^>]*>\s*(?:<[^>]+>\s*)*<\/h[1-6]>|\s*<br\s*\/?>)+/i,
      ""
    );
    finalContent = finalContent.replace(/^\s+/, "");

    // Add IDs to headings for TOC
    finalContent = finalContent.replace(
      /<h([2-3])(?:\s[^>]*)?>(.*?)<\/h\1>/g,
      (match, level, content) => {
        const plainText = content.replace(/<[^>]*>/g, "");
        const id = plainText.toLowerCase().replace(/[^\w]+/g, "-");
        return `<h${level} id="${id}">${content}</h${level}>`;
      }
    );
    return { __html: finalContent };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-orange-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-bold mb-6">Post Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Sorry, the blog post you're looking for doesn't exist or has been
          removed.
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const readingTime = Math.max(
    1,
    Math.ceil(post.content.split(/\s+/).length / 200)
  );

  return (
    <article className="bg-white dark:bg-slate-900 relative">
      {/* Reading progress bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-yellow-400 dark:bg-yellow-600 z-50 transition-all duration-100"
        style={{ width: `${readingProgress}%` }}
      />

      <div className="container mx-auto px-4 py-10">
       {/* Header Section */}
<div className="max-w-3xl mx-auto mb-10 px-0 md:px-10 lg:px-9">
  <motion.h1
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7 }}
      className="text-gray-900 dark:text-white mb-6 leading-tight font-bold font-sans text-[1.5em] md:text-[2em] lg:text-[2em]"
      // Add responsive fontSize using media queries
      
  >
    {post.title}
  </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center gap-4 text-gray-600 dark:text-gray-400 mb-4"
          >
            <span className="flex items-center">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {formatDate(post.date)}
            </span>
            <span className="flex items-center">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {readingTime} min read
            </span>
            {post.categories &&
              Array.isArray(post.categories) &&
              post.categories.length > 0 &&
              post.categories.map((category, idx) => (
                <motion.span
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + idx * 0.1 }}
                  className="px-3 py-1 text-xs font-medium bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 rounded-full"
                >
                  {category}
                </motion.span>
              ))}
          </motion.div>
        </div>

        {/*
    
        {tableOfContents.length > 1 && (
          <div className="max-w-3xl mx-auto mb-10 p-4 border border-gray-100 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800/50">
            <h2 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">Contents</h2>
            <nav className="space-y-1">
              {tableOfContents.map((heading, i) => (
                <a
                  key={i}
                  href={`#${heading.id}`}
                  className={`
                    block hover:text-orange-600 dark:hover:text-orange-400 transition-colors py-1
                    ${heading.level === "3" ? "pl-4 text-sm" : "font-medium"}
                    text-gray-700 dark:text-gray-300
                  `}
                >
                  {heading.text}
                </a>
              ))}
            </nav>
          </div>
        )}

*/}

       {/* Main blog post content in a centered column */}
<div className="max-w-3xl mx-auto">
  {processedContent.includes('<div class="csv-content"') ? (
    <Suspense fallback={
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin w-10 h-10 border-4 border-orange-500 rounded-full border-t-transparent"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading CSV data...</span>
      </div>
    }>
      <VirtualizedCsvViewer htmlContent={processedContent} />
    </Suspense>
  ) : (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className={`
        prose prose-base md:prose-lg dark:prose-invert 
        ${fontStyle === "sans-serif" ? "font-sans" : "font-serif"}
        px-0 md:px-10 lg:px-9
              
        [&>ul>li::marker]:text-slate-800 dark:[&>ul>li::marker]:text-gray-200
        [&>ol>li::marker]:text-slate-800 dark:[&>ol>li::marker]:text-gray-200
        prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:my-3
        prose-headings:font-sans prose-headings:font-bold prose-headings:tracking-tight prose-headings:scroll-mt-24
        prose-h2:text-xl md:prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6
        prose-h3:text-lg md:prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
        prose-headings:text-gray-900 dark:prose-headings:text-white
        prose-a:text-orange-700 dark:prose-a:text-orange-400 prose-a:font-medium prose-a:no-underline hover:prose-a:underline
        prose-a:transition-colors prose-a:duration-200
        prose-img:rounded-none prose-img:shadow-md prose-img:mx-auto prose-img:my-8             
        prose-hr:my-12 prose-hr:border-gray-200 dark:prose-hr:border-gray-800
        prose-ol:pl-6 prose-ul:pl-6 prose-li:my-3 prose-li:text-gray-800 dark:prose-li:text-gray-200
        prose-ol:text-gray-800 dark:prose-ol:text-gray-200 prose-ul:text-gray-800 dark:prose-ul:text-gray-200
        prose-code:font-normal prose-code:text-orange-700 dark:prose-code:text-orange-400
        prose-code:bg-orange-50 dark:prose-code:bg-orange-900/20 prose-code:px-1.5 prose-code:py-0.5
        prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 prose-pre:p-4 prose-pre:rounded-lg
        prose-pre:shadow-md prose-pre:overflow-x-auto prose-pre:text-sm prose-pre:my-8
        prose-blockquote:border-l-4 prose-blockquote:border-orange-500
        prose-blockquote:bg-orange-50/30 dark:prose-blockquote:bg-orange-900/10
        prose-blockquote:px-6 prose-blockquote:py-3 prose-blockquote:my-8
        prose-blockquote:rounded-r-lg prose-blockquote:italic prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300
        prose-strong:font-semibold prose-strong:text-gray-900 dark:prose-strong:text-white
        prose-table:rounded-lg prose-table:overflow-hidden prose-table:shadow-sm
        prose-th:bg-gray-100 dark:prose-th:bg-gray-800 prose-th:p-3
        prose-td:p-3 prose-td:border-t prose-td:border-gray-200 dark:prose-td:border-gray-700 max-w-none
        prose-h4:text-base md:prose-h4:text-lg
        [&_h1_span[style*="font-size"]]:font-bold
        [&_h2_span[style*="font-size"]]:font-bold
        [&_h3_span[style*="font-size"]]:font-bold
        [&_span[style*="font-size"]]:!leading-normal
      `}
      dangerouslySetInnerHTML={renderHtml()}
    />
  )}


          

          {/* Navigation and share section - combined row */}
          <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              {/* Back to Blog - Left side */}
              <Link href="/" className="group mb-6 sm:mb-0">
                <span className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16l-4-4m0 0l4-4m-4 4h18"
                    />
                  </svg>
                  Back to Blog
                </span>
                <span className="text-lg font-medium group-hover:underline">
                  View all articles
                </span>
              </Link>

              {/* Social media buttons - Right side */}
              {post.socmed && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  <div className="flex flex-wrap justify-center sm:justify-end gap-2">
                    {/* Copy Link Button */}
                    <button
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(window.location.href);
                        }
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-sm">Copy Link</span>
                    </button>

                    {/* Twitter Share Button */}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        const postURL =
                          typeof window !== "undefined"
                            ? window.location.href
                            : "";
                        const shareText = `${post.title} ${postURL}`;
                        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                          shareText
                        )}`;
                        openSharePopup(twitterUrl, "Share on Twitter");
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#1DA1F2]/10 text-[#1DA1F2] rounded-lg hover:bg-[#1DA1F2]/20 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                      </svg>
                      <span className="text-sm">Twitter</span>
                    </a>

                    {/* Facebok Share Button */}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        const postURL =
                          typeof window !== "undefined"
                            ? window.location.href
                            : "";
                        const shareText = `${post.title} ${postURL}`;
                        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                          postURL
                        )}`;
                        openSharePopup(fbUrl, "Share on Facebook");
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#1DA1F2]/10 text-[#1DA1F2] rounded-lg hover:bg-[#1DA1F2]/20 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                      </svg>
                      <span className="text-sm">Facebook</span>
                    </a>

                    {/* LinkedIn Share Button */}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        const postURL =
                          typeof window !== "undefined"
                            ? window.location.href
                            : "";
                        const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                          postURL
                        )}&title=${encodeURIComponent(post.title)}`;
                        openSharePopup(linkedInUrl, "Share on LinkedIn");
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#0077B5]/10 text-[#0077B5] rounded-lg hover:bg-[#0077B5]/20 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
                      </svg>
                      <span className="text-sm">LinkedIn</span>
                    </a>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Utterances comment section */}

          {post.comment && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="-mt-6"
            >
              {/* Modified styling to hide only the border */}
              <style jsx global>{`



              /* Add to your style jsx global block */

                /* Make bullet lists display correctly */
                .prose ol li[data-list="bullet"] {
                  list-style-type: disc !important;
                }

                .prose ol li[data-list="bullet"]::marker {
                  font-size: 0.75em;
                  content: "•" !important;
                  color: var(--tw-prose-bullets);
                }

                /* Ensure ordered lists display correctly */
                .prose ol li[data-list="ordered"] {
                  list-style-type: decimal !important;
                }

                /* Handle nesting properly */
                .prose ol li[data-list="bullet"] ol li[data-list="bullet"] {
                  list-style-type: circle !important;
                }

                /* Make bullet markers more visible with dark slate in light mode and light gray in dark mode */
                .prose ol li[data-list="bullet"]::marker {
                  font-size: 1.2em !important;
                  content: "•" !important;
                  color: #1e293b !important; /* Dark slate for light mode */
                }

                /* Dark mode bullet visibility */
                .dark .prose ol li[data-list="bullet"]::marker {
                  color: #e5e7eb !important; /* Light gray for dark mode */
                  opacity: 1;
                }

                /* Also update the default bullets for traditional ul elements */
                .prose ul li::marker {
                  font-size: 1.2em !important;
                  color: #1e293b !important;
                }

                .dark .prose ul li::marker {
                  color: #e5e7eb !important;
                  opacity: 1;
                }

                /* Make nested bullets different but same color scheme */
                .prose
                  ol
                  li[data-list="bullet"]
                  ol
                  li[data-list="bullet"]::marker {
                  content: "◦" !important;
                  font-size: 1.4em !important;
                }


                /* Add this to your existing <style jsx global> block */
                .prose ul, 
                .prose ol {
                  padding-left: 1.5em !important; /* Override Tailwind's default */
                  margin-top: 0.5em !important;
                  margin-bottom: 0.5em !important;
                }

                /* Also handle the special case for Quill-generated lists */
                .prose ol[data-list="bullet"],
                .prose ol[data-list="ordered"] {
                  padding-left: 1.5em !important;
                  margin-top: 0.5em !important;
                  margin-bottom: 0.5em !important;
                }

                /* Make sure nested lists maintain spacing too */
                .prose li > ul,
                .prose li > ol {
                  margin-top: 0.25em !important;
                  margin-bottom: 0.25em !important;
                }


                /* And also target the special Quill format */
                .prose ol li[data-list="bullet"],
                .prose ol li[data-list="ordered"] {
                  margin-top: 0em !important;
                  margin-bottom: 0em !important;
                }


                .prose
                  ol
                  li[data-list="bullet"]
                  ol
                  li[data-list="bullet"]::marker {
                  content: "◦" !important;
                }
                /* Target the exact element you found in the console */
                h3.text-xl.font-bold.mb-6.flex.items-center {
                  display: none !important;
                }

                /* Remove only the border from the container */
                .utterances-container.mt-16.pt-8.border-t {
                  border-top: none !important;
                }

                /* Alternative selector to remove border */
                [class*="utterances-container"][class*="border-t"] {
                  border-top: none !important;
                }

                /* Also keep the previous selectors for good measure */
                .utterances-frame {
                  margin-top: 0 !important;
                }
                .utterances-header, 
                .utterances h3, 
                .utterances h4,
                 /* Add more general selectors to catch other possible variants */
                 .utterances-container h3,
                /* For embedded iframes */
                iframe[src*="utteranc"] + h3,
               iframe[src*="utteranc"].utterances-frame + h3 {
                  display: none !important;
                }

                /* Keep standard paragraph spacing */
                .prose p {
                  margin-top: 1em;
                  margin-bottom: 1em;
                }

                /* Give extra spacing to our converted double breaks */
                .prose .double-break {
                  margin-top: 1.5em;
                  margin-bottom: 1.5em;
                }
              `}</style>



              

              {/* Separate style block for font size and color handling hardware acc. for img and vid on mobile */}

              <style jsx global>{`
                /* Base dark mode color handling */
                .dark .prose [data-dynamic-color="true"] {
                  filter: brightness(2.5) contrast(0.85) !important;
                  color: var(--color-text-dark, inherit) !important;
                }

                /* Specific overrides for very dark colors - style attribute */
                .dark .prose [data-dynamic-color="true"][style*="color: #000"],
                .dark
                  .prose
                  [data-dynamic-color="true"][style*="color: rgb(0,0,0)"],
                .dark
                  .prose
                  [data-dynamic-color="true"][style*="color: black"] {
                  filter: brightness(4) contrast(0.9) !important;
                  color: #e0e0e0 !important;
                }

                /* Specific overrides for very dark colors - font tag */
                .dark .prose [data-dynamic-color="true"][color="#000"],
                .dark .prose [data-dynamic-color="true"][color="black"],
                .dark .prose [data-dynamic-color="true"][color^="#00"],
                .dark .prose [data-dynamic-color="true"][color^="#01"],
                .dark .prose [data-dynamic-color="true"][color^="#02"],
                .dark .prose [data-dynamic-color="true"][color^="#03"] {
                  filter: brightness(4) contrast(0.9) !important;
                  color: #e0e0e0 !important;
                }

                .prose img {
                  transform: translateZ(0);
                  backface-visibility: hidden;
                  will-change: transform;
                }

                /* For video containers too */
                .video-container {
                  transform: translateZ(0);
                  backface-visibility: hidden;
                }
              `}</style>

              {/* Add responsive container styles */}
              <style jsx global>{`
                /* Responsive video container */
                .video-container {
                  position: relative;
                  padding-bottom: 56.25%; /* 16:9 aspect ratio */
                  height: 0;
                  overflow: hidden;
                  max-width: 100%;
                  margin: 2rem 0;
                }

                .video-container iframe {
                  position: absolute;
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 100%;
                  border: 0;
                }

                /* Ensure all images maintain aspect ratio */
                .prose img {
                  max-width: 100%;
                  height: auto;
                  object-fit: contain;
                }

                /* Add margin to images for better spacing */
                .prose img:not(.video-container img) {
                  margin: 2rem auto;
                }
              `}</style>

              <Utterances
                repo="serdarsalim/blog-comments"
                issueTerm="pathname"
                label="blog-comment"
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* Back to top floating button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: readingProgress > 20 ? 1 : 0 }}
        className="fixed bottom-20 right-6 p-3 rounded-full bg-orange-600 text-white shadow-lg z-30"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </motion.button>
    </article>
  );
}
