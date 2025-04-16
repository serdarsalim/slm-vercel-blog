// src/app/authors/page.tsx
import { getAllAuthors } from '@/lib/author-data';
import Link from 'next/link';
import Image from 'next/image';

export default async function AuthorsPage() {
  const authors = await getAllAuthors();
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-12 text-center">Our Authors</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {authors.map(author => (
            <Link href={`/${author.handle}`} key={author.id} className="block h-full">
              {/* Fixed width and height card container */}
              <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full" style={{ minHeight: "230px", width: "100%" }}>
              <div className="p-6 h-full flex flex-col">
                  {/* Author avatar and name */}
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex-shrink-0">
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
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{author.name}</h3>
                      <p className="text-gray-500 dark:text-gray-400">@{author.handle}</p>
                    </div>
                  </div>
                  
                  {/* Bio section with fixed height */}
                  <div className="flex-grow mb-4">
                    {author.bio ? (
                      <p className="text-gray-600 dark:text-gray-300 line-clamp-3">{author.bio}</p>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 italic">
                        {author.name} is a WriteAway author.
                      </p>
                    )}
                  </div>
                  
                  {/* Website link at bottom */}
                  <div className="mt-auto">
                    {author.website_url ? (
                      <a 
                        href={author.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 text-sm inline-flex items-center"
                      >
                        <svg 
                          className="w-4 h-4 mr-1" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                          />
                        </svg>
                        Visit Website
                      </a>
                    ) : (
                      <span className="text-orange-500 dark:text-orange-400 text-sm inline-flex items-center">
                        View Profile →
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {authors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No authors found</p>
          </div>
        )}
      </div>
    </div>
  );
}