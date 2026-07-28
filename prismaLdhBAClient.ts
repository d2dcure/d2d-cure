// prismaLdhBAClient.ts
import { PrismaClient } from './prisma/generated/client_LdhBA';

const prismaLdhBAClientSingleton = () => new PrismaClient();

type PrismaLdhBAClientSingleton = ReturnType<typeof prismaLdhBAClientSingleton>;

const globalForPrismaLdhBA = globalThis as unknown as {
  prismaLdhBA: PrismaLdhBAClientSingleton | undefined;
};

const prismaLdhBA = globalForPrismaLdhBA.prismaLdhBA ?? prismaLdhBAClientSingleton();

export default prismaLdhBA;

if (process.env.NODE_ENV !== 'production') {
  globalForPrismaLdhBA.prismaLdhBA = prismaLdhBA;
}