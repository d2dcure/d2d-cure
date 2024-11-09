import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
import re
import pandas as pd
import base64
from numpy import sqrt, diag, linspace, inf
from scipy.optimize import curve_fit

# Turn debug mode on or off
debug_mode = False

# Functions to fit and/or plot
def kobs_f(S, kcat, KM):
    '''The Michaelis-Menten-like equation.'''
    return (kcat * S) / (KM + S)

def high_KM_kobs_f(S, kcat_over_KM):
    '''The linear equation for systems where KM is very large.'''
    return kcat_over_KM * S

def inv_v(inv_S, inv_vmax, KM):
    '''The Lineweaver-Burk plot equation'''
    return KM * inv_vmax * inv_S + inv_vmax

# Main function for Vercel to call
def lambda_handler(request):
    try:
        # Extract variant name and file
        variant_name = request.form['variant-name']

        if 'file' not in request.files:
            return {"statusCode": 400, "body": {"error": "No file part"}}

        file = request.files['file']
        if file.filename == '':
            return {"statusCode": 400, "body": {"error": "No selected file"}}

        # Read the CSV file into a DataFrame
        df = pd.read_csv(file, header=None, encoding='iso-8859-1')

        # Extract data
        string_of_data = ",".join([f"{float(x):.5E}" if pd.notnull(x) else '' for x in df.iloc[4:12, 2:5].values.flatten()])

        cleaned_value = re.sub(r'[^\x00-\x7F]+', '', str(df.iloc[2, 6])).strip()
        yield_ = cleaned_value
        dil_factor = df.iloc[2, 7]
        instrument_units = df.iloc[1, 4]
        yield_units = df.iloc[1, 6]
        slope_u = instrument_units
        yld = float(yield_)
        yld_u = yield_units.strip()
        dil = float(dil_factor)

        # Constant values for calculations
        epsilon_enz = 113330
        epsilon_byprod = 10660
        molar_mass_enz = 51395.85
        assay_cell_length = 0.572
        A280_cell_length = 1
        assay_vol = 0.0001
        enz_vol = 0.000025

        # Substrate concentrations
        c_substrate = [
            75.000, 75.000, 75.000,
            25.000, 25.000, 25.000,
            8.333,  8.333,  8.333,
            2.778,  2.778,  2.778,
            0.926,  0.926,  0.926,
            0.309,  0.309,  0.309,
            0.103,  0.103,  0.103,
            0.000,  0.000,  0.000
        ]  # millimolar

        # Parse slopes
        empty_cells = []
        slopes = []
        for i, slope in enumerate(string_of_data.split(',')):
            if slope == '':
                empty_cells.append(i)
            else:
                slopes.append(float(slope))

        # Remove empty cells from substrate concentrations
        c_substrate = [c_substrate[i] for i in range(len(c_substrate)) if i not in empty_cells]

        # Convert slopes to correct units
        if '10^-3' in slope_u:
            slopes = [slope / 1000 for slope in slopes]
        if slope_u.endswith('/s)'):
            slopes = [slope * 60 for slope in slopes]

        # Convert yield into common units
        diluted_yld = yld / dil
        c_enz_molar = diluted_yld / molar_mass_enz if yld_u == '(mg/mL)' else diluted_yld / 1000
        rates = [slope / (epsilon_byprod * assay_cell_length) for slope in slopes]
        kobs = [(rate * assay_vol) / (c_enz_molar * enz_vol) for rate in rates]

        # Curve fitting
        initial_guesses = (max(kobs), 3)
        try:
            popt, pcov = curve_fit(kobs_f, c_substrate, kobs, p0=initial_guesses, bounds=(0, inf))
            pSD = sqrt(diag(pcov))
            kcat, KM = popt[0], popt[1]
            kcat_SD, KM_SD = pSD[0], pSD[1]
            kcat_over_KM = kcat / KM
            kcat_over_KM_SD = kcat_over_KM * sqrt((kcat_SD / kcat) ** 2 + (KM_SD / KM) ** 2)
            vmax = kcat * c_enz_molar * 1000
        except RuntimeError:
            return {"statusCode": 400, "body": {"error": "Error in curve fitting"}}

        # Check for high KM
        high_KM = KM > 75
        if high_KM:
            popt, _ = curve_fit(high_KM_kobs_f, c_substrate, kobs, p0=[kcat_over_KM], bounds=(0, inf))
            kcat_over_KM, kcat_over_KM_SD = popt[0], pSD[0]

        # Generate Michaelis-Menten or linear fit plot
        buf1 = io.BytesIO()
        plt.figure(figsize=(5, 5))
        fakex = linspace(0, max(c_substrate) * 1.1, 100)
        plt.plot(fakex, high_KM_kobs_f(fakex, kcat_over_KM) if high_KM else kobs_f(fakex, kcat, KM), 'k-')
        plt.plot(c_substrate, kobs, 'bo')
        plt.title(variant_name, fontsize=20)
        plt.xlabel('[S] (mM)', fontsize=16)
        plt.ylabel(r'$\mathit{k}_\mathrm{obs}$ (min$^{-1}$)', fontsize=16)
        plt.savefig(buf1, format='png', bbox_inches='tight')
        buf1.seek(0)
        image1_base64 = base64.b64encode(buf1.read()).decode('utf-8')
        buf1.close()

        # Generate Lineweaver-Burk plot
        buf2 = io.BytesIO()
        inv_s, inv_rates = [1 / s for s in c_substrate if s > 0], [1 / r for r in rates if r > 0]
        fakex = linspace(-max(inv_s) / 7, max(inv_s), 100)
        plt.figure(figsize=(5, 5))
        plt.plot(fakex, inv_v(fakex, 1 / vmax, KM), 'k--') if not high_KM else plt.plot([], [], 'k:')
        plt.plot(inv_s, inv_rates, 'bo')
        plt.title(variant_name + ' Lineweaver-Burk Plot', fontsize=20)
        plt.savefig(buf2, format='png', bbox_inches='tight')
        buf2.seek(0)
        image2_base64 = base64.b64encode(buf2.read()).decode('utf-8')
        buf2.close()

        response_data = {
            'menten_plot': image1_base64,
            'lineweaver_plot': image2_base64,
            'kcat': kcat if not high_KM else None,
            'kcat_SD': kcat_SD if not high_KM else None,
            'KM': KM if not high_KM else None,
            'KM_SD': KM_SD if not high_KM else None,
            'kcat_over_KM': kcat_over_KM,
            'kcat_over_KM_SD': kcat_over_KM_SD,
        }

        return {"statusCode": 200, "body": response_data}

    except Exception as e:
        return {"statusCode": 500, "body": {"error": str(e)}}
