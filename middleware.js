import { NextResponse } from 'next/server';
import { getHostType, getTenantSlug, ROOT_DOMAIN } from './lib/host';

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, svg, json)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json)$).*)'
  ]
};

export function middleware(request) {
  const host = request.headers.get('host') || '';
  const hostType = getHostType(host);
  const { pathname, search } = request.nextUrl;
  const isDev = host.includes('localhost');

  // Clone headers so downstream components / pages can inspect host context
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-host-type', hostType);

  // ─── 1. ROOT HOST (collegeshub.org, www, localhost) ──────────────────────
  if (hostType === 'root') {
    // 308 Redirect for old /college/:slug to subdomain https://:slug.collegeshub.org/
    const collegeMatch = pathname.match(/^\/college\/([a-zA-Z0-9-]+)\/?$/);
    if (collegeMatch) {
      const slug = collegeMatch[1].toLowerCase();
      const targetHost = isDev ? `${slug}.localhost:3000` : `${slug}.${ROOT_DOMAIN}`;
      const protocol = isDev ? 'http' : 'https';
      return NextResponse.redirect(`${protocol}://${targetHost}/${search}`, 308);
    }

    // 308 Redirect for old /apply/:code to tenant subdomain
    const applyMatch = pathname.match(/^\/apply\/([a-zA-Z0-9-]+)(\/.*)?$/);
    if (applyMatch) {
      const slug = applyMatch[1].toLowerCase();
      const rest = applyMatch[2] || '';
      const targetHost = isDev ? `${slug}.localhost:3000` : `${slug}.${ROOT_DOMAIN}`;
      const protocol = isDev ? 'http' : 'https';
      return NextResponse.redirect(`${protocol}://${targetHost}/apply/${slug}${rest}${search}`, 308);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    });
  }

  // ─── 2. ADMIN HOST (admin.collegeshub.org, admin.localhost) ──────────────
  if (hostType === 'admin') {
    // Root "/" redirects to super admin panel or login
    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/super-admin';
      return NextResponse.redirect(url);
    }

    // Tenant role dashboards are not served on admin host
    const tenantOnlyPaths = ['/student', '/teacher', '/registrar', '/accountant', '/principal', '/college'];
    if (tenantOnlyPaths.some(prefix => pathname.startsWith(prefix))) {
      const url = request.nextUrl.clone();
      url.pathname = '/404';
      return NextResponse.rewrite(url);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    });
  }

  // ─── 3. TENANT HOST ({slug}.collegeshub.org, {slug}.localhost) ───────────
  if (hostType === 'tenant') {
    const slug = getTenantSlug(host);
    if (slug) {
      requestHeaders.set('x-tenant-slug', slug);
    }

    // Super admin portal is NOT served on tenant subdomains
    if (pathname.startsWith('/super-admin')) {
      const url = request.nextUrl.clone();
      url.pathname = '/404';
      return NextResponse.rewrite(url);
    }

    // Root "/" on a tenant host serves the public college profile
    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = `/college/${slug}`;
      return NextResponse.rewrite(url, {
        request: {
          headers: requestHeaders
        }
      });
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    });
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });
}
