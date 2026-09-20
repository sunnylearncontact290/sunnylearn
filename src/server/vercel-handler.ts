import './url-polyfill';
import app from './app';

export default function handler(req: any, res: any) {
  // Normalize Vercel serverless request URL using modern WHATWG URL API
  const rawUrl = (req.headers['x-matched-path'] as string) || req.url || '/api';
  try {
    const parsed = new URL(rawUrl, 'http://localhost');
    let pathname = parsed.pathname;
    if (pathname === '/robots.txt' || pathname === '/sitemap.xml') {
      req.url = pathname + parsed.search;
    } else if (!pathname.startsWith('/api')) {
      pathname = '/api' + (pathname.startsWith('/') ? pathname : '/' + pathname);
      req.url = pathname + parsed.search;
    } else {
      req.url = pathname + parsed.search;
    }
  } catch {
    if (req.url === '/robots.txt' || req.url === '/sitemap.xml') {
      // keep as is
    } else if (!req.url || !req.url.startsWith('/api')) {
      req.url = '/api' + (req.url && req.url.startsWith('/') ? req.url : '/' + (req.url || ''));
    }
  }

  return app(req, res);
}

export { app };
