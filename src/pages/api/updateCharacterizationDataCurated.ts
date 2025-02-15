import prismaProteins from "../../../prismaProteinsClient";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, curated } = req.body;

  try {
    const updatedEntry = await prismaProteins.characterizationData.update({
      where: { id: parseInt(id) },
      data: { curated }
    });

    res.status(200).json(updatedEntry);
  } catch (error) {
    console.error('Request error', error);
    res.status(500).json({ error: 'Error updating curated status' });
  }
} 