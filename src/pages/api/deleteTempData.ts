import prismaProteins from "../../../prismaProteinsClient";

export default async function handler(req: any, res: any) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { parent_id } = req.body;

  try {
    // Delete the row with matching parent_id
    await prismaProteins.tempRawData.deleteMany({
      where: {
        parent_id: parent_id,
      },
    });

    res.status(200).json({ message: 'Temp data deleted successfully' });
  } catch (error) {
    console.error('Error deleting temp data:', error);
    res.status(500).json({ error: 'Failed to delete temp data' });
  }
} 