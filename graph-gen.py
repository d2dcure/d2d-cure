import os
from flask import Flask, request, jsonify
import matplotlib
from flask_cors import CORS
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
import re
from numpy import sqrt, exp
from numpy import diag, linspace, inf
from scipy.optimize import curve_fit
import pandas as pd
import base64
from statistics import mean

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

debug_mode = False

# ------------------------------
# Kinetic assay helpers & route
# ------------------------------

def kobs_f(S, kcat, KM):
    """Michaelis-Menten-like equation."""
    return (kcat * S) / (KM + S)

def high_KM_kobs_f(S, kcat_over_KM):
    """Linear fit for high-KM systems."""
    return kcat_over_KM * S

def inv_v(inv_S, inv_vmax, KM):
    """Lineweaver-Burk equation."""
    return KM * inv_vmax * inv_S + inv_vmax

@app.route('/plot_kinetic', methods=['POST'])
def plot_kinetic():
    if debug_mode:
        with open("plot_script_log", 'a') as log_file:
            log_file.write("\nSTART LOG\n")

    variant_name = request.form.get('variant-name', 'WT')
    if variant_name == "X0X":
        variant_name = "WT"

    if 'file' not in request.files:
        return 'No file part', 400

    file = request.files['file']
    if file.filename == '':
        return 'No selected file', 400

    # Read CSV
    df = pd.read_csv(file, header=None, encoding='iso-8859-1')

    # Extract data
    string_of_data = ",".join([
        f"{float(x):.5E}" if pd.notnull(x) else ''
        for x in df.iloc[4:12, 2:5].values.flatten()
    ])

    cleaned_value = re.sub(r'[^\x00-\x7F]+', '', str(df.iloc[2, 6])).strip()
    yield_ = cleaned_value
    dil_factor = df.iloc[2, 7]

    instrument_units = df.iloc[1, 4]
    yield_units = df.iloc[1, 6]

    slope_u = instrument_units

    yld = float(yield_)
    yld_u = yield_units.strip()
    dil = float(dil_factor)

    epsilon_enz = 113330
    epsilon_byprod = 10660
    molar_mass_enz = 51395.85
    assay_cell_length = 0.572
    A280_cell_length = 1
    assay_vol = 0.0001
    enz_vol = 0.000025

    c_substrate = [
        75.000, 75.000, 75.000,
        25.000, 25.000, 25.000,
        8.333,  8.333,  8.333,
        2.778,  2.778,  2.778,
        0.926,  0.926,  0.926,
        0.309,  0.309,  0.309,
        0.103,  0.103,  0.103,
        0.000,  0.000,  0.000
    ]

    empty_cells = []
    slopes = []
    for i, slope in enumerate(string_of_data.split(',')):
        if slope == '':
            empty_cells.append(i)
        else:
            slopes.append(float(slope))

    # Remove those from c_substrate
    c_substrate = [c_substrate[i] for i in range(len(c_substrate)) if i not in empty_cells]

    if '10^-3' in slope_u:
        slopes = [s / 1000 for s in slopes]
    if slope_u.endswith('/s)'):
        slopes = [s * 60 for s in slopes]

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

    rates = [s / (epsilon_byprod * assay_cell_length) for s in slopes]
    kobs = [(r * assay_vol) / (c_enz_molar * enz_vol) for r in rates]

    # Fit
    initial_guesses = (max(kobs), 3)
    try:
        popt, pcov = curve_fit(kobs_f, c_substrate, kobs,
                               p0=initial_guesses, bounds=(0, inf))
        pSD = sqrt(diag(pcov))

        kcat = popt[0]
        KM = popt[1]
        kcat_SD = pSD[0]
        KM_SD = pSD[1]

        kcat_over_KM = kcat / KM
        kcat_over_KM_SD = kcat_over_KM * sqrt(
            (kcat_SD / kcat) ** 2 + (KM_SD / KM) ** 2
        )

        vmax = kcat * c_enz_molar * 1000
    except RuntimeError:
        return 'Error in curve fitting', 400

    high_KM = False
    if KM > 75:
        high_KM = True
        popt, pcov = curve_fit(high_KM_kobs_f, c_substrate, kobs,
                               p0=[kcat_over_KM], bounds=(0, inf))
        pSD = sqrt(diag(pcov))
        kcat_over_KM = popt[0]
        kcat_over_KM_SD = pSD[0]

    # Generate Michaelis-Menten / linear
    buf1 = io.BytesIO()
    if not high_KM:
        plt.figure(figsize=(5, 5))
        fakex = linspace(0, max(c_substrate)*1.1, 100)
        plt.plot(fakex, kobs_f(fakex, kcat, KM), 'k-')

        plt.plot(fakex, [kcat]*len(fakex), 'k:',
                 label=rf'$k_{{cat}} = {kcat:.1f} \pm {kcat_SD:.1f}\,\mathrm{{min}}^{{-1}}$')
        plt.plot([], [], " ",
                 label=rf'$(v_{{max}} = {vmax:.4f}\,\mathrm{{mM/min}})$')
        plt.plot([], [], " ", label=" ")
        plt.plot([KM, KM], [0, kcat/2], 'k--',
                 label=rf'$K_{{M}} = {KM:.2f} \pm {KM_SD:.2f}\,\mathrm{{mM}}$')
        plt.plot([0, KM], [kcat/2, kcat/2], 'k--')

        plt.plot(c_substrate, kobs, 'bo')
        plt.title(variant_name, fontsize=20)
        plt.xlabel('[S] (mM)', fontsize=16)
        plt.ylabel(r'$k_\mathrm{obs}$ (min$^{-1}$)', fontsize=16)
        plt.legend(fontsize=12, loc='lower right')
    else:
        plt.figure(figsize=(5, 5))
        fakex = linspace(0, max(c_substrate)*1.1, 100)
        plt.plot(fakex, high_KM_kobs_f(fakex, kcat_over_KM), 'k-',
                 label=rf'$k_{{cat}}/K_{{M}} = {kcat_over_KM:.2f} \pm {kcat_over_KM_SD:.2f}\,\mathrm{{mM}}^{{-1}}\,\mathrm{{min}}^{{-1}}$')
        plt.plot(c_substrate, kobs, 'bo')
        plt.title(variant_name + ' (Linear Fit)', fontsize=20)
        plt.xlabel('[S] (mM)', fontsize=16)
        plt.ylabel(r'$k_\mathrm{obs}$ (min$^{-1}$)', fontsize=16)
        plt.legend(fontsize=12)

    plt.savefig(buf1, format='png', bbox_inches='tight')
    plt.close()
    buf1.seek(0)
    image1_base64 = base64.b64encode(buf1.read()).decode('utf-8')

    # Generate Lineweaver-Burk
    buf2 = io.BytesIO()
    rates_mm = [k * c_enz_molar * 1000 for k in kobs]
    inv_s = []
    inv_rates = []
    for cs, r in zip(c_substrate, rates_mm):
        if cs > 0 and r > 0:
            inv_s.append(1/cs)
            inv_rates.append(1/r)

    if not high_KM:
        inv_vmax = 1/vmax
        initial_guesses = (inv_vmax, KM)
    else:
        inv_vmax = 1/(kcat_over_KM * max(c_substrate))
        initial_guesses = (inv_vmax, max(c_substrate))

    removed_points = 0
    try:
        popt_lb, pcov_lb = curve_fit(inv_v, inv_s, inv_rates,
                                     p0=initial_guesses, bounds=(0, inf))
    except RuntimeError:
        for i in range(1, len(inv_s)):
            try:
                popt_lb, pcov_lb = curve_fit(inv_v, inv_s[:-i], inv_rates[:-i],
                                             p0=initial_guesses, bounds=(0, inf))
                removed_points = i
                break
            except RuntimeError:
                continue
        else:
            popt_lb = [0, 0]

    plt.figure(figsize=(5, 5))
    axes = plt.gca()
    axes.spines['left'].set_position('zero')
    axes.spines['right'].set_color('none')
    axes.spines['bottom'].set_position('zero')
    axes.spines['top'].set_color('none')

    if removed_points:
        max_inv_s_plot = max(inv_s[:-removed_points]) if (len(inv_s) > removed_points) else 1
    else:
        max_inv_s_plot = max(inv_s) if inv_s else 1

    fakex = linspace(-max_inv_s_plot/7, max_inv_s_plot, 100)

    if not high_KM and KM <= 75:
        plt.plot(fakex,
                 inv_v(fakex, 1/vmax, KM),
                 'k--',
                 label=rf'$\frac{{1}}{{v}} = \frac{{{KM:.2f}\,\mathrm{{mM}}}}{{{vmax:.4f}\,\mathrm{{mM/min}}}}\frac{{1}}{{[S]}} + \frac{{1}}{{{vmax:.4f}}}$')

    plt.plot(fakex,
             inv_v(fakex, popt_lb[0], popt_lb[1]),
             'k-',
             label=rf'$\frac{{1}}{{v}} = \frac{{{popt_lb[1]:.2f}\,\mathrm{{mM}}}}{{{1/popt_lb[0]:.4f}\,\mathrm{{mM/min}}}}\frac{{1}}{{[S]}} + \frac{{1}}{{{1/popt_lb[0]:.4f}}}$')

    if removed_points:
        plt.plot(inv_s[:-removed_points], inv_rates[:-removed_points], 'bo')
    else:
        plt.plot(inv_s, inv_rates, 'bo')

    plt.title(variant_name, fontsize=20)
    plt.xlabel('1/[S] (1/mM)', fontsize=16)
    plt.ylabel(r'$1/v$ (min/mM)', fontsize=16)
    plt.legend(fontsize=10, loc='upper center')

    plt.savefig(buf2, format='png', bbox_inches='tight')
    plt.close()
    buf2.seek(0)
    image2_base64 = base64.b64encode(buf2.read()).decode('utf-8')

    response_data = {
        'menten_plot': image1_base64,
        'lineweaver_plot': image2_base64,
        'kcat': None if high_KM else kcat,
        'kcat_SD': None if high_KM else kcat_SD,
        'KM': None if high_KM else KM,
        'KM_SD': None if high_KM else KM_SD,
        'kcat_over_KM': kcat_over_KM,
        'kcat_over_KM_SD': kcat_over_KM_SD,
    }

    if debug_mode:
        with open("plot_script_log", 'a') as log_file:
            log_file.write(str(response_data))
            log_file.write("\nSTOP LOG\n")

    return jsonify(response_data)


# ------------------------------
# Temperature assay helpers & route
# ------------------------------

def func(T, k, T50):
    """Logistic function for temperature response."""
    return 1 / (1 + exp(-k * (T - T50)))

def line(x, a, b):
    """Simple line for T50 plot."""
    return a * x + b

def parse_vertical_temp_data(df: pd.DataFrame):
    """
    Old vertical layout:
     - temperature in rows 4..11 col=0 => repeated 3 times
     - slope data in rows 4..11, columns 2..4 => flatten
    """
    temperature_data = df.iloc[4:12, 0].repeat(3).astype(float).tolist()
    slope_data = df.iloc[4:12, 2:5].values.flatten().astype(float).tolist()
    return temperature_data, slope_data

def parse_horizontal_temp_data(df: pd.DataFrame):
    """
    Horizontal layout:
     - row=1 => columns 3..14 for temperature (D..O in Excel)
     - each temperature col => 2 slope points in row=4..5
    """
    temp_row = df.iloc[1]  # row 2 in Excel
    temperature_cols = []
    for c in range(3, min(15, len(temp_row))):
        val = temp_row[c]
        if pd.notna(val) and val != '':
            temperature_cols.append(c)

    temperature_data = []
    slope_data = []
    for col in temperature_cols:
        tval = float(temp_row[col])
        # 2 replicate data points for each T
        temperature_data.extend([tval, tval])

        s1 = df.iloc[4, col]
        s2 = df.iloc[5, col]
        slope_data.append(float(s1))
        slope_data.append(float(s2))

    return temperature_data, slope_data

@app.route('/plot_temperature', methods=['POST'])
def plot_temperature():
    file = request.files.get('file')
    variant_name = request.form.get('variant-name', 'Thermostability Assay Data')
    if variant_name == "X0X":
        variant_name = "WT"

    if not file:
        return jsonify({'error': 'No file provided'}), 400

    try:
        df = pd.read_csv(file, header=None)
    except Exception as e:
        return jsonify({'error': f'Invalid CSV read: {str(e)}'}), 400

    # Detect vertical vs. horizontal layout
    is_vertical = False
    try:
        if df.iloc[2, 1] == 'Row':
            is_vertical = True
    except:
        pass

    try:
        if is_vertical:
            temperature_data, slope_data = parse_vertical_temp_data(df)
        else:
            temperature_data, slope_data = parse_horizontal_temp_data(df)
    except Exception as e:
        return jsonify({'error': f'Error parsing data: {str(e)}'}), 400

    # Remove NaNs / blanks
    all_data = [
        (t, s)
        for (t, s) in zip(temperature_data, slope_data)
        if not pd.isna(t) and not pd.isna(s)
    ]
    if not all_data:
        return jsonify({'error': 'No valid numeric data found'}), 400

    temperature_data, slope_data = zip(*all_data)

    # Fit logistic
    try:
        max_slope = mean(sorted(slope_data, reverse=True)[:3])
        normalized_slopes = [s / max_slope for s in slope_data]
    except Exception as e:
        return jsonify({'error': f'Error normalizing slopes: {str(e)}'}), 400

    initial_guess = [-1, 40]
    try:
        k_T50_pair, pcov = curve_fit(
            func, temperature_data, normalized_slopes,
            p0=initial_guess, bounds=([-10, 30], [0, 50])
        )
    except Exception as e:
        return jsonify({'error': f'Curve fitting failed: {str(e)}'}), 400

    k, T50 = k_T50_pair
    T50_SD = sqrt(diag(pcov))[1]
    k_SD = sqrt(diag(pcov))[0]

    plt.figure(figsize=(5, 5))
    plt.plot(temperature_data, normalized_slopes, 'bo')
    x_values = linspace(30, 50, 100)
    plt.plot(x_values, func(x_values, *k_T50_pair), 'r-')
    plt.plot([T50]*50, linspace(-0.05, 1.05, 50), 'k--',
             label=f'T50 = {T50:.2f} ± {T50_SD:.2f}°C')
    a = k / 4
    x_k_values = linspace(30, 50, 50)
    plt.plot(x_k_values, line(x_k_values, a, (0.5 - a*T50)), 'k:',
             label=f'k = {k:.2f}')
    plt.title(variant_name, fontsize=20)
    plt.xlabel('T (°C)', fontsize=16)
    plt.ylabel('Normalized product formation rate', fontsize=16)
    plt.legend(fontsize=12)
    plt.ylim(-0.05, 1.25)

    buffer = io.BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
    plt.close()
    buffer.close()

    response = {
        'T50': float(T50),
        'T50_SD': float(T50_SD),
        'k': float(k),
        'k_SD': float(k_SD),
        'image': image_base64
    }
    return jsonify(response)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5002))
    app.run(host='0.0.0.0', port=port)
