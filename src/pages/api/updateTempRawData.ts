import prismaProteins from "../../../prismaProteinsClient";

function mapSlopeUnits(value:any) {
  switch (value.trim()) {
    case "(1/min)":
      return "min_1min_Temp";
    case "(1/s)":
      return "s_1s_Temp";
    case "(10^-3/min)":
      return "min_3min_Temp";
    case "(10^-3/s)":
      return "s_3s_Temp";
    default:
      throw new Error(`Invalid slope_units value: ${value}`);
  }
}

export default async function handler(req:any, res:any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const {
    user_name, 
    variant, 
    slope_units,
    purification_date,
    assay_date,
    csv_filename,
    plot_filename,
    parent_id,
  } = req.body;

  try {
    const mapped_slope_units = mapSlopeUnits(slope_units); // Map to enum value

    // Check if there's already a row with this parent_id
    let tempRawData = await prismaProteins.tempRawData.findFirst({
      where: { parent_id },
    });

    if (tempRawData) {
      // Update existing row
      tempRawData = await prismaProteins.tempRawData.update({
        where: { id: tempRawData.id },
        data: {
          user_name, 
          variant, 
          slope_units: mapped_slope_units,
          purification_date,
          assay_date,
          csv_filename,
          plot_filename,
        },
      });
    } else {
      // Create new row
      tempRawData = await prismaProteins.tempRawData.create({
        data: {
          user_name, 
          variant, 
          slope_units: mapped_slope_units,
          purification_date,
          assay_date,
          csv_filename,
          plot_filename,
          parent_id,
        },
      });
    }

    res.status(200).json({ message: 'TempRawData updated successfully' });
  } catch (error) {
    console.error('Error updating TempRawData:', error);
    res.status(500).json({ error: 'Failed to update TempRawData', details: error });
  }
}
