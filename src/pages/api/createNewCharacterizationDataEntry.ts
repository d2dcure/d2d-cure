import { getClient } from "../../functions/database_functions";

export default async function handler(req:any, res:any) {
  const { enzyme, username, institution, pi, resid, resnum, resmut } = req.body;

  try {
	if (enzyme == '') {
		return res.status(400).json({ error: "Enzyme is required." });
	}
	// Get proper database client.
	const client = getClient(enzyme);
	if (!client) {
		return res.status(400).json({ error: "Enzyme does not have a database." });
	}

    const newDataEntry = await client.characterizationData.create({
      data: {
        resid,
        resnum: parseInt(resnum),
        resmut,
        creator: username,
        institution,
        pi,
        // Initialize other fields to null or their default values
      },
    });

    res.status(200).json(newDataEntry);
  } catch (error) {
    console.error('Request error', error);
    res.status(500).json({ error: 'Error creating new characterization data entry' });
  }
}