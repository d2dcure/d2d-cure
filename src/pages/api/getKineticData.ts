import prismaProteins from "../../../prismaProteinsClient";

export default async function handler(req: any, res:any) {
  try {
    const data = await prismaProteins.kineticRawData.findUnique({
      where: {
        id: parseInt(req.query.id)
      },
      select: {
        cell_data:true,
        parent_id:true,
        yield:true,
        dilution:true,
        purification_date: true,
        assay_date: true,
        user_name:true,
        updated:true,
      }
    });
    res.status(200).json(data);
  } catch (error) {
    
    console.error('Request error', error);
    res.status(500).json({ error: 'Error fetching kineticRaw data' });
  }
}