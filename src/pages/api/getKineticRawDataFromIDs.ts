// used in single variant submission process, when the user is going to select the kinetic assay WT 
import { getClient } from "../../functions/database_functions";

export default async function handler(req:any, res:any) {
  const { enzyme, ids } = req.body; 
	if (enzyme == '') {
		return res.status(400).json({ error: "Enzyme is required." });
	}
	const client = getClient(enzyme);
	if (!client) {
		return res.status(400).json({ error: "Enzyme does not have a database." });
	}

  try {
    const data = await client.kineticRawData.findMany({
      where: {
        id: {
          in: ids.map((id:any) => parseInt(id)),
        },
      },
    });

    if (data) {
      res.status(200).json(data);
    } else {
      res.status(404).json({ error: 'No matching kinetic raw data found' });
    }
  } catch (error) {
    console.error('Request error', error);
    res.status(500).json({ error: 'Error fetching kinetic raw data' });
  }
}