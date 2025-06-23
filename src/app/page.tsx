import Link from 'next/link';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { getAuthorsWithRecentPosts } from '@/lib/author-data';
import CustomStyles from './components/CustomStyles';

// Import your EXISTING AuthorCarousel component with dynamic import
const AuthorCarousel = dynamic(() => import('./components/AuthorCarousel'), {
  ssr: false,
  loading: () => <div className="min-h-[400px] flex items-center justify-center">Loading authors...</div>
});

// Static components
const ScanLines = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10" style={{ zIndex: 1 }}>
    <div className="w-full h-full absolute">
      {Array.from({ length: 50 }).map((_, i) => (
        <div 
          key={i} 
          className="h-px bg-cyan-400 w-full absolute opacity-30"
          style={{ top: `${i * 20}px` }}
        />
      ))}
    </div>
  </div>
);

// Helper function to get recent articles from all authors
async function getRecentArticles() {
  const authors = await getAuthorsWithRecentPosts();
  const allArticles = [];
  
  for (const author of authors) {
    // Get the 2 most recent articles for each author
    const recentArticles = author.posts?.slice(0, 2) || [];
    recentArticles.forEach(article => {
      allArticles.push({
        ...article,
        authorName: author.name,
        authorHandle: author.handle
      });
    });
  }
  
  // Sort by date and return the most recent ones
  return allArticles
    .sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return dateB - dateA; // Most recent first
    })
    .slice(0, 6); // Limit to 6 total articles
}

export default async function Page() {
  // Server-side data fetching
  const authors = await getAuthorsWithRecentPosts();
  const recentArticles = await getRecentArticles();
  
  return (
    <div className="min-h-screen terminal-bg text-slate-300 relative overflow-x-hidden">
      <CustomStyles />
      <ScanLines />
      
      {/* Geometric pattern overlay */}
      <div className="geometric-overlay absolute inset-0 opacity-10" style={{ zIndex: 0 }}></div>
      
      {/* Hero Section */}
     {/* Hero Section - Enhanced with gradient */}
<section className="pt-16 pb-4 relative overflow-hidden" style={{ 
  zIndex: 2,
  background: "linear-gradient(135deg, var(--card-bg-color) 0%, var(--gradient-middle) 50%, var(--gradient-end) 100%)",
}}>
  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/30 dark:to-slate-900/30"></div>
  
  {/* Subtle animated accent - constrained positioning */}
  <div className="absolute -top-10 right-1/4 w-32 h-32 md:w-64 md:h-64 bg-blue-200/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
  <div className="absolute -bottom-20 left-1/3 w-36 h-36 md:w-72 md:h-72 bg-orange-200/20 dark:bg-orange-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

  <div className="max-w-6xl mx-auto px-4 relative">
    <div className="flex flex-col items-center text-center">
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl pb-2 font-bold mb-6 leading-relaxed text-gray-900 dark:text-slate-100 font-mono tracking-tight break-words">
        HALQA
      </h1>
      
      <p className="font-mono text-base sm:text-lg md:text-xl tracking-tight text-gray-600 dark:text-slate-400 mb-10 px-2">
        Welcome, so good to see you! 
      </p>
    </div>
  </div>
</section>
      
      {/* Author Carousel Section - USING YOUR EXISTING COMPONENT */}
      <section className="py-8 md:py-16 bg-white dark:bg-slate-950/50 relative backdrop-blur-sm overflow-hidden" style={{ zIndex: 2 }}>
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 text-center font-mono tracking-tight text-gray-900 dark:text-slate-100">
          </h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-slate-400 max-w-3xl mx-auto text-center mb-10 font-mono px-2">
           Tools, insights, and ideas that matter.
          </p>
          
          {authors.length > 0 ? (
            <div className="min-h-[300px] md:min-h-[400px] overflow-hidden">
              <AuthorCarousel authors={authors} />
            </div>
          ) : (
            <div className="min-h-[300px] md:min-h-[400px] flex flex-col items-center justify-center pb-8 text-gray-600 dark:text-slate-400 font-mono">
              <div className="text-4xl md:text-5xl mb-4">⚠</div>
              <p className="text-sm text-orange-600 dark:text-orange-400 mb-2 font-mono text-center px-4">
                NO ACTIVE PROFILES DETECTED
              </p>
              <p className="text-sm text-center px-4">Profiles will appear here when initialized.</p>
            </div>
          )}
          
          {/* Button to authors page */}
          <div className="text-center -mt-5 px-4">
            <Link 
              href="/authors"
              className="inline-flex items-center text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-mono border border-emerald-200 dark:border-emerald-800/50 hover:border-emerald-300 dark:hover:border-emerald-600 px-3 md:px-4 py-2 bg-white/80 dark:bg-slate-900/50 rounded text-sm md:text-base"
            >
              <span>Explore more</span>
              <svg className="w-4 h-4 ml-2 md:ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

       {/* Recent Articles Section */}
      <section className="py-8 md:py-16 bg-gray-50 dark:bg-slate-900/50 relative overflow-hidden" style={{ zIndex: 2 }}>
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 text-center font-mono tracking-tight text-gray-900 dark:text-slate-100">
            Recent Articles
          </h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-slate-400 max-w-3xl mx-auto text-center mb-10 font-mono px-2">
            Latest insights and stories from our community
          </p>
          
          {recentArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {recentArticles.map((article, index) => (
                <Link
                  key={`${article.authorHandle}-${article.slug}-${index}`}
                  href={`/${article.authorHandle}/${article.slug}`}
                  className="group bg-white dark:bg-slate-800/50 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-slate-700/50"
                >
                  {/* Featured Image */}
                  {article.featuredImage && (
                    <div className="aspect-video w-full overflow-hidden">
                      <img
                        src={article.featuredImage}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="p-4 md:p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded">
                        {article.authorName}
                      </span>
                      {article.date && (
                        <span className="text-xs text-gray-500 dark:text-slate-400 font-mono">
                          {new Date(article.date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg md:text-xl font-bold mb-2 text-gray-900 dark:text-slate-100 font-mono group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    
                    {article.excerpt && (
                      <p className="text-sm md:text-base text-gray-600 dark:text-slate-400 font-mono leading-relaxed line-clamp-3">
                        {article.excerpt}
                      </p>
                    )}
                    
                    {/* Read more indicator */}
                    <div className="mt-4 flex items-center text-emerald-600 dark:text-emerald-400 text-sm font-mono group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                      <span>Read more</span>
                      <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-600 dark:text-slate-400 font-mono">
              <div className="text-4xl md:text-5xl mb-4">📝</div>
              <p className="text-sm mb-2">No articles available yet</p>
              <p className="text-sm">Articles will appear here when published.</p>
            </div>
          )}
        </div>
      </section>
      

    </div>
  );
}