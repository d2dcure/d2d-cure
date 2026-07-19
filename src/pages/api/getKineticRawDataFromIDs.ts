// used in single variant submission process, when the user is going to select the kinetic assay WT 
import prismaBglB from "../../../prismaBglBClient";

export default async function handler(req:any, res:any) {
  const { ids } = req.body; 

  try {
    const data = await prismaBglB.kineticRawData.findMany({
      where: {
        id: {
          in: ids.map((id:any) => parseInt(id)),
        },
      },
    });

    if (data) {
      res.status(200).json(data);
    } else {
      res.status(404).json({ error: 'No matching kinetic raw data found' });
    }
  } catch (error) {
    console.error('Request error', error);
    res.status(500).json({ error: 'Error fetching kinetic raw data' });
  }
}