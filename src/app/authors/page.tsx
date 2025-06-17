import Image from 'next/image';
import Link from 'next/link';
import { getAllAuthors } from '@/lib/author-data';
import WebsiteLink from '../components/WebsiteLink';

export default async function AuthorsPage() {
  // Use the same function that works on the homepage
  const authors = await getAllAuthors();
  
  return (
    <div className="min-h-screen  dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-12 text-center">Browse Topics</h1>
        
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {authors.map(author => (
            <div key={author.id} className="block h-full relative">
              <Link href={`/${author.handle}`} className="absolute inset-0 z-10" aria-label={`Visit ${author.name}'s profile`}>
                <span className="sr-only">View {author.name}'s profile</span>
              </Link>
              
              <div className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full" 
                style={{ 
                  minHeight: "230px", 
                  width: "100%",
                  backgroundColor: "var(--card-bg-color)"
                }}>
                <div className="p-6 h-full flex flex-col">
                  {/* Author avatar and name */}
                  <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex-shrink-0 relative border-0">
                    {author.avatar_url ? (
                      <Image 
                        src={author.avatar_url} 
                        alt={author.name} 
                        fill
                        sizes="64px"
                        className="object-cover rounded-full"
                        style={{ margin: 0, border: 'none' }}
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
                        {author.name} is a HALQA author.
                      </p>
                    )}
                  </div>
                  
                 
                </div>
              </div>
            </div>
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