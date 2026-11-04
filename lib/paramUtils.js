/**
 * Safely resolves a dynamic route parameter in Next.js static export environments.
 * When Next.js exports static routes with generateStaticParams: [{ param: '_' }],
 * Apache rewrites real URLs (e.g. /super-admin/colleges/uuid-here) to /super-admin/colleges/_/index.html.
 * At runtime, useParams() or props.params will hold '_' instead of the actual URL segment.
 * This helper inspects window.location.pathname and returns the real value.
 */
export function resolveParam(paramValue, precedingSegment) {
  if (typeof window === 'undefined') return paramValue;
  if (paramValue && paramValue !== '_') return paramValue;

  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts.length === 0) return paramValue;

  if (precedingSegment) {
    const idx = parts.indexOf(precedingSegment);
    if (idx !== -1 && parts[idx + 1] && parts[idx + 1] !== '_') {
      return decodeURIComponent(parts[idx + 1]);
    }
  }

  const last = parts[parts.length - 1];
  if (last && last !== '_') {
    return decodeURIComponent(last);
  }

  return paramValue;
}

export function resolveAllParams(params = {}) {
  if (typeof window === 'undefined' || !params) return params || {};
  const resolved = { ...params };
  const placeholderKeys = Object.keys(resolved).filter(k => resolved[k] === '_');
  if (placeholderKeys.length === 0) return resolved;

  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts.length === 0) return resolved;

  const last = parts[parts.length - 1];
  if (last && last !== '_') {
    placeholderKeys.forEach(k => {
      resolved[k] = decodeURIComponent(last);
    });
  }

  return resolved;
}
