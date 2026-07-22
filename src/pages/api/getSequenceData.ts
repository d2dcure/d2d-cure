import { getClient } from "../../functions/database_functions";

export default async function handler(req: any, res: any) {
    if (req.method === 'GET') {
		const enzyme = (req.query.enzyme as string) || '';
		if (enzyme == '') {
			return res.status(400).json({ error: "Enzyme is required." });
		}
		const client = getClient(enzyme);
        try {
            const data = await client.sequence.findMany({
                orderBy: {id: 'asc'}
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
