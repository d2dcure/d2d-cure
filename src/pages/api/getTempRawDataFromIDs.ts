// used in single variant submission process, when the user is going to select the temp assay WT 
import prismaProteins from "../../../prismaProteinsClient";

export default async function handler(req:any, res:any) {
  const { ids } = req.body; 

  try {
    const data = await prismaProteins.tempRawData.findMany({
      where: {
        id: {
          in: ids.map((id:any) => parseInt(id)),
        },
      },
      select: {
        id: true,
        user_name: true,
        // slope_units is not included in the select. Something's wrong with the enum defined in the schema 
        assay_date: true,
        cell_data: true,
        plot_filename: true,
      }
    });

    if (data) {
      res.status(200).json(data);
    } else {
      res.status(404).json({ error: 'No matching temp raw data found' });
    }
  } catch (error) {
    console.error('Request error', error);
    res.status(500).json({ error: 'Error fetching temp raw data' });
  }
}