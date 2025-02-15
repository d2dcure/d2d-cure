import prismaProteins from "../../../prismaProteinsClient";

export default async function handler(req: any, res: any) {
    if (req.method === 'GET') {
        try {
            const data = await prismaProteins.sequence.findMany({
                orderBy: {
                    id: 'asc'
                }
            });
            res.status(200).json(data);
        } catch (error) {
            console.error('Request error', error);
            res.status(500).json({ error: 'Error fetching sequence data' });
        }
    } else {
        // Handles any requests that aren't GET
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
