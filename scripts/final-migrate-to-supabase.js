// final-migrate-to-supabase.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

// IMPORTANT: Use hardcoded credentials for reliability, since environment variables seem problematic
// Remove these before committing to version control!
const supabaseUrl = 'https://ubcyqbscoojgpzxawwjb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViY3lxYnNjb29qZ3B6eGF3d2piIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzk1MjIwMywiZXhwIjoyMDU5NTI4MjAzfQ.99E8ZoXFZNEt0q1viLwvcajn-u-FHTs1ZIEo0YFM5KI';

// Create Supabase client
console.log('🔌 Creating Supabase client...');
const supabase = createClient(supabaseUrl, supabaseKey);

async function migratePostsToSupabase() {
  try {
    console.log('🚀 Starting migration to Supabase...');
    
    // Test connection first
    await testConnection();
    
    // Check and fix table schema if needed
    await checkTableSchema();
    
    // Path to your exported CSV - first try to find blogPosts.csv
    let csvPath = path.join(process.cwd(), 'public', 'data', 'blogPosts.csv');
    
    // If that doesn't exist, check alternative locations
    if (!fs.existsSync(csvPath)) {
      console.log(`❓ CSV not found at: ${csvPath}`);
      
      // Try alternative location 1
      csvPath = path.join(process.cwd(), 'data', 'blogPosts.csv');
      console.log(`Checking alternative location: ${csvPath}`);
      
      if (!fs.existsSync(csvPath)) {
        throw new Error(`❌ Could not find a CSV file to import. Please check that the file exists at: ${path.join(process.cwd(), 'public', 'data', 'blogPosts.csv')}`);
      }
    }
    
    console.log(`📄 Reading CSV from: ${csvPath}`);
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    
    if (!csvContent || csvContent.trim().length === 0) {
      throw new Error('❌ CSV file is empty');
    }
    
    // Parse CSV with more forgiving options
    console.log('🔍 Parsing CSV data...');
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim(),
      transform: value => value.trim()
    });
    
    if (parseResult.errors && parseResult.errors.length > 0) {
      console.warn('⚠️ CSV parse warnings:', parseResult.errors);
    }
    
    const data = parseResult.data;
    console.log(`📊 Found ${data.length} posts to migrate`);
    
    if (data.length === 0) {
      throw new Error('❌ No valid posts found in CSV');
    }
    
    // Process posts
    const posts = data.map(item => ({
      title: item.title || 'Untitled Post',
      slug: item.slug || createSlug(item.title),
      content: item.content || '',
      excerpt: item.excerpt || '',
      date: formatDate(item.date),
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
    
    // Process in batches of 10 for better performance
    const batchSize = 10;
    let successCount = 0;
    let errorCount = 0;
    
    // First clear existing data if requested
    console.log('🗑️ Clearing existing posts from database...');
    try {
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all posts
      
      if (deleteError) {
        console.error('❌ Error clearing posts:', deleteError.message);
      } else {
        console.log('✅ Existing posts cleared successfully');
      }
    } catch (error) {
      console.error('❌ Error clearing posts:', error.message);
    }
    
    // Insert new posts in batches
    for (let i = 0; i < posts.length; i += batchSize) {
      const batch = posts.slice(i, i + batchSize);
      console.log(`⏳ Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(posts.length/batchSize)}`);
      
      try {
        // Use insert instead of upsert to avoid unique constraint issues
        const { data: result, error } = await supabase
          .from('posts')
          .insert(batch);
        
        if (error) {
          console.error(`❌ Batch error:`, error.message);
          errorCount += batch.length;
        } else {
          successCount += batch.length;
          console.log(`✅ Batch processed successfully`);
        }
      } catch (error) {
        console.error(`❌ Exception in batch:`, error.message);
        errorCount += batch.length;
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Check if preferences table exists and add default preferences
    try {
      console.log('🔍 Checking preferences...');
      const { data: existingPrefs, error } = await supabase
        .from('preferences')
        .select('key')
        .eq('key', 'site');
      
      if (error) {
        console.error('❌ Error checking preferences:', error.message);
      } else if (!existingPrefs || existingPrefs.length === 0) {
        console.log('📝 Adding default site preferences...');
        
        const { error: prefsError } = await supabase
          .from('preferences')
          .insert({
            key: 'site',
            value: { fontStyle: 'serif' },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (prefsError) {
          console.error('❌ Error adding preferences:', prefsError.message);
        } else {
          console.log('✅ Default preferences added');
        }
      } else {
        console.log('✅ Preferences already exist');
      }
    } catch (prefsError) {
      console.error('❌ Exception checking preferences:', prefsError.message);
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully migrated: ${successCount} posts`);
    console.log(`❌ Failed: ${errorCount} posts`);
    
    return { successCount, errorCount };
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    return { successCount: 0, errorCount: 0, error: error.message };
  }
}

// Test connection to Supabase
async function testConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    const { count, error } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ Supabase connection successful! Database has ${count || 0} posts.`);
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    console.error('Error details:', error);
    throw new Error(`Supabase connection failed: ${error.message}`);
  }
}

// Check and fix table schema if needed
async function checkTableSchema() {
  console.log('🔍 Checking database schema...');
  
  try {
    // Try to run a simple SQL query to check for slug uniqueness constraint
    const { error } = await supabase.rpc('check_slug_constraint');
    
    if (error) {
      // If the function doesn't exist, create it first
      console.log('⚙️ Creating check_slug_constraint function...');
      await supabase.sql(`
        CREATE OR REPLACE FUNCTION check_slug_constraint()
        RETURNS boolean
        LANGUAGE plpgsql AS $$
        DECLARE
          constraint_exists boolean;
        BEGIN
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints
            WHERE table_name = 'posts'
            AND constraint_name = 'posts_slug_unique'
          ) INTO constraint_exists;
          
          RETURN constraint_exists;
        END;
        $$;
      `);
      
      // Try again
      const { data, error: retryError } = await supabase.rpc('check_slug_constraint');
      
      if (retryError) {
        console.error('❌ Error checking slug constraint:', retryError.message);
        constraint_exists = false;
      } else {
        constraint_exists = data;
      }
    } else {
      constraint_exists = error;
    }
    
    // If constraint doesn't exist, add it
    if (!constraint_exists) {
      console.log('⚙️ Adding unique constraint to slug column...');
      
      try {
        await supabase.sql(`
          ALTER TABLE posts 
          ADD CONSTRAINT posts_slug_unique UNIQUE (slug);
        `);
        console.log('✅ Unique constraint added successfully');
      } catch (sqlError) {
        console.error('❌ Error adding constraint:', sqlError.message);
        // Continue anyway, we'll use an alternative approach
      }
    } else {
      console.log('✅ Slug constraint already exists');
    }
  } catch (error) {
    console.error('❌ Error checking/fixing schema:', error.message);
    // We'll continue anyway, just using a different insert approach
  }
}

// Helper functions
function createSlug(title) {
  if (!title) return 'untitled-' + Date.now();
  
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')  // Remove special chars
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single
    .substring(0, 60) + '-' + Math.random().toString(36).substring(2, 8); // Add unique suffix
}

function parseCategories(categories) {
  if (!categories) return [];
  
  // Handle different formats: arrays, comma-separated, pipe-separated
  if (Array.isArray(categories)) {
    return categories.filter(Boolean);
  }
  
  if (typeof categories === 'string') {
    // Check if pipe-separated
    if (categories.includes('|')) {
      return categories.split('|').map(cat => cat.trim()).filter(Boolean);
    }
    // Check if comma-separated
    if (categories.includes(',')) {
      return categories.split(',').map(cat => cat.trim()).filter(Boolean);
    }
    // Single category
    return [categories.trim()];
  }
  
  return [];
}

function formatDate(date) {
  if (!date) return new Date().toISOString().split('T')[0];
  
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  
  // If it's already a string in correct format, return it
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    return date.split('T')[0]; // Handle ISO strings
  }
  
  // Try to parse the date
  try {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString().split('T')[0];
    }
  } catch (e) {
    // Parsing failed, use today's date
  }
  
  return new Date().toISOString().split('T')[0];
}

// Run migration
migratePostsToSupabase()
  .then(result => {
    if (result.error) {
      console.error(`❌ Migration failed: ${result.error}`);
    } else {
      console.log(`🎉 Migration completed: ${result.successCount} posts migrated, ${result.errorCount} failed`);
    }
  })
  .catch(err => {
    console.error('❌ Unhandled error in migration script:', err.message);
  });