// src/app/api/admin/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  console.log("==== ADMIN LOGIN ATTEMPT STARTED ====");
  
  try {
    // Log request information
    console.log("Request headers:", Object.fromEntries(request.headers.entries()));
    
    // Parse the request body
    const body = await request.json();
    console.log("Request body received:", body ? "✅" : "❌");
    
    const { password } = body;
    console.log("Password provided:", password ? "✅ (length: " + password.length + ")" : "❌ MISSING");
    
    // Get environment variables
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminToken = process.env.ADMIN_API_TOKEN;
    
    console.log("ENV Variables:");
    console.log("- ADMIN_PASSWORD exists:", !!adminPassword ? "✅" : "❌");
    console.log("- ADMIN_PASSWORD length:", adminPassword?.length || 0);
    console.log("- ADMIN_API_TOKEN exists:", !!adminToken ? "✅" : "❌");
    console.log("- ADMIN_API_TOKEN length:", adminToken?.length || 0);
    console.log("- NODE_ENV:", process.env.NODE_ENV || "undefined");
    
    // TEMPORARY DEBUG - DO NOT LEAVE IN PRODUCTION CODE
    console.log("❗ DEBUG - Expected password:", adminPassword);
    console.log("❗ DEBUG - Received password:", password);
    
    // Test various comparison methods
    const exactMatch = password === adminPassword;
    const trimmedMatch = password?.trim() === adminPassword?.trim();
    const lowercaseMatch = password?.toLowerCase() === adminPassword?.toLowerCase();
    const trimmedLowercaseMatch = password?.trim().toLowerCase() === adminPassword?.trim().toLowerCase();
    
    console.log("Password comparison results:");
    console.log("- Exact match:", exactMatch ? "✅" : "❌");
    console.log("- Trimmed match:", trimmedMatch ? "✅" : "❌");
    console.log("- Lowercase match:", lowercaseMatch ? "✅" : "❌");
    console.log("- Trimmed lowercase match:", trimmedLowercaseMatch ? "✅" : "❌");
    
    // Check if password is valid
    if (!password || !exactMatch) {
      console.log("❌ Authentication failed: Invalid password");
      
      return NextResponse.json({ 
        success: false,
        error: 'Invalid password',
        debug: {
          passwordProvided: !!password,
          passwordLength: password?.length || 0,
          envPasswordExists: !!adminPassword,
          envPasswordLength: adminPassword?.length || 0,
          exactMatch,
          trimmedMatch,
          lowercaseMatch,
          trimmedLowercaseMatch
        }
      }, { status: 401 });
    }
    
    console.log("✅ Password validation successful");
    
    // Check if admin token exists
    if (!adminToken) {
      console.log("❌ Authentication failed: Admin token not configured");
      
      return NextResponse.json({ 
        success: false,
        error: 'Admin token not configured' 
      }, { status: 500 });
    }
    
    // Set admin token cookie
    try {
      const cookieStore = cookies();
      cookieStore.set('admin_token', adminToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/'
      });
      
      console.log("✅ Cookie set successfully");
    } catch (cookieError) {
      console.error("❌ Failed to set cookie:", cookieError);
      
      return NextResponse.json({
        success: false,
        error: 'Failed to set authentication cookie',
        cookieError: cookieError instanceof Error ? cookieError.message : 'Unknown cookie error'
      }, { status: 500 });
    }
    
    console.log("==== ADMIN LOGIN COMPLETED SUCCESSFULLY ====");
    
    return NextResponse.json({
      success: true,
      message: 'Logged in successfully'
    });
  } catch (error) {
    console.error('❌ Fatal error in admin login:', error);
    
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}