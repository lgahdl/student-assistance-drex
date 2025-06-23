import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Log Prisma events with proper typing
prisma.$on('query' as never, (e: any) => {
  logger.debug('Query: ' + e.query);
  logger.debug('Params: ' + e.params);
  logger.debug('Duration: ' + e.duration + 'ms');
});

prisma.$on('error' as never, (e: any) => {
  logger.error('Prisma Error:', e);
});

prisma.$on('info' as never, (e: any) => {
  logger.info('Prisma Info:', e);
});

prisma.$on('warn' as never, (e: any) => {
  logger.warn('Prisma Warning:', e);
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma; 