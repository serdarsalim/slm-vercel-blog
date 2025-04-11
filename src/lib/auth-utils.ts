// src/lib/auth-utils.ts

import { cookies } from 'next/headers';

export async function checkAdminAuth() {
  try {
    const cookieStore = cookies();
    const adminToken = cookieStore.get('admin_token')?.value;

    if (!adminToken) {
      return { authorized: false, error: 'No admin token found' };
    }

    // Verify this matches your admin token
    if (adminToken === process.env.ADMIN_API_TOKEN) {
      return { authorized: true };
    }

    return { authorized: false, error: 'Invalid admin token' };
  } catch (error) {
    console.error('Auth check error:', error);
    return { authorized: false, error: 'Authentication check failed' };
  }
}