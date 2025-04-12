// src/app/api/admin/authors/[handle]/promote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { handle: string } }
) {
  try {
    // Get admin token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const adminToken = authHeader ? authHeader.replace('Bearer ', '') : null;
    const validAdminToken = process.env.ADMIN_API_TOKEN;
    
    if (!adminToken || adminToken !== validAdminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { handle } = params;
    
    // Update author role to admin
    const { error } = await supabase
      .from('authors')
      .update({ role: 'admin' })
      .eq('handle', handle);
    
    if (error) {
      console.error('Error promoting author:', error);
      return NextResponse.json({ error: 'Failed to promote author' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: `Author ${handle} promoted to admin successfully`
    });
  } catch (error) {
    console.error('Error promoting author:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}