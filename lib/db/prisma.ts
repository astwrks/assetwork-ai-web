import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error'], // Only log errors, suppress query logs
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Increase connection pool for long-running operations like report generation
    __internal: {
      engine: {
        connection_limit: 20,
      },
    },
  } as any);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
