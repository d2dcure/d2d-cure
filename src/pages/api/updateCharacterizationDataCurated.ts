import { getClient } from "../../functions/database_functions";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { enzyme, id, curated } = req.body;
	if (enzyme == '') {
		return res.status(400).json({ error: "Enzyme is required." });
	}
	const client = getClient(enzyme);
	if (!client) {
		return res.status(400).json({ error: "Enzyme does not have a database." });
	}

  try {
    const updatedEntry = await client.characterizationData.update({
      where: { id: parseInt(id) },
      data: { curated }
    });

    res.status(200).json(updatedEntry);
  } catch (error) {
    console.error('Request error', error);
    res.status(500).json({ error: 'Error updating curated status' });
  }
} 