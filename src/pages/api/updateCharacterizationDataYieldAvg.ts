import prismaProteins from "../../../prismaProteinsClient";

export default async function handler(req: any, res: any) {
  if (req.method === 'POST') {
    const { id, yield_avg } = req.body;
    try {
      // Ensure yield_avg is a valid number before updating
      if (isNaN(yield_avg)) {
        return res.status(400).json({ error: "Invalid yield average value" });
      }

      const updatedEntry = await prismaProteins.characterizationData.update({
        where: { id },
        data: { yield_avg: yield_avg },
      });

      res.status(200).json(updatedEntry);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update entry', details: error });
    }
  } else {
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
