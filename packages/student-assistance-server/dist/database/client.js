"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ?? new client_1.PrismaClient({
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
exports.prisma.$on('query', (e) => {
    logger_1.logger.debug('Query: ' + e.query);
    logger_1.logger.debug('Params: ' + e.params);
    logger_1.logger.debug('Duration: ' + e.duration + 'ms');
});
exports.prisma.$on('error', (e) => {
    logger_1.logger.error('Prisma Error:', e);
});
exports.prisma.$on('info', (e) => {
    logger_1.logger.info('Prisma Info:', e);
});
exports.prisma.$on('warn', (e) => {
    logger_1.logger.warn('Prisma Warning:', e);
});
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
//# sourceMappingURL=client.js.map