// prismaEnzymesClient.ts
import { PrismaClient } from './prisma/generated/client_enzymes';

const prismaEnzymesClientSingleton = () => new PrismaClient();

type PrismaEnzymesClientSingleton = ReturnType<typeof prismaEnzymesClientSingleton>;

const globalForPrismaEnzymes = globalThis as unknown as {
  prismaEnzymes: PrismaEnzymesClientSingleton | undefined;
};

const prismaEnzymes = globalForPrismaEnzymes.prismaEnzymes ?? prismaEnzymesClientSingleton();

export default prismaEnzymes;

if (process.env.NODE_ENV !== 'production') {
  globalForPrismaEnzymes.prismaEnzymes = prismaEnzymes;
}