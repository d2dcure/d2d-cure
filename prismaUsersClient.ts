// import { PrismaClient } from './prisma/generated/client_users';

// const prismaUsers = new PrismaClient();

// export default prismaUsers;

import { PrismaClient } from './prisma/generated/client_users'

declare global {
    var prismaUsers: any;
  }

if (process.env.NODE_ENV === 'production') {
  prismaUsers = new PrismaClient();
} else {
  if (!global.prismaUsers) {
    global.prismaUsers = new PrismaClient();
  }
  prismaUsers = global.prismaUsers;
}

export default prismaUsers;