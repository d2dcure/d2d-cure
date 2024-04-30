import prismaEnzymes from "../../../prismaEnzymesClient";

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    try {
      const enzymes = await prismaEnzymes.generalInfo.findMany();
      res.status(200).json(enzymes);
    } catch (error) {
      console.error('Request error', error);
      res.status(500).json({ error: 'Error fetching enzymes' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}