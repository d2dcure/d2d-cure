import { NextApiRequest, NextApiResponse } from 'next';
import { getClient } from "../../functions/database_functions";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { enzyme, id, gel_filename } = req.body;
	if (enzyme == '') {
		return res.status(400).json({ error: "Enzyme is required." });
	}
	const client = getClient(enzyme);
	if (!client) {
		return res.status(400).json({ error: "Enzyme does not have a database." });
	}

    try {
      // Update the gel_filename in CharacterizationData table
      const updatedEntry = await client.characterizationData.update({
        where: { id },
        data: {
          gel_filename,
        },
      });

      res.status(200).json(updatedEntry);
    } catch (error) {
      console.error('Failed to update gel filename:', error);
      res.status(500).json({ error: 'Failed to update gel filename', details: error });
    }
  } else {
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
