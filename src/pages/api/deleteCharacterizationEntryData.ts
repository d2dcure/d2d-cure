import prismaProteins from "../../../prismaProteinsClient";

export default async function handler(req: any, res: any) {
  if (req.method === 'DELETE') {
    const { id } = req.body;
    const numericId = parseInt(id, 10);

    try {
      // First, delete any associated KineticRawData entries
      await prismaProteins.kineticRawData.deleteMany({
        where: {
          parent_id: numericId
        }
      });

      // Then, delete any associated TempRawData entries
      await prismaProteins.tempRawData.deleteMany({
        where: {
          parent_id: numericId
        }
      });

      // Finally, delete the CharacterizationData entry itself
      const deletedEntry = await prismaProteins.characterizationData.delete({
        where: {
          id: numericId
        }
      });

      res.status(200).json(deletedEntry);
    } catch (error) {
      console.error('Error deleting characterization data:', error);
      res.status(500).json({ 
        error: 'Failed to delete characterization data entry', 
        details: error 
      });
    }
  } else {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
