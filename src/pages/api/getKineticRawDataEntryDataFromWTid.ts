import { getClient } from "../../functions/database_functions";

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { enzyme, id } = req.query;
	if (enzyme == '') {
		return res.status(400).json({ error: "Enzyme is required." });
	}
	const client = getClient(enzyme);
	if (!client) {
		return res.status(400).json({ error: "Enzyme does not have a database." });
	}

  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }

  try {
    const kineticRawDataEntry = await client.kineticRawData.findFirst({
      where: { id: parseInt(id) },
    });

    if (!kineticRawDataEntry) {
      return res.status(404).json({ error: 'No data found for the given id' });
    }

    res.status(200).json(kineticRawDataEntry);
  } catch (error) {
    console.error('Error fetching KineticRawData entry:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}
