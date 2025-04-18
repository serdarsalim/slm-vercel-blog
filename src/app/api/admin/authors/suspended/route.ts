import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/admin-supabase';
import { checkAdminAuth } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await checkAdminAuth();
    if (!adminCheck.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Alternative auth method using token from header
    // const authHeader = request.headers.get('Authorization');
    // const adminToken = authHeader ? authHeader.replace('Bearer ', '') : null;
    // const validAdminToken = process.env.ADMIN_API_TOKEN;
    
    // if (!adminToken || adminToken !== validAdminToken) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    // Fetch suspended authors
    const { data, error } = await adminSupabase
      .from('authors')
      .select('*')
      .eq('status', 'suspended')
      .order('name');
      
    if (error) {
      throw new Error(`Failed to fetch suspended authors: ${error.message}`);
    }
    
    return NextResponse.json({
      success: true,
      authors: data || []
    });
  } catch (error) {
    console.error('Error getting suspended authors:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}