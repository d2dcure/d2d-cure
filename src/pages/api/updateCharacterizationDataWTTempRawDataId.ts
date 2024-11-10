import prismaProteins from "../../../prismaProteinsClient";

export default async function handler(req:any, res:any) {
  if (req.method === 'POST') {
    const { id, WT_temp_raw_data_id } = req.body;
    try {
      const updatedEntry = await prismaProteins.characterizationData.update({
        where: { id },
        data: { WT_temp_raw_data_id: WT_temp_raw_data_id }
      });
      res.status(200).json(updatedEntry);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update entry', details: error });
    }
  } else {
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}