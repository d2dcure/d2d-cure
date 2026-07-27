import { getClient } from "../../functions/database_functions";

export default async function handler(req: any, res: any) {
  try {
    // Get enzyme abbr and array of IDs from request body.
    const { enzyme, ids } = req.body;
	if (enzyme == '') {
		return res.status(400).json({ error: "Enzyme is required." });
	}
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'Missing or invalid IDs array' });
    }

	// Get proper database client.
	const client = getClient(enzyme);
	if (!client) {
		return res.status(400).json({ error: "Enzyme does not have a database." });
	}
    
    // Fetch KineticRawData and TempRawData in parallel
    const [kineticData, tempData] = await Promise.all([
      client.kineticRawData.findMany({
        where: {
          parent_id: { in: ids }
        },
        select: {
          parent_id: true,
          id: true,
          updated: true,
          variant: true,
          approved_by_student: true
        }
      }),
      client.tempRawData.findMany({
        where: {
          parent_id: { in: ids }
        },
        select: {
          parent_id: true,
          id: true,
          updated: true,
          variant: true,
          approved_by_student: true
        }
      })
    ]);
    
    // Create a map to organize the data by parent_id
    const result = ids.reduce((acc, id) => {
      acc[id] = {
        id,
        kineticData: kineticData.filter(k => k.parent_id === id),
        tempData: tempData.filter(t => t.parent_id === id)
      };
      return acc;
    }, {});
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Request error', error);
    res.status(500).json({ error: 'Error fetching related data' });
  }
} 