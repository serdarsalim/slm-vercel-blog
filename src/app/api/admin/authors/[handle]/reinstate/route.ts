import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/admin-supabase';
import { revalidatePath } from 'next/cache';

export async function POST(
  request: NextRequest,
  { params }: { params: { handle: string } }
) {
  try {
    // 1. Get admin token from request
    const authHeader = request.headers.get('Authorization');
    const adminToken = authHeader ? authHeader.replace('Bearer ', '') : null;
    const validAdminToken = process.env.ADMIN_API_TOKEN;
    
    if (!adminToken || adminToken !== validAdminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { handle } = params;
    
    // 2. Check if author exists
    const { data: authorExists, error: checkError } = await adminSupabase
      .from('authors')
      .select('handle, status')
      .eq('handle', handle)
      .maybeSingle();
      
    if (checkError || !authorExists) {
      return NextResponse.json({ error: `Author with handle ${handle} not found` }, { status: 404 });
    }
    
    if (authorExists.status === 'active') {
      return NextResponse.json({ message: 'Author is already active' }, { status: 200 });
    }
    
    // 3. Update author status to active
    const { error } = await adminSupabase
      .from('authors')
      .update({ status: 'active' })
      .eq('handle', handle);
    
    if (error) {
      return NextResponse.json({ error: `Failed to reinstate author: ${error.message}` }, { status: 500 });
    }
    
    // 4. Revalidate author page and admin page
    revalidatePath(`/${handle}`, 'page');
    revalidatePath('/admin/authors', 'page');
    
    return NextResponse.json({
      success: true,
      message: `Author ${handle} has been reinstated`
    });
  } catch (error) {
    console.error('Error reinstating author:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}