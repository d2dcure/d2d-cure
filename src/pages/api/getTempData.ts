import prismaProteins from "../../../prismaProteinsClient";

export default async function handler(req: any, res:any) {
  try {
    const data = await prismaProteins.tempRawData.findUnique({
      where: {
        id: parseInt(req.query.id)
      },
      select: {
        id: true,
        user_name: true,
        plate_num: true,
        variant: true,
        temp_values: true,
        cell_data: true,
        slope_units: true,
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
    res.status(500).json({ error: 'Error fetching tempRaw data' });
  }
}