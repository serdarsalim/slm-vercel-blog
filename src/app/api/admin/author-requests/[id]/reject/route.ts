import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { adminSupabase } from '@/lib/admin-supabase';
import { checkAdminAuth } from '@/lib/auth-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication // bismillah 
    const adminCheck = await checkAdminAuth();
    if (!adminCheck.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    
    // Update the request status using adminSupabase
    const { error } = await adminSupabase
      .from('author_requests')
      .update({ 
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
      
    if (error) {
      throw new Error('Failed to update author request');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Author request rejected successfully'
    });
  } catch (error) {
    console.error('Error rejecting author request:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}