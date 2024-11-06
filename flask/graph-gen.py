# graph-gen.py

from flask import Flask, request, jsonify
import matplotlib
from flask_cors import CORS
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
import re
from numpy import sqrt
from numpy import diag, linspace, inf
from scipy.optimize import curve_fit
import pandas as pd
import base64

app = Flask(__name__)
CORS(app)

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

@app.route('/plotit', methods=['POST'])
def plotit():
    if debug_mode:
        with open("plot_script_log", 'a') as log_file:
            log_file.write("\nSTART LOG\n")

    variant_name = request.form['variant-name']

    if 'file' not in request.files:
        return 'No file part', 400

    file = request.files['file']
    if file.filename == '':
        return 'No selected file', 400

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

    # Constant values
    epsilon_enz = 113330  # M^-1 cm^-1 for BglB at 280 nm
    epsilon_byprod = 10660  # M^-1 cm^-1 for PNP^-1 at 420 nm
    molar_mass_enz = 51395.85  # g/mol
    assay_cell_length = 0.572  # cm
    A280_cell_length = 1  # cm
    assay_vol = 0.0001  # L
    enz_vol = 0.000025  # L

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
    c_enz_molar = 0
    c_enz_mg_per_mL = 0
    if yld_u == 'A280*':
        c_enz_molar = diluted_yld / (epsilon_enz * A280_cell_length)
        c_enz_mg_per_mL = c_enz_molar * molar_mass_enz
    elif yld_u == '(mg/mL)':
        c_enz_molar = diluted_yld / molar_mass_enz
        c_enz_mg_per_mL = diluted_yld
    elif yld_u == '(M)':
        c_enz_molar = diluted_yld
        c_enz_mg_per_mL = c_enz_molar * molar_mass_enz
    elif yld_u == '(mM)':
        c_enz_molar = diluted_yld / 1000
        c_enz_mg_per_mL = c_enz_molar * molar_mass_enz
    elif yld_u == '(uM)':
        c_enz_molar = diluted_yld / 1e6
        c_enz_mg_per_mL = c_enz_molar * molar_mass_enz

    # Calculate rates
    rates = [slope / (epsilon_byprod * assay_cell_length) for slope in slopes]

    # Calculate kobs
    kobs = [(rate * assay_vol) / (c_enz_molar * enz_vol) for rate in rates]

    # Curve fitting
    initial_guesses = (max(kobs), 3)
    try:
        popt, pcov = curve_fit(kobs_f, c_substrate, kobs,
                               p0=initial_guesses, bounds=(0, inf))
        pSD = sqrt(diag(pcov))

        # Extract parameters
        kcat = popt[0]
        KM = popt[1]
        kcat_SD = pSD[0]
        KM_SD = pSD[1]

        # Calculate kcat/KM
        kcat_over_KM = kcat / KM
        kcat_over_KM_SD = kcat_over_KM * sqrt((kcat_SD / kcat) ** 2 + (KM_SD / KM) ** 2)

        vmax = kcat * c_enz_molar * 1000  # mM/min

    except RuntimeError:
        # Handle fitting error
        return 'Error in curve fitting', 400

    # Check for high KM
    high_KM = False
    if KM > 75:
        high_KM = True
        # Linear fit
        popt, pcov = curve_fit(high_KM_kobs_f, c_substrate, kobs,
                               p0=[kcat_over_KM], bounds=(0, inf))
        pSD = sqrt(diag(pcov))
        kcat_over_KM = popt[0]
        kcat_over_KM_SD = pSD[0]

    # Generate the first plot (Michaelis-Menten or linear fit)
    buf1 = io.BytesIO()
    if not high_KM:
        # Michaelis-Menten plot
        plt.figure(figsize=(5, 5))
        fakex = linspace(0, max(c_substrate)*1.1, 100)
        plt.plot(fakex, kobs_f(fakex, kcat, KM), 'k-')

        # Reference lines
        plt.plot(fakex, [kcat]*len(fakex), 'k:',
                 label=r'$\mathit{k}_\mathrm{cat} = %3.1f \pm %3.1f\, \mathrm{min}^{-1}$' % (kcat, kcat_SD))
        plt.plot([], [], " ",
                 label=r'($\mathit{v}_\mathrm{max} = %2.4f\, \mathrm{mM/min}$)' % (vmax))
        plt.plot([], [], " ", label=" ")
        plt.plot([KM, KM], [0, kcat/2], 'k--',
                 label=r'$\mathit{K}_\mathrm{M} = %3.2f \pm %3.2f\, \mathrm{mM}$' % (KM, KM_SD))
        plt.plot([0, KM], [kcat/2, kcat/2], 'k--')

        plt.plot(c_substrate, kobs, 'bo')
        plt.title(variant_name, fontsize=20)
        plt.xlabel('[S] (mM)', fontsize=16)
        plt.ylabel(r'$\mathit{k}_\mathrm{obs}$ (min$^{-1}$)', fontsize=16)
        plt.legend(fontsize=12, loc='lower right')
    else:
        # Linear fit plot
        plt.figure(figsize=(5, 5))
        fakex = linspace(0, max(c_substrate)*1.1, 100)
        plt.plot(fakex, high_KM_kobs_f(fakex, kcat_over_KM), 'k-',
                 label=r'$\mathit{k}_\mathrm{cat}/\mathit{K}_\mathrm{M} = %2.2f \pm %2.2f\, \mathrm{mM}^{-1}\, \mathrm{min}^{-1}$' % (kcat_over_KM, kcat_over_KM_SD))
        plt.plot(c_substrate, kobs, 'bo')
        plt.title(variant_name + ' (Linear Fit)', fontsize=20)
        plt.xlabel('[S] (mM)', fontsize=16)
        plt.ylabel(r'$\mathit{k}_\mathrm{obs}$ (min$^{-1}$)', fontsize=16)
        plt.legend(fontsize=12)

    plt.savefig(buf1, format='png', bbox_inches='tight')
    plt.close()
    buf1.seek(0)
    image1_base64 = base64.b64encode(buf1.read()).decode('utf-8')

    # Generate the Lineweaver-Burk plot
    buf2 = io.BytesIO()

    # Prepare data for Lineweaver-Burk plot
    rates = [k * c_enz_molar * 1000 for k in kobs]  # mM/min
    inv_s = []
    inv_rates = []
    for cs, rate in zip(c_substrate, rates):
        if cs > 0 and rate > 0:
            inv_s.append(1 / cs)
            inv_rates.append(1 / rate)

    # Calculate inv_vmax
    if not high_KM:
        inv_vmax = 1 / vmax
        initial_guesses = (inv_vmax, KM)
    else:
        # For high_KM cases, estimate inv_vmax
        inv_vmax = 1 / (kcat_over_KM * max(c_substrate))
        initial_guesses = (inv_vmax, max(c_substrate))

    # Attempt to fit Lineweaver-Burk plot
    removed_points = 0
    try:
        popt_lb, pcov_lb = curve_fit(inv_v, inv_s, inv_rates, p0=initial_guesses, bounds=(0, inf))
    except RuntimeError:
        # Try removing points one by one
        for i in range(1, len(inv_s)):
            try:
                popt_lb, pcov_lb = curve_fit(inv_v, inv_s[:-i], inv_rates[:-i], p0=initial_guesses, bounds=(0, inf))
                removed_points = i
                break
            except RuntimeError:
                continue
        else:
            # If fitting fails completely
            popt_lb = [0, 0]  # Default values if fitting fails

    # Plot Lineweaver-Burk
    plt.figure(figsize=(5, 5))
    axes = plt.gca()
    axes.spines['left'].set_position('zero')
    axes.spines['right'].set_color('none')
    axes.spines['bottom'].set_position('zero')
    axes.spines['top'].set_color('none')

    # Determine the range for plotting
    max_inv_s_plot = max(inv_s) if inv_s else 1
    if removed_points:
        max_inv_s_plot = max(inv_s[:-removed_points])
    fakex = linspace(-max_inv_s_plot / 7, max_inv_s_plot, 100)

    # Plot the dashed line with "good" parameters if applicable
    if not high_KM and KM <= 75:
        plt.plot(
            fakex,
            inv_v(fakex, inv_vmax, KM),
            'k--',
            label=r'$\frac{1}{v} = \frac{\mathrm{%2.2f\, mM}}{\mathrm{%1.4f\, mM/min}}\, \frac{1}{\mathrm{[S]}} + \frac{1}{\mathrm{%1.4f\, mM/min}}$' % (KM, vmax, vmax)
        )

    # Plot the solid line with fitted parameters
    plt.plot(
        fakex,
        inv_v(fakex, popt_lb[0], popt_lb[1]),
        'k-',
        label=r'$\frac{1}{v} = \frac{\mathrm{%2.2f\, mM}}{\mathrm{%1.4f\, mM/min}}\, \frac{1}{\mathrm{[S]}} + \frac{1}{\mathrm{%1.4f\, mM/min}}$' % (popt_lb[1], 1 / popt_lb[0], 1 / popt_lb[0])
    )

    # Plot the data points
    if removed_points:
        plt.plot(inv_s[:-removed_points], inv_rates[:-removed_points], 'bo')
    else:
        plt.plot(inv_s, inv_rates, 'bo')

    # Set labels and title
    plt.title(variant_name + ' Lineweaver-Burk Plot', fontsize=20)
    plt.xlabel('1/[S] (1/mM)', fontsize=16)
    plt.ylabel(r'$1/\mathit{v}$ (min/mM)', fontsize=16)
    plt.legend(fontsize=10, loc='upper center')

    # Save the plot
    plt.savefig(buf2, format='png', bbox_inches='tight')
    plt.close()
    buf2.seek(0)
    image2_base64 = base64.b64encode(buf2.read()).decode('utf-8')

    # Prepare the JSON response
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

    if debug_mode:
        with open("plot_script_log", 'a') as log_file:
            log_file.write(str(response_data))
            log_file.write("\nSTOP LOG\n")

    return jsonify(response_data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)
