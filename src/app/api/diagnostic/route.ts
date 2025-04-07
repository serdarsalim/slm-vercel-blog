// src/app/api/diagnostic/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🔍 Running Supabase diagnostic check...');
    
    // Check environment variables
    const envCheck = {
      supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      supabaseKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      urlPartial: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
        `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 12)}...` : 'missing',
      keyPartial: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
        `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 5)}...${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(-5)}` : 'missing'
    };
    
    console.log('📋 Environment check:', envCheck);
    
    // 1. Basic connection test - improved type handling
    let totalPosts = 0;
    try {
      const { data: countData, error: connectionError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });
      
      if (connectionError) {
        console.error('❌ Connection error:', connectionError);
        return NextResponse.json({
          success: false,
          message: 'Failed to connect to Supabase',
          error: connectionError,
          env: envCheck
        }, { status: 500 });
      }
      
      totalPosts = typeof countData === 'object' && countData !== null ? 
                   (countData as any).count || 0 : 0;
      console.log('✅ Connected to Supabase successfully');
    } catch (countError) {
      console.error('❌ Error counting posts:', countError);
      // Continue with the diagnostics despite the count error
    }
    
    // 2. Get all posts (published and unpublished)
    const { data: allPosts, error: allPostsError } = await supabase
      .from('posts')
      .select('id, title, slug, published');
    
    if (allPostsError) {
      console.error('❌ Error fetching posts:', allPostsError);
    }
    
    // 3. Get only published posts
    const { data: publishedPosts, error: publishedError } = await supabase
      .from('posts')
      .select('id, title, slug')

    
    if (publishedError) {
      console.error('❌ Error fetching published posts:', publishedError);
    }
    
    // 4. Check preferences table
    const { data: preferences, error: preferencesError } = await supabase
      .from('preferences')
      .select('*');
    
    if (preferencesError) {
      console.error('❌ Error fetching preferences:', preferencesError);
    }
    
    // Build diagnostic result
    return NextResponse.json({
      success: true,
      message: 'Supabase diagnostic complete',
      environment: envCheck,
      database: {
        connected: true,
        totalPosts,
        allPosts: allPosts?.length || 0,
        publishedPosts: publishedPosts?.length || 0,
        allPostsData: allPosts?.map(p => ({
          title: p.title,
          slug: p.slug,
          published: p.published
        })),
        publishedPostsData: publishedPosts?.map(p => ({
          title: p.title,
          slug: p.slug
        })),
        preferences: preferences ? true : false,
        preferencesCount: preferences?.length || 0
      },
      errors: {
        allPosts: allPostsError ? allPostsError.message : null,
        publishedPosts: publishedError ? publishedError.message : null,
        preferences: preferencesError ? preferencesError.message : null
      }
    });
    
  } catch (error) {
    console.error('💥 Unexpected error in diagnostic:', error);
    return NextResponse.json({
      success: false,
      message: 'Unexpected error in Supabase diagnostic',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}