import { notFound } from 'next/navigation';
import { Author, BlogPost } from '@/app/types/blogpost';
import { getAuthorByHandle, getAuthorPosts, getAuthorFeaturedPosts } from '@/lib/author-data';
import AuthorProfileHeader from './components/AuthorProfileHeader';
import AuthorBlogContent from './components/AuthorBlogContent';
import { AuthorProvider } from './AuthorContext';

export default async function AuthorPage({ params }: { params: { handle: string } }) {
  try {
    const authorData = await getAuthorByHandle(params.handle);
    
    if (!authorData) {
      notFound();
    }
    
    const author = authorData as Author;
    
    // Fetch posts with timeout and fallback
    const [posts, featuredPosts] = await Promise.allSettled([
      getAuthorPosts(params.handle),
      getAuthorFeaturedPosts(params.handle)
    ]);
    
    const safePosts = posts.status === 'fulfilled' ? posts.value as BlogPost[] : [];
    const safeFeaturedPosts = featuredPosts.status === 'fulfilled' ? featuredPosts.value as BlogPost[] : [];
    
    console.log(`Author: ${author.name}, Posts: ${safePosts.length}, Featured: ${safeFeaturedPosts.length}`);

    // Define default preferences if needed
    const defaultPreferences = {
      font_style: 'sans-serif',   // Only required property
    };

  return (
 

    <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
      {/* Change initialAuthor to author and add required preferences */}
      <AuthorProvider author={author} preferences={defaultPreferences}>
        <AuthorProfileHeader />
        
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 shadow-sm">
          <AuthorBlogContent 
            initialPosts={safePosts} 
            initialFeaturedPosts={safeFeaturedPosts} 
          />
        </div>
      </AuthorProvider>
    </div>
  );
  } catch (error) {
    console.error('Error loading author page:', error);
    notFound();
  }
}