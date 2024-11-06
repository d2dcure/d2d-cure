import prismaProteins from "../../../prismaProteinsClient";

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { parent_id } = req.query;

  if (!parent_id) {
    return res.status(400).json({ error: 'parent_id is required' });
  }

  try {
    const kineticRawDataEntry = await prismaProteins.kineticRawData.findFirst({
      where: { parent_id: parseInt(parent_id) },
    });

    if (!kineticRawDataEntry) {
      return res.status(404).json({ error: 'No data found for the given parent_id' });
    }

    res.status(200).json(kineticRawDataEntry);
  } catch (error) {
    console.error('Error fetching KineticRawData entry:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}
