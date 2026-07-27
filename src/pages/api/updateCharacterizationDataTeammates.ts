import { getClient } from "../../functions/database_functions";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { enzyme, id, teammate, teammate2, teammate3 } = req.body;
	if (enzyme == '') {
		return res.status(400).json({ error: "Enzyme is required." });
	}
	const client = getClient(enzyme);
	if (!client) {
		return res.status(400).json({ error: "Enzyme does not have a database." });
	}

  try {
    const updatedCharacterizationData = await client.characterizationData.update({
      where: { id },
      data: {
        teammate: teammate || null,
        teammate2: teammate2 || null,
        teammate3: teammate3 || null,
      },
    });

    res.status(200).json(updatedCharacterizationData);
  } catch (error) {
    console.error('Error updating teammates in CharacterizationData:', error);
    res.status(500).json({ error: 'Failed to update teammates', details: error });
  }
}
