// src/app/api/author/preferences/route.ts
import { revalidatePath, revalidateTag } from "next/cache";
// src/app/api/author/preferences/route.ts
import { NextRequest, NextResponse } from "next/server";

// DISABLED: Not currently using author preferences

export async function GET(request: NextRequest) {
  return new Response('Author preferences API disabled', { status: 404 });
}

export async function POST(request: NextRequest) {
  return new Response('Author preferences API disabled', { status: 404 });
}

// Keep OPTIONS method for CORS if needed
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}