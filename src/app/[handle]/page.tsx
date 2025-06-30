import { notFound } from 'next/navigation';
import { Author, BlogPost } from '@/app/types/blogpost';
import { getAuthorByHandle, getAuthorPosts, getAuthorFeaturedPosts } from '@/lib/author-data';
import AuthorProfileHeader from './components/AuthorProfileHeader';
import AuthorBlogContent from './components/AuthorBlogContent';
import { AuthorProvider } from './AuthorContext';

export default async function AuthorPage({ params }: { params: { handle: string } }) {
  const authorData = await getAuthorByHandle(params.handle);
  
  if (!authorData) {
    notFound();
  }
  
  const author = authorData as Author;
  const posts = (await getAuthorPosts(params.handle)) as BlogPost[];
  const featuredPosts = (await getAuthorFeaturedPosts(params.handle)) as BlogPost[];
  // Add your debug logs here

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
            initialPosts={posts} 
            initialFeaturedPosts={featuredPosts} 
          />
        </div>
      </AuthorProvider>
    </div>
  );
}