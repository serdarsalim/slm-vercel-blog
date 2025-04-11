// src/admin/author-requests/route.ts


import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkAdminAuth } from '@/lib/auth-utils';

export async function GET(request) {
  try {
    // Check admin authentication
    const adminCheck = await checkAdminAuth();
    if (!adminCheck.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch author requests
    const { data, error } = await supabase
      .from('author_requests')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      throw new Error('Failed to fetch author requests');
    }
    
    return NextResponse.json({
      success: true,
      requests: data || []
    });
  } catch (error) {
    console.error('Error getting author requests:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}