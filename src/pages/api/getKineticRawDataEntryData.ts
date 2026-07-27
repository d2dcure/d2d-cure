import { getClient } from "../../functions/database_functions";

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { enzyme, parent_id } = req.query;
  if (enzyme == '') {
		return res.status(400).json({ error: "Enzyme is required." });
	}
	const client = getClient(enzyme);
	if (!client) {
		return res.status(400).json({ error: "Enzyme does not have a database." });
	}
  if (!parent_id) {
    return res.status(400).json({ error: 'parent_id is required' });
  }

  try {
    const kineticRawDataEntry = await client.kineticRawData.findFirst({
      where: { 
        parent_id: parseInt(parent_id),
        slope_units: {
          in: ['min_1min_Kin', 's_1s_Kin', 'min_3min_Kin', 's_10s_Kin']
        }
      },
    });

    if (!kineticRawDataEntry) {
      return res.status(404).json({ error: 'No data found for the given parent_id' });
    }

    res.status(200).json(kineticRawDataEntry);
  } catch (error) {
    console.error('Error fetching KineticRawData entry:', error);
    res.status(500).json({ error: 'Failed to fetch data', details: error });
  }
}
