import { getClient } from "../../functions/database_functions";

export default async function handler(req: any, res:any) {
	const { enzyme, id } = req.query;
	if (enzyme == '') {
		return res.status(400).json({ error: "Enzyme is required." });
	}
	const client = getClient(enzyme);
	if (!client) {
		return res.status(400).json({ error: "Enzyme does not have a database." });
	}

  try {
    const data = await client.kineticRawData.findUnique({
      where: {
        id: parseInt(id)
      },
      select: {
        id: true,
        user_name: true,
        plate_num: true,
        variant: true,
        cell_data: true,
        slope_units: true,
        yield: true,
        yield_units: true,
        dilution: true,
        substrate_dilution: true,
        purification_date: true,
        assay_date: true,
        csv_filename: true,
        plot_filename: true,
        updated: true,
        parent_id: true,
        approved_by_student: true
      }
    });
    res.status(200).json(data);
  } catch (error) {
    console.error('Request error', error);
    res.status(500).json({ error: 'Error fetching kineticRaw data' });
  }
}