import { NextRequest } from 'next/server';

/**
 * Checks whether the incoming admin request is authenticated by verifying either
 * the bearer token header or the signed admin cookie.
 */
export function isAdminRequest(request: NextRequest): boolean {
  const validToken = process.env.ADMIN_API_TOKEN;
  if (!validToken) {
    console.error('ADMIN_API_TOKEN is not set');
    return false;
  }

  const headerToken = request.headers
    .get('authorization')
    ?.replace('Bearer ', '')
    ?.trim();

  const cookieToken = request.cookies.get('admin_token')?.value;

  return headerToken === validToken || cookieToken === validToken;
}
