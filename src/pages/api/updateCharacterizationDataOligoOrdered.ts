import prismaBglB from "../../../prismaBglBClient";

export default async function handler(req:any, res:any) {
  if (req.method === 'POST') {
    const { id, oligo_ordered } = req.body;
    try {
      const updatedEntry = await prismaBglB.characterizationData.update({
        where: { id },
        data: { oligo_ordered: oligo_ordered }
      });
      res.status(200).json(updatedEntry);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update entry', details: error });
    }
  } else {
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}