// src/app/api/author/join-status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkAdminAuth } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await checkAdminAuth();
    if (!adminCheck.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { enabled } = await request.json();
    
    // Update the setting
    const { error } = await supabase
      .from('settings')
      .upsert({
        key: 'join_requests_enabled',
        value: enabled,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
      
    if (error) {
      throw new Error('Failed to update settings');
    }
    
    return NextResponse.json({
      success: true,
      enabled: enabled
    });
  } catch (error) {
    console.error('Error toggling join status:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}