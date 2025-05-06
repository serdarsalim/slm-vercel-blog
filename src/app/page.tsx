import Link from 'next/link';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { getAllAuthors } from '@/lib/author-data';
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



export default async function Page() {
  // Server-side data fetching
  const authors = await getAllAuthors();
  
  return (
    <div className="min-h-screen terminal-bg text-slate-300 relative">
      <CustomStyles />
      <ScanLines />
      
      {/* Geometric pattern overlay */}
      <div className="geometric-overlay absolute inset-0 opacity-10" style={{ zIndex: 0 }}></div>
      
      {/* Hero Section */}
      <section className="pt-16 pb-4 relative bg-gray-50 dark:bg-transparent" style={{ zIndex: 2 }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl pb-2 font-bold mb-6 leading-relaxed text-gray-900 dark:text-slate-100 font-mono tracking-tight">
              HALQA
            </h1>
            
            <p className="font-mono text-lg md:text-xl tracking-tight text-gray-600 dark:text-slate-400 mb-10">
            STORIES WORTH YOUR TIME
            </p>
          </div>
        </div>
      </section>
      
      {/* Author Carousel Section - USING YOUR EXISTING COMPONENT */}
      <section className="py-16 bg-white dark:bg-slate-950/50 relative backdrop-blur-sm" style={{ zIndex: 2 }}>
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-3 text-center font-mono tracking-tight text-gray-900 dark:text-slate-100">
          </h2>
          <p className="text-lg text-gray-600 dark:text-slate-400 max-w-3xl mx-auto text-center mb-10 font-mono">
           DISCOVER STORIES
          </p>
          
          {authors.length > 0 ? (
            <div className="min-h-[400px]">
              <AuthorCarousel authors={authors} />
            </div>
          ) : (
            <div className="min-h-[400px] flex flex-col items-center justify-center pb-8 text-gray-600 dark:text-slate-400 font-mono">
              <div className="text-5xl mb-4">⚠</div>
              <p className="text-sm text-orange-600 dark:text-orange-400 mb-2 font-mono">
                NO ACTIVE PROFILES DETECTED
              </p>
              <p className="text-sm">Profiles will appear here when initialized.</p>
            </div>
          )}
          
          {/* Button to authors page */}
          <div className="text-center -mt-5">
            <Link 
              href="/authors"
              className="inline-flex items-center text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-mono border border-emerald-200 dark:border-emerald-800/50 hover:border-emerald-300 dark:hover:border-emerald-600 px-4 py-2 bg-white/80 dark:bg-slate-900/50 rounded"
            >
              <span className="mr-2">&gt;</span>
              <span>BROWSE ALL PROFILES</span>
              <svg className="w-4 h-4 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
      
    {/* Value Proposition Section - With dark mode support */}
<section className="py-16 bg-gray-50 dark:bg-slate-900 relative" style={{ zIndex: 2 }}>
  <div className="max-w-6xl mx-auto px-4 mb-5">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
      {/* SEEK - Magnifying Glass Icon */}
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 mb-6">
          <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-3 font-mono text-gray-900 dark:text-slate-100">SEEK</h3>
        <p className="text-gray-600 dark:text-slate-400 font-mono text-sm">
        We identify meaningful problems worth solving—from personal challenges to systemic issues. Through storytelling, we explore what's working, what's broken, and what needs fixing in our world.
        </p>
      </div>
      
      {/* BUILD - Construction/Tools Icon */}
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 mb-6">
          <svg className="w-8 h-8 text-cyan-600 dark:text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-3 font-mono text-gray-900 dark:text-slate-100">BUILD</h3>
        <p className="text-gray-600 dark:text-slate-400 font-mono text-sm">
        We design thoughtful solutions that address root causes rather than symptoms. Our stories examine both existing systems and alternative approaches that might better serve humanity. 


        </p>
      </div>
      
      {/* IMPLEMENT - Rocket Launch Icon */}
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 mb-6">
          <svg className="w-8 h-8 text-blue-600 dark:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-3 font-mono text-gray-900 dark:text-slate-100">IMPLEMENT</h3>
        <p className="text-gray-600 dark:text-slate-400 font-mono text-sm">
        We explore how solutions can be applied responsibly in the real world. While perfect systems rarely exist, we can implement changes that maximize benefits while minimizing unintended harm.


        </p>
      </div>
    </div>
  </div>
</section>
    </div>
  );
}