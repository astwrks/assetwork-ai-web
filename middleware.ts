import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // In development mode with DEV_USER_ID, bypass auth for API routes
    if (process.env.NODE_ENV === 'development' && process.env.DEV_USER_ID) {
      // Allow API routes to handle their own dev authentication
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.next();
      }
    }

    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth');

    // If user is authenticated and on auth page, redirect to playground
    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL('/financial-playground', req.url));
    }

    // If user is not authenticated and trying to access protected route
    if (!isAuthPage && !isAuth) {
      // Store the original URL to redirect back after login
      const signInUrl = new URL('/auth/signin', req.url);
      signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search);
      return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // In development mode with DEV_USER_ID, allow all API routes
        if (process.env.NODE_ENV === 'development' && process.env.DEV_USER_ID) {
          if (req.nextUrl.pathname.startsWith('/api/')) {
            return true;
          }
        }
        // Allow auth pages without token
        if (req.nextUrl.pathname.startsWith('/auth')) {
          return true;
        }
        // Require token for protected pages
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/financial-playground/:path*', // Added playground protection
    '/api/widgets/:path*',
    '/api/user/:path*',
    '/api/playground/:path*', // Added playground API protection
    '/api/v2/:path*', // Added v2 API protection
    '/auth/:path*', // Added auth pages for redirect logic
  ],
};
