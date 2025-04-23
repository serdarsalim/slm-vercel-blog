// src/app/api/author/join-status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkAdminAuth } from '@/lib/auth-utils';

// Add this GET handler above the existing POST handler
export async function GET(request: NextRequest) {
  try {
    // Update this query to use the same key as your toggle API
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'join_disabled')  // Changed to 'join_disabled'
      .single();
      
    if (error) {
      console.error('Error fetching join status:', error);
      // Default to enabled if setting doesn't exist
      return NextResponse.json({ enabled: true });
    }
    
    return NextResponse.json({
      enabled: !(data?.value === true || data?.value === 'true')  // INVERT the logic
    });
  } catch (error) {
    console.error('Error checking join status:', error);
    // Default to enabled if there's an error
    return NextResponse.json({ enabled: true });
  }
}

// Keep your existing POST handler
export async function POST(request: NextRequest) {
  // Your existing code...
}