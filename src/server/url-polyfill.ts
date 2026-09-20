/**
 * Modern WHATWG URL replacement for Node.js deprecated url.parse (fixes [DEP0169])
 * Replaces url.parse with standard new URL() and URLSearchParams.
 */
import nodeUrl from 'node:url';
import legacyUrl from 'url';

export interface ParsedUrlLike {
  protocol: string | null;
  slashes: boolean | null;
  auth: string | null;
  host: string | null;
  port: string | null;
  hostname: string | null;
  hash: string | null;
  search: string | null;
  query: string | Record<string, any> | null;
  pathname: string;
  path: string;
  href: string;
}

export function modernUrlParse(
  input: any,
  parseQueryString?: boolean,
  _slashesDenoteHost?: boolean
): ParsedUrlLike {
  const dummyBase = 'http://localhost';
  const UrlConstructor = (nodeUrl as any).Url || Object;
  const result: any = new UrlConstructor();

  if (typeof input !== 'string') {
    result.protocol = null;
    result.slashes = null;
    result.auth = null;
    result.host = null;
    result.port = null;
    result.hostname = null;
    result.hash = null;
    result.search = null;
    result.query = parseQueryString ? Object.create(null) : null;
    result.pathname = '';
    result.path = '';
    result.href = '';
    return result;
  }

  const isRelative = input.startsWith('/') || !input.includes('://');
  let parsed: URL;

  try {
    parsed = new URL(input, dummyBase);
  } catch {
    result.protocol = null;
    result.slashes = null;
    result.auth = null;
    result.host = null;
    result.port = null;
    result.hostname = null;
    result.hash = null;
    result.search = null;
    result.query = parseQueryString ? Object.create(null) : null;
    result.pathname = input;
    result.path = input;
    result.href = input;
    return result;
  }

  if (isRelative) {
    result.protocol = null;
    result.slashes = null;
    result.auth = null;
    result.host = null;
    result.port = null;
    result.hostname = null;
    result.pathname = parsed.pathname;
    result.search = parsed.search || null;
    result.hash = parsed.hash || null;
    result.path = parsed.pathname + (parsed.search || '');
    result.href = result.path;
  } else {
    result.protocol = parsed.protocol;
    result.slashes = true;
    result.auth =
      parsed.username || parsed.password
        ? `${parsed.username}${parsed.password ? ':' + parsed.password : ''}`
        : null;
    result.host = parsed.host;
    result.port = parsed.port || null;
    result.hostname = parsed.hostname;
    result.pathname = parsed.pathname;
    result.search = parsed.search || null;
    result.hash = parsed.hash || null;
    result.path = parsed.pathname + (parsed.search || '');
    result.href = parsed.href;
  }

  if (parseQueryString) {
    const q: Record<string, any> = Object.create(null);
    parsed.searchParams.forEach((val, key) => {
      if (key in q) {
        if (Array.isArray(q[key])) {
          q[key].push(val);
        } else {
          q[key] = [q[key], val];
        }
      } else {
        q[key] = val;
      }
    });
    result.query = q;
  } else {
    result.query = parsed.search ? parsed.search.slice(1) : null;
  }

  return result;
}

// Safely install replacement on global url modules
try {
  (nodeUrl as any).parse = modernUrlParse;
  (legacyUrl as any).parse = modernUrlParse;
} catch {
  // Ignore in environments where url properties are non-configurable
}
