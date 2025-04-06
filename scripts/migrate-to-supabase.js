// /Users/slm/my-portfolio/vercel-blog/scripts/migrate-to-supabase.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
require('dotenv').config({ path: '.env.local' });

// Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function migratePostsToSupabase() {
  try {
    console.log('Starting migration to Supabase...');
    
    // Path to your exported CSV
    const csvPath = path.join(__dirname, '../data/posts.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    
    // Parse CSV
    const { data } = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true
    });
    
    console.log(`Found ${data.length} posts to migrate`);
    
    // Process posts
    const posts = data.map(item => ({
      title: item.title || 'Untitled Post',
      slug: item.slug || createSlug(item.title),
      content: item.content || '',
      excerpt: item.excerpt || '',
      date: item.date || new Date().toISOString().split('T')[0],
      categories: parseCategories(item.categories),
      featured: item.featured === 'TRUE' || item.featured === 'true' || false,
      author: item.author || 'Anonymous',
      featuredImage: item.featuredImage || '',
      comment: item.comment === 'TRUE' || item.comment === 'true' || true,
      socmed: item.socmed === 'TRUE' || item.socmed === 'true' || true,
      published: item.load === 'TRUE' || item.load === 'true' || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    // Insert all posts
    const { data: result, error } = await supabase
      .from('posts')
      .insert(posts);
    
    if (error) {
      console.error('Migration error:', error);
      return;
    }
    
    console.log(`Successfully migrated ${posts.length} posts to Supabase`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Helper functions
function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60) + '-' + Math.random().toString(36).substring(2, 8);
}

function parseCategories(categories) {
  if (Array.isArray(categories)) return categories;
  if (typeof categories === 'string') {
    return categories.split(',').map(cat => cat.trim()).filter(Boolean);
  }
  return [];
}

// Run migration
migratePostsToSupabase()
  .then(() => console.log('Migration complete'))
  .catch(err => console.error('Migration script error:', err));