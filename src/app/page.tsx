// src/app/page.tsx
import { getAllAuthors, getLatestPostsAcrossAuthors } from '@/lib/author-data';
import Link from 'next/link';
import Image from 'next/image';

export default async function LandingPage() {
  // Get just featured authors and a few recent posts across all authors
  const authors = await getAllAuthors();
  
  const latestPosts = await getLatestPostsAcrossAuthors(3); // Just 3 recent posts
  
  return (
    <div className="min-h-screen">
   {/* Hero Section */}
<section className="py-16 bg-gradient-to-b from-orange-50/50 to-white dark:from-slate-900 dark:to-slate-900">
  <div className="max-w-6xl mx-auto px-4 text-center">
    <h1 className="text-4xl md:text-5xl font-bold mb-6">
      Write On Sheets, Publish Anywhere
    </h1>
    <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
      The world's first spreadsheet-powered publishing platform. Simple, powerful, and innovative.
    </p>
    <div className="flex justify-center">
      <Link 
        href="/join"
        className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
      >
        Become an Author
      </Link>
    </div>
  </div>
</section>
      
      {/* Featured Authors Section */}
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Our Authors</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {authors.slice(0, 3).map(author => (
              <Link href={`/${author.handle}`} key={author.id}>
                <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-lg transition-shadow">
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      {author.avatar_url ? (
                        <Image 
                          src={author.avatar_url} 
                          alt={author.name} 
                          width={64} 
                          height={64} 
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl text-gray-500 dark:text-gray-400">
                          {author.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold">{author.name}</h3>
                      <p className="text-gray-500 dark:text-gray-400">@{author.handle}</p>
                    </div>
                  </div>
                  {author.bio && (
                    <p className="text-gray-600 dark:text-gray-300 line-clamp-3">{author.bio}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
          {authors.length > 3 && (
            <div className="text-center mt-12">
              <Link 
                href="/authors"
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
              >
                View All Authors
              </Link>
            </div>
          )}
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-16 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
              <div className="text-3xl font-bold text-orange-500 mb-4">1</div>
              <h3 className="text-xl font-bold mb-3">Write in Google Sheets</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Create your content in a familiar spreadsheet interface, with all the tools you already know.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
              <div className="text-3xl font-bold text-orange-500 mb-4">2</div>
              <h3 className="text-xl font-bold mb-3">Sync with One Click</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our integration seamlessly publishes your content to your personal blog with a single click.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
              <div className="text-3xl font-bold text-orange-500 mb-4">3</div>
              <h3 className="text-xl font-bold mb-3">Share with the World</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your content is instantly published on your custom blog with your own unique style and branding.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Recent Posts Section - Just a small sample */}
      {latestPosts.length > 0 && (
        <section className="py-16 bg-white dark:bg-slate-800">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">Recent Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {latestPosts.map(post => (
                <Link href={`/${post.author_handle}/blog/${post.slug}`} key={post.id}>
                  <div className="bg-gray-50 dark:bg-slate-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {post.featuredImage && (
                      <div className="h-40 relative">
                        <Image
                          src={post.featuredImage}
                          alt={post.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2 line-clamp-2">{post.title}</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        By {post.author || post.authors?.name || 'Anonymous'} · 
                        {new Date(post.date).toLocaleDateString()}
                      </p>
                      {post.excerpt && (
                        <p className="text-gray-600 dark:text-gray-300 line-clamp-3">{post.excerpt}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}