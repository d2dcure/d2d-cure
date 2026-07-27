import { getClient } from "../../functions/database_functions";

export default async function handler(req:any, res:any) {
  const { enzyme, id } = req.query; 
	if (enzyme == '') {
		return res.status(400).json({ error: "Enzyme is required." });
	}
	const client = getClient(enzyme);
	if (!client) {
		return res.status(400).json({ error: "Enzyme does not have a database." });
	}
  try {
    const data = await client.characterizationData.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (data) {
      res.status(200).json(data);
    } else {
      res.status(404).json({ error: 'Characterization data not found' });
    }
  } catch (error) {
    console.error('Request error', error);
    res.status(500).json({ error: 'Error fetching characterization data entry' });
  }
}