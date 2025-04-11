// src/app/api/admin/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;
    
    // Verify admin password
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!password || password !== adminPassword) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid password' 
      }, { status: 401 });
    }
    
    // Get admin token
    const adminToken = process.env.ADMIN_API_TOKEN;
    
    if (!adminToken) {
      return NextResponse.json({ 
        success: false,
        error: 'Admin token not configured' 
      }, { status: 500 });
    }
    
    // Set admin token cookie - expires in 24 hours
    const cookieStore = cookies();
    cookieStore.set('admin_token', adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    });
    
    return NextResponse.json({
      success: true,
      message: 'Logged in successfully'
    });
  } catch (error) {
    console.error('Error in admin login:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
