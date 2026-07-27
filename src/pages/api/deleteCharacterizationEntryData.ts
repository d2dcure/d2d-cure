import { getClient } from "../../functions/database_functions";

export default async function handler(req: any, res: any) {
  if (req.method === 'DELETE') {
    const { enzyme, id } = req.body;
	if (enzyme == '') {
		return res.status(400).json({ error: "Enzyme is required." });
	}
	const client = getClient(enzyme);
	if (!client) {
		return res.status(400).json({ error: "Enzyme does not have a database." });
	}
    const numericId = parseInt(id, 10);

    try {
      // First, delete any associated KineticRawData entries
      await client.kineticRawData.deleteMany({
        where: {
          parent_id: numericId
        }
      });

      // Then, delete any associated TempRawData entries
      await client.tempRawData.deleteMany({
        where: {
          parent_id: numericId
        }
      });

      // Finally, delete the CharacterizationData entry itself
      const deletedEntry = await client.characterizationData.delete({
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
