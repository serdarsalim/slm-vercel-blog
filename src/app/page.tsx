import Link from 'next/link';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import CustomStyles from './components/CustomStyles';
import { createClient } from '@supabase/supabase-js';

// Create a service role client for server-side queries
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // This bypasses RLS
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

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

// Get authors with their recent posts - only "listed" ones
async function getAuthorsWithRecentPosts() {
  const { data: authors, error } = await supabaseAdmin
    .from('authors')
    .select(`
      *,
      posts(
        id,
        slug,
        title,
        excerpt,
        date,
        featuredImage,
        created_at,
        author_handle
      )
    `)
    .eq('listing_status', 'listed')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching authors with posts:', error);
    return [];
  }

  // Sort posts by date for each author
  return (authors || []).map(author => ({
    ...author,
    posts: (author.posts || []).sort((a, b) => {
      const dateA = new Date(a.date || a.created_at).getTime();
      const dateB = new Date(b.date || b.created_at).getTime();
      return dateB - dateA;
    })
  }));
}

// Helper function to get recent articles from all listed authors
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
      const dateA = new Date(a.date || a.created_at || 0).getTime();
      const dateB = new Date(b.date || b.created_at || 0).getTime();
      return dateB - dateA; // Most recent first
    })
    .slice(0, 12); // Limit to 12 total articles
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
      
      {/* Value Proposition Section - With dark mode support */}
      <section className="py-8 md:py-16 bg-white dark:bg-slate-900 relative overflow-hidden" style={{ zIndex: 2 }}>
        <div className="max-w-6xl mx-auto px-4 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            {/* Worth Your Time - Clock Icon */}
            <div className="flex flex-col items-center text-center px-2">
              <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 mb-4 md:mb-6">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-emerald-600 dark:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 font-mono text-gray-900 dark:text-slate-100">Worth Your Time</h3>
              <p className="text-gray-600 dark:text-slate-400 font-mono text-xs md:text-sm leading-relaxed">
                Life's short. We only publish what makes you think, laugh, or learn something useful. No padding, no posturing, no wasted minutes.
              </p>
            </div>
            
            {/* Actually Helpful - Lightbulb Icon */}
            <div className="flex flex-col items-center text-center px-2">
              <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 mb-4 md:mb-6">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-cyan-600 dark:text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 font-mono text-gray-900 dark:text-slate-100">Actually Helpful</h3>
              <p className="text-gray-600 dark:text-slate-400 font-mono text-xs md:text-sm leading-relaxed">
                Tools that work. Stories that stick. Ideas you can use tomorrow. If we can't make it practical or entertaining, we don't make it.
              </p>
            </div>
            
            {/* For Everyone - Globe Icon */}
            <div className="flex flex-col items-center text-center px-2">
              <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 mb-4 md:mb-6">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-blue-600 dark:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 font-mono text-gray-900 dark:text-slate-100">For Everyone</h3>
              <p className="text-gray-600 dark:text-slate-400 font-mono text-xs md:text-sm leading-relaxed">
                No paywalls, no gatekeeping, no nonsense. Just humans making things for other humans who want to solve problems together.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}