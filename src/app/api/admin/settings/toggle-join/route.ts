import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

// Move this helper function to a separate file
// e.g., /src/lib/auth-utils.ts
export async function checkAdminAuth() {
  try {
    const cookieStore = cookies();
    const adminToken = cookieStore.get('admin_token')?.value;

    if (!adminToken) {
      return { authorized: false, error: 'No admin token found' };
    }

    // Verify this matches your admin token
    if (adminToken === process.env.ADMIN_API_TOKEN) {
      return { authorized: true };
    }

    return { authorized: false, error: 'Invalid admin token' };
  } catch (error) {
    console.error('Auth check error:', error);
    return { authorized: false, error: 'Authentication check failed' };
  }
}

// Add a proper route handler function
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth();
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body to get enabled status
    const body = await request.json();
    const { enabled } = body;
    
    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request: enabled status must be boolean' }, { status: 400 });
    }

    // Update the settings in your database
    const { error } = await supabase
      .from('settings')
      .upsert({ 
        key: 'join_disabled',
        value: !enabled 
      }, { 
        onConflict: 'key' 
      });

    if (error) {
      console.error('Failed to update join status:', error);
      return NextResponse.json({ error: 'Failed to update join status' }, { status: 500 });
    }

    return NextResponse.json({ enabled });
  } catch (error) {
    console.error('Toggle join error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}