import { PrismaClient } from './prisma/generated/client_proteins';

const prismaProteins = new PrismaClient();

export default prismaProteins;


// import { PrismaClient } from './prisma/generated/client_proteins'

// declare global {
//     var prismaProteins: any;
//   }

// if (process.env.NODE_ENV === 'production') {
//   prismaProteins = new PrismaClient();
// } else {
//   if (!global.prismaProteins) {
//     global.prismaProteins = new PrismaClient();
//   }
//   prismaProteins = global.prismaProteins;
// }

// export default prismaProteins;
