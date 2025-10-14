import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db/prisma';
import { comparePassword } from './password';

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
          throw new Error('User not found');
        }

        // Compare password using bcrypt
        const isPasswordValid = await comparePassword(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Invalid password');
        }

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
  // Let NextAuth handle cookie configuration automatically
  useSecureCookies: process.env.NODE_ENV === 'production',
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