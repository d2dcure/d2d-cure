// prismaProteinsClient.ts
import { PrismaClient } from './prisma/generated/client_proteins';

const prismaProteinsClientSingleton = () => new PrismaClient();

type PrismaProteinsClientSingleton = ReturnType<typeof prismaProteinsClientSingleton>;

const globalForPrismaProteins = globalThis as unknown as {
  prismaProteins: PrismaProteinsClientSingleton | undefined;
};

const prismaProteins = globalForPrismaProteins.prismaProteins ?? prismaProteinsClientSingleton();

export default prismaProteins;

if (process.env.NODE_ENV !== 'production') {
  globalForPrismaProteins.prismaProteins = prismaProteins;
}