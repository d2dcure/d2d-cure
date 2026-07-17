// prismaAbcDClient.ts
import { PrismaClient } from './prisma/generated/client_AbCD';

const prismaAbcDClientSingleton = () => new PrismaClient();

type PrismaAbcDClientSingleton = ReturnType<typeof prismaAbcDClientSingleton>;

const globalForPrismaAbcD = globalThis as unknown as {
  prismaAbcD: PrismaAbcDClientSingleton | undefined;
};

const prismaAbcD = globalForPrismaAbcD.prismaAbcD ?? prismaAbcDClientSingleton();

export default prismaAbcD;

if (process.env.NODE_ENV !== 'production') {
  globalForPrismaAbcD.prismaAbcD = prismaAbcD;
}