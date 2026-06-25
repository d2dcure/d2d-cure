import prismaBglB from "../../../prismaBglBClient";

export default async function handler(req:any, res:any) {
  const { username, institution, pi, resid, resnum, resmut } = req.body;

  try {
    const newDataEntry = await prismaBglB.characterizationData.create({
      data: {
        resid,
        resnum: parseInt(resnum),
        resmut,
        creator: username,
        institution,
        pi,
        // Initialize other fields to null or their default values
      },
    });

    res.status(200).json(newDataEntry);
  } catch (error) {
    console.error('Request error', error);
    res.status(500).json({ error: 'Error creating new characterization data entry' });
  }
}