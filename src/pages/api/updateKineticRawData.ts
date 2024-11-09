import prismaProteins from "../../../prismaProteinsClient";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const {
    user_name,
    variant,
    slope_units,
    yield: yield_value,
    yield_units,
    dilution,
    purification_date,
    assay_date,
    parent_id,
    csv_filename,
    plot_filename,
  } = req.body;

  try {
    // Map units
    const mapped_slope_units = mapSlopeUnits(slope_units);
    const mapped_yield_units = mapYieldUnits(yield_units);

    // Insert or update KineticRawData
    let kineticRawData = await prismaProteins.kineticRawData.findFirst({
      where: {
        variant,
        parent_id,
      },
    });

    if (kineticRawData) {
      // Update existing row
      kineticRawData = await prismaProteins.kineticRawData.update({
        where: { id: kineticRawData.id },
        data: {
          user_name,
          slope_units: mapped_slope_units,
          yield: yield_value,
          yield_units: mapped_yield_units,
          dilution: parseFloat(dilution),
          purification_date,
          assay_date,
          csv_filename, 
          plot_filename,
        },
      });
    } else {
      // Create new row
      kineticRawData = await prismaProteins.kineticRawData.create({
        data: {
          user_name,
          variant,
          slope_units: mapped_slope_units,
          yield: yield_value,
          yield_units: mapped_yield_units,
          dilution: parseFloat(dilution),
          purification_date,
          assay_date,
          parent_id,
          csv_filename,
          plot_filename,
        },
      });
    }

    res.status(200).json({ kineticRawDataId: kineticRawData.id });
  } catch (error:any) {
    console.error('Error saving KineticRawData:', error);
    res.status(500).json({ error: 'Failed to save KineticRawData', details: error.message });
  }
}

// Mapping functions
function mapSlopeUnits(value: string): 'min_1min_Kin' | 's_1s_Kin' | 'min_3min_Kin' | 's_10s_Kin' {
  switch (value.trim()) {
    case '(1/min)':
      return 'min_1min_Kin';
    case '(1/s)':
      return 's_1s_Kin';
    case '(10^-3/min)':
      return 'min_3min_Kin';
    case '(10^-3/s)':
      return 's_10s_Kin';
    default:
      throw new Error(`Invalid slope_units value: ${value}`);
  }
}

function mapYieldUnits(value: string): 'A280_' | 'mg_mL_' | 'mM_' | 'M_' {
  switch (value.trim()) {
    case 'A280*':
      return 'A280_';
    case '(mg/mL)':
      return 'mg_mL_';
    case '(mM)':
      return 'mM_';
    case '(M)':
      return 'M_';
    default:
      throw new Error(`Invalid yield_units value: ${value}`);
  }
}
