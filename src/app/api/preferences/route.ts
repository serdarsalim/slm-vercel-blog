// app/api/preferences/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  return new Response('Preferences API disabled', { status: 404 });
}

export async function POST(request: NextRequest) {
  return new Response('Preferences API disabled', { status: 404 });
}