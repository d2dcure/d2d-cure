import prismaProteins from "../../../prismaProteinsClient";

export default async function handler(req:any, res:any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { id, comment } = req.body;

  try {
    const updatedEntry = await prismaProteins.characterizationData.update({
      where: { id: parseInt(id) },
      data: { comments: comment },
    });

    res.status(200).json(updatedEntry);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
}
