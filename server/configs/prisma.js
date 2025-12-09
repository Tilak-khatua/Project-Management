import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';

import ws from 'ws';
neonConfig.webSocketConstructor = ws;

// To work in edge environments (Cloudflare Workers, Vercel Edge, etc.), enable querying over fetch
// neonConfig.poolQueryViaFetch = true

// Type definitions
// declare global {
//   var prisma: PrismaClient | undefined
// }

const connectionString = `${process.env.DATABASE_URL}`;

// For serverless environments, create a function that returns a Prisma instance
export const getPrisma = () => {
  if (global.prisma) {
    return global.prisma;
  }
  
  const adapter = new PrismaNeon({ connectionString });
  const prisma = new PrismaClient({ adapter });
  
  if (process.env.NODE_ENV === 'development') {
    global.prisma = prisma;
  }
  
  return prisma;
};

// Export default for backward compatibility
export default getPrisma();