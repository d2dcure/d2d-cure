import prismaBglB from "../../../prismaBglBClient";

export default async function handler(req:any, res:any) {
  const { userName } = req.query; // Expecting the user's username from query params.

  if (!userName) {
    return res.status(400).json({ error: "User name is required" });
  }

  try {
    const data = await prismaBglB.characterizationData.findMany({
      where: {
        creator: userName,
      },
    });

    res.status(200).json(data);
  } catch (error) {
    console.error('Request error', error);
    res.status(500).json({ error: 'Error fetching characterization data for user' });
  }
}
