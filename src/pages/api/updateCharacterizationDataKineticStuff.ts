import { getClient } from "../../functions/database_functions";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const {
	enzyme: enzyme,
    parent_id,
    kcat,
    kcat_SD,
    KM,
    KM_SD,
    kcat_over_KM,
    kcat_over_KM_SD,
    raw_data_id,
  } = req.body;

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
        KM_avg: KM,
        KM_SD: KM_SD,
        kcat_avg: kcat,
        kcat_SD: kcat_SD,
        kcat_over_KM: kcat_over_KM,
        kcat_over_KM_SD: kcat_over_KM_SD,
        raw_data_id: raw_data_id,
      },
    });

    res.status(200).json(updatedCharacterizationData);
  } catch (error) {
    console.error('Error updating CharacterizationData:', error);
    res.status(500).json({ error: 'Failed to update CharacterizationData', details: error });
  }
}
