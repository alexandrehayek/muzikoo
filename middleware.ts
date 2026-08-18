// /middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { geolocation } from '@vercel/functions';
import languageCodes from '@/lib/language-codes.json';

const PUBLIC_FILE = /\.(.*)$/;
const locales = Object.keys(languageCodes);
const defaultLocale = 'en';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Skip api routes, static files, next internals
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/_not-found') ||
    pathname.includes('/favicon.ico') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Parse path to see if it starts with an explicit language code (e.g. /en, /es, /fr, /de-DE)
  const segments = pathname.split('/');
  const segmentLocale = segments[1] ? segments[1].toLowerCase() : '';
  const baseLocale = segmentLocale ? segmentLocale.split('-')[0] : '';

  let locale = defaultLocale;
  let isExplicitLocale = false;

  if (segmentLocale && locales.includes(segmentLocale)) {
    isExplicitLocale = true;
    locale = segmentLocale;
  } else if (baseLocale && locales.includes(baseLocale)) {
    isExplicitLocale = true;
    locale = baseLocale;
  }

  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  let shouldSetLocaleCookie = false;

  if (!isExplicitLocale) {
    // No locale in pathname, detect:
    // 1. Cookie priority
    if (cookieLocale && locales.includes(cookieLocale)) {
      locale = cookieLocale;
    } else {
      // 2. Accept-Language header fallback
      const negotiatorHeaders: Record<string, string> = {};
      request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));
      const languages = new Negotiator({ headers: negotiatorHeaders }).languages();
      try {
        locale = match(languages, locales, defaultLocale);
      } catch (e) {
        locale = defaultLocale;
      }
      shouldSetLocaleCookie = true;
    }
  }

  const response = isExplicitLocale
    ? NextResponse.next()
    : NextResponse.rewrite(new URL(`/${locale}${pathname}${search}`, request.url));

  // If NEXT_LOCALE cookie is not set, set it now
  if (!cookieLocale || shouldSetLocaleCookie) {
    response.cookies.set('NEXT_LOCALE', locale, {
      path: '/',
      maxAge: 31536000, // 1 year
      sameSite: 'lax',
    });
  }

  // Handle Country/Location Cookie: if not set, detect via geolocation and set cookie
  const cookieCountry = request.cookies.get('USER_COUNTRY')?.value;
  if (!cookieCountry) {
    let detectedCountry = 'US';
    try {
      const geo = geolocation(request);
      if (geo?.country) {
        detectedCountry = geo.country;
      }
    } catch (e) {
      console.warn('Error in edge geolocation detection:', e);
    }

    if (!detectedCountry || detectedCountry === 'US') {
      const headerCountry =
        request.headers.get('x-vercel-ip-country') ||
        request.headers.get('x-open-geoip-country-code') ||
        request.headers.get('cf-ipcountry') ||
        request.headers.get('x-country-code');
      if (headerCountry && headerCountry.length === 2 && headerCountry !== 'XX') {
        detectedCountry = headerCountry.toUpperCase();
      }
    }

    response.cookies.set('USER_COUNTRY', detectedCountry, {
      path: '/',
      maxAge: 31536000, // 1 year
      sameSite: 'lax',
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js).*)'],
};


