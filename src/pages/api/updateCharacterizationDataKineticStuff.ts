import prismaProteins from "../../../prismaProteinsClient";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const {
    parent_id,
    kcat,
    kcat_SD,
    KM,
    KM_SD,
    kcat_over_KM,
    kcat_over_KM_SD,
    raw_data_id,
    yield: yield_value,
  } = req.body;

  try {
    const updatedCharacterizationData = await prismaProteins.characterizationData.update({
      where: { id: parent_id },
      data: {
        yield_avg: yield_value,
        KM_avg: KM,
        KM_SD: KM_SD,
        kcat_avg: kcat,
        kcat_SD: kcat_SD,
        kcat_over_KM: kcat_over_KM,
        kcat_over_KM_SD: kcat_over_KM_SD,
        raw_data_id: raw_data_id,
      },
    });

    res.status(200).json({ message: 'CharacterizationData updated successfully' });
  } catch (error) {
    console.error('Error updating CharacterizationData:', error);
    res.status(500).json({ error: 'Failed to update CharacterizationData', details: error });
  }
}
