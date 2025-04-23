// src/app/api/author/join-status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkAdminAuth } from '@/lib/auth-utils';

// Add this GET handler above the existing POST handler
export async function GET(request: NextRequest) {
  try {
    // For GET requests, we just need to return the current status
    // No need for admin authentication for this public setting
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'join_requests_enabled')
      .single();
      
    if (error) {
      console.error('Error fetching join status:', error);
      // Default to enabled if setting doesn't exist
      return NextResponse.json({ enabled: true });
    }
    
    return NextResponse.json({
      enabled: data?.value === true || data?.value === 'true'
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