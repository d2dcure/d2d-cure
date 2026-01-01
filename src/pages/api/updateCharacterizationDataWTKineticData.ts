import prismaProteins from "../../../prismaProteinsClient";

export default async function handler(req:any, res:any) {
  if (req.method === 'POST') {
    const { id, WT_raw_data_id, WT_KM, WT_kcat, WT_kcat_over_KM } = req.body;
    try {
      const updatedEntry = await prismaProteins.characterizationData.update({
        where: { id },
        data: { 
          WT_raw_data_id: WT_raw_data_id || null,
          KM_ref: WT_KM || null,
          kcat_ref: WT_kcat || null,
          kcat_over_KM_ref: WT_kcat_over_KM || null
        }
      });
      res.status(200).json(updatedEntry);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update entry', details: error });
    }
  } else {
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}