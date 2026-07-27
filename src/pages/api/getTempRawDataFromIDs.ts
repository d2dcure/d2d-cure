// used in single variant submission process, when the user is going to select the temp assay WT 
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
    const data = await client.tempRawData.findMany({
      where: {
        id: {
          in: ids.map((id:any) => parseInt(id)),
        },
      },
      select: {
        id: true,
        user_name: true,
        // slope_units is not included in the select. Something's wrong with the enum defined in the schema 
		// TODO: Fix this!
        assay_date: true,
        cell_data: true,
      }
    });

    if (data) {
      res.status(200).json(data);
    } else {
      res.status(404).json({ error: 'No matching temp raw data found' });
    }
  } catch (error) {
    console.error('Request error', error);
    res.status(500).json({ error: 'Error fetching temp raw data' });
  }
}