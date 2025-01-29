import prismaProteins from "../../../prismaProteinsClient";

export default async function handler(req: any, res: any) {
  const { ids, status } = req.body;

  // ids should be an array of integers
  if (!ids || !Array.isArray(ids)) {
    console.log(ids)
    console.log("Failed, ids aren't valid");
    return res.status(400).json({ error: 'Invalid input: provide an array of IDs.' });
  }

  try {
    const integerIds = ids.map(id => parseInt(id, 10))
    if (req.method === 'DELETE') {
      // First get the associated data IDs
      const rowsToDelete = await prismaProteins.characterizationData.findMany({
        where: {
          id: { in: integerIds }
        },
        select: {
          id: true
        }
      });

      // Delete in sequence to maintain referential integrity
      for (const row of rowsToDelete) {
        // Delete associated kinetic data
        await prismaProteins.kineticRawData.deleteMany({
          where: {
            parent_id: row.id
          }
        });

        // Delete associated temperature data
        await prismaProteins.tempRawData.deleteMany({
          where: {
            parent_id: row.id
          }
        });

        // Delete the characterization data
        await prismaProteins.characterizationData.delete({
          where: { id: row.id }
        });
      }

      res.status(200).json({ message: 'Records and associated data deleted successfully' });
    } else if (req.method === 'PUT') {
      let data;
      if (status === "ADMIN") {
        data = {
          curated: true
        }
      } else {    // status === "Professor"
        data = {
          approved_by_pi: true
        }
      }
      await prismaProteins.characterizationData.updateMany({
        where: {
          id: { in: integerIds }
        },
        data: data
      });
      res.status(200).json({ message: 'Records updated successfully' });
    } else {
      res.setHeader('Allow', ['DELETE', 'PUT']);
      res.status(405).json({ error: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Request error', error);
    res.status(500).json({ error: 'Error processing your request' });
  }
}
