import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkAdminAuth } from '@/lib/auth-utils';

// Only export route handlers (POST, GET, etc.)
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