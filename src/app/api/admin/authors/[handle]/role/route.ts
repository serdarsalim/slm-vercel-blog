import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from "next/cache";


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
    
    // 2. Get role from request body
    const body = await request.json();
    const { role } = body;
    
    if (!role || !["admin", "member"].includes(role)) {
      return NextResponse.json({ error: 'Invalid role value' }, { status: 400 });
    }
    
    // 3. Create service role client to bypass RLS
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    // 4. Check if author exists
    const { data: authorExists, error: checkError } = await adminSupabase
      .from('authors')
      .select('handle')
      .eq('handle', handle)
      .maybeSingle();
      
    if (checkError || !authorExists) {
      return NextResponse.json({ error: `Author with handle ${handle} not found` }, { status: 404 });
    }
    
    // 5. Update author role
    const { error } = await adminSupabase
      .from('authors')
      .update({ role })
      .eq('handle', handle);
    
    if (error) {
      console.error(`Error updating author role to ${role}:`, error);
      return NextResponse.json({ 
        error: `Failed to update author role to ${role}`,
        details: error
      }, { status: 500 });
    }
    
    // 6. Revalidate paths
    revalidatePath(`/${handle}`, 'page');
    revalidatePath(`/${handle}/blog`, 'page');
    revalidatePath('/authors', 'page'); 
    revalidatePath('/admin/authors', 'page');
    
    // 7. Return success response
    const actionName = role === 'admin' ? 'promoted to admin' : 'demoted to member';
    
    return NextResponse.json({
      success: true,
      message: `Author ${handle} ${actionName} successfully`
    });
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({ 
      error: 'Failed to update author role', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}