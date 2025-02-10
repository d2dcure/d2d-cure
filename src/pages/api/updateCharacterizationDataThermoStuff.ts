import prismaProteins from "../../../prismaProteinsClient";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { parent_id, T50, T50_SD, T50_k, T50_k_SD, temp_raw_data_id } = req.body;

  try {
    const updatedCharacterizationData = await prismaProteins.characterizationData.update({
      where: { id: parent_id },
      data: {
        T50: T50,
        T50_SD: T50_SD,
        T50_k: T50_k,
        T50_k_SD: T50_k_SD,
        temp_raw_data_id: temp_raw_data_id,
      },
    });

    res.status(200).json(updatedCharacterizationData); 
  } catch (error) {
    console.error('Error updating CharacterizationData:', error);
    res.status(500).json({ error: 'Failed to update CharacterizationData', details: error });
  }
}
