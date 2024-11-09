import { NextApiRequest, NextApiResponse } from 'next';
import prismaProteins from '../../../prismaProteinsClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { id, tm_mean, tm_std_dev } = req.body;

    if (!id || tm_mean === undefined || tm_std_dev === undefined) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
      // Update the CharacterizationData table row with the new Tm and Tm_SD values
      const updatedEntry = await prismaProteins.characterizationData.update({
        where: { id },
        data: {
          Tm: parseFloat(tm_mean), // Ensure these are stored as numbers
          Tm_SD: parseFloat(tm_std_dev),
        },
      });

      res.status(200).json({ message: 'Melting point values updated successfully', updatedEntry });
    } catch (error) {
      console.error('Failed to update melting point values:', error);
      res.status(500).json({ error: 'Failed to update melting point values', details: error });
    }
  } else {
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
