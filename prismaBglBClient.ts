// prismaBglBClient.ts
import { PrismaClient } from './prisma/generated/client_BglB';

const prismaBglBClientSingleton = () => new PrismaClient();

type PrismaBglBClientSingleton = ReturnType<typeof prismaBglBClientSingleton>;

const globalForPrismaBglB = globalThis as unknown as {
  prismaBglB: PrismaBglBClientSingleton | undefined;
};

const prismaBglB = globalForPrismaBglB.prismaBglB ?? prismaBglBClientSingleton();

export default prismaBglB;

if (process.env.NODE_ENV !== 'production') {
  globalForPrismaBglB.prismaBglB = prismaBglB;
}