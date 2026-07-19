import prismaBglB from "../../../prismaBglBClient";
import prismaAbcD from "../../../prismaAbcDClient";

// Look up and retrieve the Prisma client for the proper database.
const getClient = (enzyme: string) => {
	switch (enzyme) {
		case "AbcD":
			return prismaAbcD;
		case "BglB":
			return prismaBglB;
		default:
			return prismaBglB;
	}
};

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
	const { enzyme } = req.query;  // Expect the enzyme name from query params.
	if (!enzyme) {
		return res.status(400).json({ error: "Enzyme is required." });
	}
	const client = getClient(enzyme);
	try {
      //const oligos = await prismaBglB.oligos.findMany();
	  const oligos = await client.oligos.findMany();
      res.status(200).json(oligos);
    } catch (error) {
      console.error('Request error', error);
      res.status(500).json({ error: 'Error fetching oligos' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}