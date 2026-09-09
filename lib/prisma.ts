import { PrismaClient } from '@prisma/client/wasm'
import { PrismaD1 } from '@prisma/adapter-d1'
import { getCloudflareContext } from '@opennextjs/cloudflare'

const cloudflareContextSymbol = Symbol.for("__cloudflare-context__");

function getD1Binding(): any {
  // 1. Check OpenNext internal context symbol on globalThis
  const globalCtx = (globalThis as any)[cloudflareContextSymbol];
  if (globalCtx?.env?.DB) {
    return globalCtx.env.DB;
  }

  // 2. Try getCloudflareContext helper
  try {
    const ctx = getCloudflareContext() as any;
    if (ctx?.env?.DB) {
      return ctx.env.DB;
    }
  } catch (_e) {
    // ignore
  }

  // 3. Check process.env or globalThis binding fallback
  if ((globalThis as any).DB) {
    return (globalThis as any).DB;
  }
  if ((process.env as any).DB) {
    return (process.env as any).DB;
  }

  return null;
}

export const getPrismaClient = (): PrismaClient => {
  const d1 = getD1Binding();
  if (d1) {
    const adapter = new PrismaD1(d1);
    return new PrismaClient({ adapter });
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('D1 database binding "DB" is not available in the current environment.');
  }

  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
  };

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
};

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    if (prop === '$transaction') {
      return async (arg: any, options?: any) => {
        if (typeof arg === 'function') {
          // Cloudflare D1 does not support interactive transactions ($transaction(async tx => ...))
          // Gracefully execute sequentially using the prisma proxy as tx
          return await arg(prisma);
        }
        return await client.$transaction(arg, options);
      };
    }
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

// Safely execute database queries with error handling for the frontend components
export async function safeDbQuery<T>(queryFn: () => Promise<T>): Promise<T | null> {
  try {
    return await queryFn()
  } catch (error) {
    console.error('Database connection failed:', error)
    return null
  }
}
