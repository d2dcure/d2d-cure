import prismaBglB from "../../../prismaBglBClient";

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    try {
      const oligos = await prismaBglB.oligos.findMany();
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