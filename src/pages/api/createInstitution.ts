import prismaUsers from "../../../prismaUsersClient";

export default async function handler(req: any, res: any) {
  if (req.method === 'POST') {
    const {
      fullname,
      abbr,
      state,
      country_code,
      url
    } = req.body;
    
    try {
      const newInstitution = await prismaUsers.institutions.create({
        data: {
          fullname,
          abbr,
          state: state || null,
          country_code: country_code || "USA",
          url: url || null
        }
      });
      
      res.status(200).json(newInstitution);
    } catch (error) {
      console.error('Request error', error);
      res.status(500).json({ error, message: "Failed to create institution" });
    }
  } else {
    // Handle any other HTTP method
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 