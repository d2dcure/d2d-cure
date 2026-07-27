import { NextApiRequest, NextApiResponse } from 'next';
import { getClient } from "../../functions/database_functions";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { enzyme, id, tm_mean, tm_std_dev } = req.body;
	if (enzyme == '') {
		return res.status(400).json({ error: "Enzyme is required." });
	}
	const client = getClient(enzyme);
	if (!client) {
		return res.status(400).json({ error: "Enzyme does not have a database." });
	}
    if (!id || tm_mean === undefined || tm_std_dev === undefined) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
      // Update the CharacterizationData table row with the new Tm and Tm_SD values
      const updatedEntry = await client.characterizationData.update({
        where: { id },
        data: {
          Tm: parseFloat(tm_mean), // Ensure these are stored as numbers
          Tm_SD: parseFloat(tm_std_dev),
        },
      });

      res.status(200).json(updatedEntry);
    } catch (error) {
      console.error('Failed to update melting point values:', error);
      res.status(500).json({ error: 'Failed to update melting point values', details: error });
    }
  } else {
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
