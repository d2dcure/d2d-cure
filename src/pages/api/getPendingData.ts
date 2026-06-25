import prismaBglB from "../../../prismaBglBClient";

export default async function handler(req: any, res: any) {
  try {
    const characterizationData = await prismaBglB.characterizationData.findMany({
      where: {
        curated: false
      }
    });

    // Fetch KineticRawData for each raw_data_id directly
    const combinedData = await Promise.all(characterizationData.map(async (data:any) => {
      const kineticRawData = await prismaBglB.kineticRawData.findUnique({
        where: { id: data.raw_data_id },
        select: {
          user_name: true,
          purification_date: true,
          assay_date: true,
          approved_by_student: true
        }
      });

      const tempRawData = await prismaBglB.tempRawData.findUnique({
        where: { id: data.temp_raw_data_id },
        select: {
          user_name: true,
          plate_num: true,
          purification_date: true,
          assay_date: true,
          approved_by_student: true
        }
      })

      return {
        ...data,
        kineticRawData: kineticRawData,
        tempRawData: tempRawData
      };
    }));

    res.status(200).json(combinedData);
  } catch (error) {
    console.error('Request error', error);
    res.status(500).json({ error: 'Error fetching characterization data' });
  }
}