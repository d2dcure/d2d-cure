// prismaUsersClient.ts
import { PrismaClient } from './prisma/generated/client_users';

const prismaUsersClientSingleton = () => new PrismaClient();

type PrismaUsersClientSingleton = ReturnType<typeof prismaUsersClientSingleton>;

const globalForPrismaUsers = globalThis as unknown as {
  prismaUsers: PrismaUsersClientSingleton | undefined;
};

const prismaUsers = globalForPrismaUsers.prismaUsers ?? prismaUsersClientSingleton();

export default prismaUsers;

if (process.env.NODE_ENV !== 'production') {
  globalForPrismaUsers.prismaUsers = prismaUsers;
}