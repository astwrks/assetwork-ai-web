import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db/prisma';
import { comparePassword } from './password';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from './rate-limiter';

// Validate environment variables in production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.NEXTAUTH_URL) {
    throw new Error('NEXTAUTH_URL environment variable is required in production');
  }
  if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET === 'your-nextauth-secret-here-change-in-production') {
    throw new Error('NEXTAUTH_SECRET must be set to a strong secret in production');
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        // Check rate limit for this email
        const rateLimitCheck = checkRateLimit(credentials.email);
        if (!rateLimitCheck.isAllowed) {
          if (rateLimitCheck.lockedUntil) {
            throw new Error(
              `Account temporarily locked due to too many failed attempts. Try again after ${rateLimitCheck.lockedUntil.toLocaleTimeString()}`
            );
          }
          throw new Error(
            `Too many login attempts. Please try again later. Remaining attempts: ${rateLimitCheck.remainingAttempts}`
          );
        }

        // Find user in PostgreSQL using Prisma
        const user = await prisma.users.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            password: true,
            name: true,
            image: true,
          },
        });

        if (!user || !user.password) {
          // Record failed attempt for rate limiting
          recordFailedAttempt(credentials.email);
          throw new Error('User not found');
        }

        // Compare password using bcrypt
        const isPasswordValid = await comparePassword(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          // Record failed attempt for rate limiting
          recordFailedAttempt(credentials.email);
          throw new Error('Invalid password');
        }

        // Reset rate limit on successful login
        resetRateLimit(credentials.email);

        // Return user object
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Explicit secure cookie configuration following OWASP best practices
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true, // Prevent XSS attacks by making cookie inaccessible to JavaScript
        sameSite: 'lax', // CSRF protection: cookies only sent with same-site requests or top-level navigation
        path: '/',
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        domain: process.env.NODE_ENV === 'production' ? process.env.NEXTAUTH_DOMAIN : undefined,
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.callback-url' : 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' ? '__Host-next-auth.csrf-token' : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add user ID to token on initial sign-in
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user ID to session
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  debug: false, // Disable debug warnings in all environments
};