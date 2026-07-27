import { getClient } from "../../functions/database_functions";

export default async function handler(req:any, res:any) {
  if (req.method === 'POST') {
    const { enzyme, id } = req.body;
	if (enzyme == '') {
		return res.status(400).json({ error: "Enzyme is required." });
	}
	const client = getClient(enzyme);
	if (!client) {
		return res.status(400).json({ error: "Enzyme does not have a database." });
	}
    const parsedId = parseInt(id, 10); // Convert id to an integer

    if (isNaN(parsedId)) {
      return res.status(400).json({ error: "Invalid ID format. ID should be an integer." });
    }

    console.log("Received request to submit for curation with ID:", parsedId); // Log for debugging

    try {
      const updatedEntry = await client.characterizationData.update({
        where: { id: parsedId },
        data: { 
          submitted_for_curation: true,
          submitted_date: new Date()
        },
      });

      console.log("Updated entry:", updatedEntry); // Log the updated entry for debugging
      res.status(200).json(updatedEntry);
    } catch (error) {
      console.error("Error updating entry:", error); // Log error details
      res.status(500).json({ error: 'Failed to update entry', details: error });
    }
  } else {
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
