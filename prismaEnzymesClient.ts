import { PrismaClient } from './prisma/generated/client_enzymes';

const prismaEnzymes = new PrismaClient();

export default prismaEnzymes;

// import { PrismaClient } from './prisma/generated/client_enzymes'

// declare global {
//     var prismaEnzymes: any;
//   }

// if (process.env.NODE_ENV === 'production') {
//   prismaEnzymes = new PrismaClient();
// } else {
//   if (!global.prismaEnzymes) {
//     global.prismaEnzymes = new PrismaClient();
//   }
//   prismaEnzymes = global.prismaEnzymes;
// }

// export default prismaEnzymes;