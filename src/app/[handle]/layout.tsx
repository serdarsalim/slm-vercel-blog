// src/app/[handle]/layout.tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { authorExists, getAuthorByHandle, getAuthorPreferences } from '@/lib/author-data';
import { AuthorProvider } from './AuthorContext';

// Enable ISR with a reasonable cache time
export const revalidate = 3600; // 1 hour

// Generate metadata for the author page
export async function generateMetadata({ params }: { params: { handle: string } }) {
  const author = await getAuthorByHandle(params.handle);
  
  if (!author) {
    return {
      title: 'Author Not Found',
      description: 'The requested author does not exist'
    };
  }
  
  return {
    title: `${author.name}`,
    description: author.bio || `Latest posts by ${author.name}`,
    openGraph: {
      title: `${author.name}`,
      description: author.bio || `Latest posts by ${author.name}`,
      url: `https://HALQA.XYZ/${author.handle}`,
      images: author.avatar_url ? [{ url: author.avatar_url }] : undefined,
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: `${author.name}`,
      description: author.bio || `Latest posts by ${author.name}`,
      images: author.avatar_url ? [author.avatar_url] : undefined
    }
  };
}

export default async function AuthorLayout({ 
  children,
  params
}: { 
  children: React.ReactNode,
  params: { handle: string }
}) {
  // Check if author exists
  const exists = await authorExists(params.handle);
  
  if (!exists) {
    notFound();
  }
  
  // Fetch author data and preferences
  const author = await getAuthorByHandle(params.handle);
  const preferences = await getAuthorPreferences(params.handle);
  
  // Apply author's theme if available
  const themeColors = preferences?.theme_colors || {};
  const fontStyle = preferences?.font_style || 'serif';
  const customCSS = preferences?.custom_css || '';
  
  return (
    <div className="author-space">
      {/* Add custom CSS if provided */}
      {customCSS && (
        <style dangerouslySetInnerHTML={{ __html: customCSS }} />
      )}
      
      {/* AuthorProvider gives client components access to author context */}
      <AuthorProvider 
        author={author} 
        preferences={preferences}
      >
        <Suspense fallback={<div></div>}>
          {children}
        </Suspense>
      </AuthorProvider>
    </div>
  );
}
