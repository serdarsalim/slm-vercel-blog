import type { BlogPost } from '@/app/types/blogpost';

// Cache keys for different content types
const CACHE_KEYS = {
  BLOG_POSTS: 'blog_posts'
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Generic cache item structure
interface CacheItem<T> {
  data: T[];
  timestamp: number;
}

const isClient = typeof window !== 'undefined';

// Generic cache factory function
function createCache<T>(cacheKey: string) {
  return {
    set: (data: T[]): void => {
      if (!isClient || !Array.isArray(data)) return;
      
      try {
        const cacheItem: CacheItem<T> = {
          data,
          timestamp: Date.now()
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
      } catch (error) {
        console.error(`Failed to cache ${cacheKey}:`, error);
        // Attempt to clear cache if setting fails
        try {
          localStorage.removeItem(cacheKey);
        } catch (e) {
          // Silent fail - nothing more we can do
        }
      }
    },

    get: (): T[] | null => {
      if (!isClient) return null;

      try {
        const cached = localStorage.getItem(cacheKey);
        if (!cached) return null;

        const parsed = JSON.parse(cached);
        
        // Validate structure of cached data
        if (!parsed || 
            typeof parsed !== 'object' || 
            !Array.isArray(parsed.data) || 
            typeof parsed.timestamp !== 'number') {
          localStorage.removeItem(cacheKey);
          return null;
        }

        const { data, timestamp } = parsed as CacheItem<T>;
        
        // Check if cache is expired
        if (Date.now() - timestamp > CACHE_DURATION) {
          localStorage.removeItem(cacheKey);
          return null;
        }

        return data;
      } catch (error) {
        console.error(`Failed to retrieve cached ${cacheKey}:`, error);
        // Attempt to clear corrupt cache
        try {
          localStorage.removeItem(cacheKey);
        } catch (e) {
          // Silent fail
        }
        return null;
      }
    },

    clear: (): void => {
      if (!isClient) return;
      try {
        localStorage.removeItem(cacheKey);
      } catch (error) {
        console.error(`Failed to clear ${cacheKey} cache:`, error);
      }
    }
  };
}

// Create specialized cache instances
export const blogPostCache = createCache<BlogPost>(CACHE_KEYS.BLOG_POSTS);