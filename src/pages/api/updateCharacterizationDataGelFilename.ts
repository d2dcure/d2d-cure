import { NextApiRequest, NextApiResponse } from 'next';
import prismaProteins from '../../../prismaProteinsClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { id, gel_filename } = req.body;

    try {
      // Update the gel_filename in CharacterizationData table
      const updatedEntry = await prismaProteins.characterizationData.update({
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
