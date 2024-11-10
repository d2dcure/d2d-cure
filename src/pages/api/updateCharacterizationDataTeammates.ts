import prismaProteins from "../../../prismaProteinsClient";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { id, teammate, teammate2, teammate3 } = req.body;

  try {
    const updatedCharacterizationData = await prismaProteins.characterizationData.update({
      where: { id },
      data: {
        teammate: teammate || null,
        teammate2: teammate2 || null,
        teammate3: teammate3 || null,
      },
    });

    res.status(200).json(updatedCharacterizationData);
  } catch (error) {
    console.error('Error updating teammates in CharacterizationData:', error);
    res.status(500).json({ error: 'Failed to update teammates', details: error });
  }
}
