// used in migration script only 
import prismaUsers from "../../../prismaUsersClient";

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    try {
      const page = parseInt(req.query.page || '1');
      const pageSize = parseInt(req.query.pageSize || '20');
      const skip = (page - 1) * pageSize;
      
      // Optional institution filter
      const institutionFilter = req.query.institution ? 
        { institution: req.query.institution } : {};
      
      // Add sorting parameters
      const sortField = req.query.sortField || 'id';
      const sortDirection = req.query.sortDirection || 'asc';
      
      const users = await prismaUsers.users.findMany({
        where: institutionFilter,
        skip,
        take: pageSize,
        orderBy: {
          [sortField]: sortDirection
        }
      });
      
      const totalUsers = await prismaUsers.users.count({ where: institutionFilter });
      
      res.status(200).json({
        users,
        pagination: {
          total: totalUsers,
          pages: Math.ceil(totalUsers / pageSize),
          currentPage: page,
          pageSize
        }
      });
    } catch (error) {
      console.error('Request error', error);
      res.status(500).json({ error: 'Error fetching users' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}