import { NextApiRequest, NextApiResponse } from 'next';
import prismaProteins from '../../../prismaProteinsClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { parent_id, yield_value, yield_units } = req.body;

    if (parent_id === undefined || yield_value === undefined || yield_units === undefined) {
      return res.status(400).json({ error: 'parent_id, yield_value, and yield_units are required' });
    }

    try {
      const parentId = parseInt(parent_id);
      const mapped_yield_units = yield_units;

      // Check if a KineticRawData entry exists for the parent_id
      let kineticRawData = await prismaProteins.kineticRawData.findFirst({
        where: { parent_id: parentId },
      });

      if (kineticRawData) {
        // Update existing row
        kineticRawData = await prismaProteins.kineticRawData.update({
          where: { id: kineticRawData.id },
          data: {
            yield: yield_value,
            yield_units: mapped_yield_units,
          },
        });
      } else {
        // Create new row
        kineticRawData = await prismaProteins.kineticRawData.create({
          data: {
            parent_id: parentId,
            yield: yield_value,
            yield_units: mapped_yield_units,
            // Provide default values for required fields
            user_name: 'unknown',
            variant: '',
            slope_units: 'min_1min_Kin', // Default value
            dilution: 0,
            substrate_dilution: 3, // Default value
            purification_date: '',
            assay_date: '',
            csv_filename: '',
            plot_filename: '',
            approved_by_student: false,
          },
        });
      }

      res.status(200).json({ message: 'Yield updated successfully', kineticRawData });
    } catch (error: any) {
      console.error('Error updating yield:', error);
      res.status(500).json({ error: 'Failed to update yield', details: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
