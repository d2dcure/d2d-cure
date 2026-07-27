import { getClient } from "../../functions/database_functions";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { enzyme, parent_id, T50, T50_SD, T50_k, T50_k_SD, temp_raw_data_id } = req.body;
	if (enzyme == '') {
		return res.status(400).json({ error: "Enzyme is required." });
	}
	const client = getClient(enzyme);
	if (!client) {
		return res.status(400).json({ error: "Enzyme does not have a database." });
	}
  try {
    const updatedCharacterizationData = await client.characterizationData.update({
      where: { id: parent_id },
      data: {
        T50: T50,
        T50_SD: T50_SD,
        T50_k: T50_k,
        T50_k_SD: T50_k_SD,
        temp_raw_data_id: temp_raw_data_id,
      },
    });

    res.status(200).json(updatedCharacterizationData); 
  } catch (error) {
    console.error('Error updating CharacterizationData:', error);
    res.status(500).json({ error: 'Failed to update CharacterizationData', details: error });
  }
}
