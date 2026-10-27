'use strict';

import { isValidSlug } from './reservedSlugs';

export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'collegeshub.org';

/**
 * Classifies a hostname into 'root', 'admin', or 'tenant'.
 *
 * Supported environments:
 * Production:
 *   - collegeshub.org, www.collegeshub.org -> 'root'
 *   - admin.collegeshub.org -> 'admin'
 *   - fmc.collegeshub.org -> 'tenant'
 * Local dev:
 *   - localhost:3000, 127.0.0.1:3000 -> 'root'
 *   - admin.localhost:3000 -> 'admin'
 *   - fmc.localhost:3000 -> 'tenant'
 *
 * @param {string} host
 * @returns {'root' | 'admin' | 'tenant'}
 */
export function getHostType(host) {
  if (!host) return 'root';
  const cleanHost = host.split(':')[0].toLowerCase();

  // Local development hostnames
  if (cleanHost === 'localhost' || cleanHost === '127.0.0.1') {
    return 'root';
  }
  if (cleanHost.endsWith('.localhost')) {
    const sub = cleanHost.replace('.localhost', '');
    if (sub === 'admin') return 'admin';
    if (sub === 'www') return 'root';
    return 'tenant';
  }

  // Production hostnames
  const root = ROOT_DOMAIN.toLowerCase();
  if (cleanHost === root || cleanHost === `www.${root}`) {
    return 'root';
  }
  if (cleanHost === `admin.${root}`) {
    return 'admin';
  }
  if (cleanHost.endsWith(`.${root}`)) {
    return 'tenant';
  }

  // Fallback for Vercel preview or other hosting
  return 'root';
}

/**
 * Extracts the tenant slug from a hostname.
 * Returns null if the host is root or admin.
 *
 * @param {string} host
 * @returns {string|null}
 */
export function getTenantSlug(host) {
  if (!host) return null;
  const cleanHost = host.split(':')[0].toLowerCase();

  // Local dev
  if (cleanHost.endsWith('.localhost')) {
    const sub = cleanHost.replace('.localhost', '');
    if (sub === 'admin' || sub === 'www') return null;
    return sub;
  }

  // Production
  const root = ROOT_DOMAIN.toLowerCase();
  if (cleanHost.endsWith(`.${root}`)) {
    const sub = cleanHost.slice(0, -(root.length + 1));
    if (sub === 'admin' || sub === 'www') return null;
    return sub;
  }

  return null;
}

/**
 * Builds the fully qualified URL for a tenant subdomain.
 *
 * @param {string} slug
 * @param {string} [path='']
 * @returns {string}
 */
export function buildTenantUrl(slug, path = '') {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined' && window.location.hostname.includes('localhost')) {
    const port = window.location.port ? `:${window.location.port}` : '';
    return `http://${slug}.localhost${port}${cleanPath}`;
  }
  return `https://${slug}.${ROOT_DOMAIN}${cleanPath}`;
}

/**
 * Builds the fully qualified URL for the admin portal.
 *
 * @param {string} [path='']
 * @returns {string}
 */
export function buildAdminUrl(path = '') {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined' && window.location.hostname.includes('localhost')) {
    const port = window.location.port ? `:${window.location.port}` : '';
    return `http://admin.localhost${port}${cleanPath}`;
  }
  return `https://admin.${ROOT_DOMAIN}${cleanPath}`;
}
