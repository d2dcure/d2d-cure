from os import environ, getenv
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
import matplotlib
matplotlib.use('Agg')
from matplotlib.pyplot import close, figure, plot, ylabel, xlabel, title, savefig, gca, legend, ylim
from io import BytesIO
import re
from numpy import diag, sqrt, linspace, inf, exp
from scipy.optimize import curve_fit
import pandas as pd
from base64 import b64encode
from statistics import mean
from mysql.connector import connect, Error

# Turn debug mode on or off
debug_mode = True

# Load environment variables from .env for database access.
load_dotenv()

# Set up the WSGI framework.
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Configure connections to the MySQL database.
config_gen = {
    "host": getenv("DATABASE_HOST"),
    "port": int(getenv("DATABASE_PORT")),
    "user": getenv("DATABASE_USER"),
    "password": getenv("DATABASE_PASSWORD"),
    "charset": "utf8mb4",
    "collation": "utf8mb4_unicode_ci"}  # Use compatible collation
enzyme_database = dict(config_gen, database="enzymes")
query_for_enzyme_info = '''
    SELECT molar_mass, ext_coefficient 
    FROM GeneralInfo 
    WHERE abbr = "BglB"
    '''

# ------------------------------
# Kinetic assay helpers & route
# ------------------------------

# Functions to fit and/or plot
def kobs_f(S, kcat, KM):
    '''The Michaelis-Menton-like equation.'''
    return (kcat * S) / (KM + S)

def high_KM_kobs_f(S, kcat_over_KM):
    '''The linear equation for systems where KM is very large.'''
    return kcat_over_KM * S

def inv_v(inv_S, inv_vmax, KM):
    '''The Lineweaver-Burk plot equation'''
    return KM * inv_vmax * inv_S + inv_vmax


@app.route("/plot_kinetic", methods=["POST"])
def plot_kinetic():
    if debug_mode:
        with open("plot_script_log", 'a') as log_file:
            log_file.write("\nSTART LOG\n")

    variant_name = request.form.get("variant-name", "WT")
    if variant_name == "X0X":
        variant_name = "WT"

    if "file" not in request.files:
        return "No file part", 400

    file = request.files["file"]
    if file.filename == '':
        return "No selected file", 400

    # Read the CSV file.
    df = pd.read_csv(file, header=None, encoding='iso-8859-1')

    # Grab experimental details from the datafile.
    slope_u = df.iloc[1, 4]
    cleaned_yield = re.sub(r'[^\x00-\x7F]+', '', str(df.iloc[2, 6])).strip()
    yld = float(cleaned_yield)
    yld_u = df.iloc[1, 6].strip()
    dil = float(df.iloc[2, 7])  # "Traditionally", either 10 or 100

    # Read experimental constants from the database.
    try:
        connection = connect(**enzyme_database)
    except Error as err:
        print(err)
    else:
        cursor_for_query = connection.cursor(dictionary=True)
        cursor_for_query.execute(query_for_enzyme_info)
        enzyme_info = cursor_for_query.fetchone()
        print(enzyme_info["molar_mass"])  # TEMP
        print(enzyme_info["ext_coefficient"])  # TEMP
        cursor_for_query.close()
        connection.close()

    # Constant values
    # TODO: Read these from a database file in preparation for future systems.
    epsilon_enz = 113330  # M^-1 cm^-1 for BglB at 280 nm, according to Expasy
    epsilon_byprod = 10660  # M^-1 cm^-1 for PNP^-1 at pH 7.5 and 420 nm (calculated by Ashley)
    molar_mass_enz = 51395.85  # Ashley calculated from Expasy
    assay_cell_length = 0.572  # cm, calculated by Ashley
    A280_cell_length = 1  # cm  (It is actually 0.5 mm, but the reported A280 values are pre-adjusted for 1 cm.)
    assay_vol = 0.0001  # L (100 microliters)
    enz_vol = 0.000025  # L (25 microliters)


    # Set up assay data to fit and plot.
    # The concentration of substrate will be on the x axis,
    # and the values are constant and determined by the assay.
    # The kobs values are on the y axis and will be calculated from the raw slope data below.
    c_substrate = [
        75.000, 75.000, 75.000,
        25.000, 25.000, 25.000,
        8.333,  8.333,  8.333,
        2.778,  2.778,  2.778,
        0.926,  0.926,  0.926,
        0.309,  0.309,  0.309,
        0.103,  0.103,  0.103,
        0.000,  0.000,  0.000]  # millimolar
    
    # Extract data from the datafile.
    # This must be a comma-delimited string of slopes for cells A1,A2,A3,B1,B2,B3,... etc.
    # If the value is empty, it means that it was removed as an outlier.
    string_of_data = ','.join([
        f"{float(x):.5E}" if pd.notnull(x) else ''
        for x in df.iloc[4:12, 2:5].values.flatten()])

    empty_cells = []
    slopes = []  # TODO: Is there a guarantee that this is going to be 24 cells?
    for i, slope in enumerate(string_of_data.split(',')):
        if slope == '':
            empty_cells.append(i)
        else:
            slopes.append(float(slope))

    # Remove cell from array of substrate concentrations if slope is empty.
    c_substrate = [c_substrate[i] for i in range(len(c_substrate)) if i not in empty_cells]

    # Convert all slopes into units of inverse minutes.
    if "10^-3" in slope_u:	# Scale by 1,000 if needed.
        slopes = [s / 1000 for s in slopes]
    if slope_u.endswith("/s)"):  # Convert inverse seconds to inverse minutes.
        slopes = [s * 60 for s in slopes]

    # Convert yield into common units.
    diluted_yld = yld / dil
    c_enz_molar = 0
    c_enz_mg_per_mL = 0  # equivalent to c in g/L
    if yld_u == "A280*":
        # Calculate enzyme concentrations, using Beer's law.
        c_enz_molar = diluted_yld / (epsilon_enz * A280_cell_length)
        c_enz_mg_per_mL = c_enz_molar * molar_mass_enz
    elif yld_u == "(mg/mL)":
        c_enz_molar = diluted_yld / molar_mass_enz
        c_enz_mg_per_mL = diluted_yld
    elif yld_u == "(M)":
        c_enz_molar = diluted_yld
        c_enz_mg_per_mL = c_enz_molar * molar_mass_enz
    elif yld_u == "(mM)":
        c_enz_molar = diluted_yld / 1000
        c_enz_mg_per_mL = c_enz_molar * molar_mass_enz
    elif yld_u == "(uM)":
        c_enz_molar = diluted_yld / 1e6
        c_enz_mg_per_mL = c_enz_molar * molar_mass_enz

    if debug_mode:
        with open("plot_script_log", 'a') as log_file:
            log_file.write("c_enz_molar: ")
            log_file.write(str(c_enz_molar))
            log_file.write("\n")
            log_file.write("c_enz_mg_per_mL: ")
            log_file.write(str(c_enz_mg_per_mL))
            log_file.write("\n")

    # Calculate the rate of byproduct formation for each slope.
    rates = [s / (epsilon_byprod * assay_cell_length) for s in slopes]  # values in M/min
    
    if debug_mode:
        with open("plot_script_log", 'a') as log_file:
            log_file.write("rates: ")
            for rate in rates:
                log_file.write(str(rate))
                log_file.write(", ")
            log_file.write("\n")

    # Optional: Calculate the activities of the enzyme for each rate.
    #activities_mol_per_min = [rate * assay_vol for rate in rates]  # values in mol/min
    #activities_U = [activity * 1000000 for activity in activities_mol_per_min]  # values in U (micromole/min)
    #specific_activities = [activity / (c_enz_mg_per_mL * enz_vol * 1000) for activity in activities_U]  # values in U/mg

    # Calculate turnover numbers (kobs) from specific activities.
    #kobs = [specific_activity * molar_mass_enz / 1000 for specific_activity in specific_activities]  # values in 1/min

    # Calculate turnover numbers (kobs) from rates directly.
    kobs = [(r * assay_vol) / (c_enz_molar * enz_vol) for r in rates]  # direct calculation from molarity

    if debug_mode:
        with open("plot_script_log", 'a') as log_file:
            log_file.write("kobs: ")
            for kob in kobs:
                log_file.write(str(kob))
                log_file.write(", ")
            log_file.write("\n")

    # Try to fit a curve.
    # popt is the list of optimized parameters.
    # pcov is the estimated covariance of each optimized parameter.
    # pSD is the standard deviation of each optimized parameter.
    initial_guesses = (max(kobs), 3)  # for kcat and KM, respectively
    try:
        popt, pcov = curve_fit(kobs_f, c_substrate, kobs,
                               p0=initial_guesses, bounds=(0, inf))
        pSD = sqrt(diag(pcov))
    except RuntimeError:
        return 'Error in curve fitting', 400

    # Rename the values to something readable.
    kcat = popt[0]  # 1/min
    KM = popt[1]  # millimolar
    kcat_SD = pSD[0]
    KM_SD = pSD[1]

    # Calculate kcat/KM with its standard deviation and vmax for comparison.
    kcat_over_KM = kcat / KM
    kcat_over_KM_SD = kcat_over_KM * sqrt((kcat_SD / kcat)**2 + (KM_SD / KM)**2)

    vmax = kcat * c_enz_molar * 1000  # millimolar per minute

    if debug_mode:
        with open("plot_script_log", 'a') as log_file:
            log_file.write("kcat: ")
            log_file.write(str(kcat))
            log_file.write("\n")
            log_file.write("kcat_SD: ")
            log_file.write(str(kcat_SD))
            log_file.write("\n")
            log_file.write("KM: ")
            log_file.write(str(KM))
            log_file.write("\n")
            log_file.write("KM_SD: ")
            log_file.write(str(KM_SD))
            log_file.write("\n")
            log_file.write("kcat_over_KM: ")
            log_file.write(str(kcat_over_KM))
            log_file.write("\n")
            log_file.write("kcat_over_KM_SD: ")
            log_file.write(str(kcat_over_KM_SD))
            log_file.write("\n")
            log_file.write("vmax: ")
            log_file.write(str(vmax))
            log_file.write("\n")

    # Check for especially large KM values.
    high_KM = True if KM > 75 else False
    if high_KM:
        # Try to fit a linear plot to find kcat/KM, instead.
        try:
            popt, pcov = curve_fit(high_KM_kobs_f, c_substrate, kobs,
                                   p0=[kcat_over_KM], bounds=(0, inf))
            pSD = sqrt(diag(pcov))
        except RuntimeError:
            return 'Error in linear curve fitting', 400
        
        kcat_over_KM = popt[0]
        kcat_over_KM_SD = pSD[0]
        
        if debug_mode:
            with open("plot_script_log", 'a') as log_file:
                log_file.write("   LINEAR FIT: kcat_over_KM: ")
                log_file.write(str(kcat_over_KM))
                log_file.write("\n")
                log_file.write("kcat_over_KM_SD: ")
                log_file.write(str(kcat_over_KM_SD))
                log_file.write("\n")

    # Now generate an image of the plot.
    buf1 = BytesIO()
    fakex = linspace(0, max(c_substrate) * 1.1, 100)    # 100 x values to plot for [S] in the range
    if not high_KM:  # Michaelis-Menton-like plot
        figure(figsize=(5, 5))
        plot(fakex, kobs_f(fakex, kcat, KM), "k-")  # the main curve, solid line

        fakey = [kcat]*100
        plot(fakex, fakey, "k:",  # reference line for kcat, dotted line
             label=rf'$k_\mathrm{{cat}} = {kcat:.1f} \pm {kcat_SD:.1f}\,\mathrm{{min}}^{{-1}}$')
        plot([], [], ' ',  # Plot nothing to create an additional label for the legend.
             label=rf'$(v_\mathrm{{max}} = {vmax:.4f}\,\mathrm{{mᴍ/min}})$')
        plot([], [], ' ', label=' ')  # Plot nothing to create a gap in the legend.
        plot([KM, KM], [0, kcat/2], 'k--',  # vertical reference line for KM, dashed line
             label=rf'$K_\mathrm{{M}} = {KM:.2f} \pm {KM_SD:.2f}\,\mathrm{{mᴍ}}$')
        plot([0, KM], [kcat/2, kcat/2], 'k--')  # horizontal reference line for KM, dashed line

        plot(c_substrate, kobs, 'bo')  # Plot raw data with solid blue circles.

        title(variant_name, fontsize=20)
        xlabel('[S] (mᴍ)', fontsize=16)
        ylabel(r'$k_\mathrm{obs}$ (min$^{-1}$)', fontsize=16)
        legend(fontsize=12, loc="lower right")
    else:  # linear plot
        figure(figsize=(5, 5))
        plot(fakex, high_KM_kobs_f(fakex, kcat_over_KM), 'k-',  # the main curve, solid line
             label=rf'$k_\mathrm{{cat}}/K_\mathrm{{M}} = {kcat_over_KM:.2f} \pm {kcat_over_KM_SD:.2f}\,\mathrm{{mᴍ}}^{{-1}}\,\mathrm{{min}}^{{-1}}$')
        plot(c_substrate, kobs, 'bo')  # Plot raw data with solid blue circles.
        title(variant_name + " (Linear Fit)", fontsize=20)
        xlabel("[S] (mᴍ)", fontsize=16)
        ylabel(r'$k_\mathrm{obs}$ (min$^{-1}$)', fontsize=16)
        legend(fontsize=12)

    savefig(buf1, format="png", bbox_inches="tight")
    close()
    buf1.seek(0)
    image1_base64 = b64encode(buf1.read()).decode("utf-8")

    # Now, we'll plot Lineweaver-Burk for comparison.
    buf2 = BytesIO()
    rates_mm = [k * c_enz_molar * 1000 for k in kobs]  # millimolar per minute
    inv_s = []  # inverse molar
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
        # If the curve can't be fit, the smallest concentrations are probably
        # too close to zero.  Toss them one at a time and try again.
        if debug_mode:
            with open("plot_script_log", 'a') as log_file:
                log_file.write("ERROR: Could not fit LB plot; removing smallest values and retrying...\n")
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

    figure(figsize=(5, 5))
    axes = gca()
    axes.spines["left"].set_position("zero")
    axes.spines["right"].set_color("none")
    axes.spines["bottom"].set_position("zero")
    axes.spines["top"].set_color("none")

    if removed_points:
        max_inv_s_plot = max(inv_s[:-removed_points]) if (len(inv_s) > removed_points) else 1
    else:
        max_inv_s_plot = max(inv_s) if inv_s else 1

	# 100 x values to plot for 1/[S] in the range.
    fakex = linspace(-max_inv_s_plot/7, max_inv_s_plot, 100)

    if not high_KM:
        plot(fakex,
             inv_v(fakex, 1/vmax, KM),
             'k--',
             label=rf'$\frac{{1}}{{v}} = \frac{{{KM:.2f}\,\mathrm{{mᴍ}}}}{{{vmax:.4f}\,\mathrm{{mᴍ/min}}}}\frac{{1}}{{\mathrm{{[S]}}}} + \frac{{1}}{{{vmax:.4f}\,\mathrm{{mᴍ/min}}}}$')

    plot(fakex,
         inv_v(fakex, popt_lb[0], popt_lb[1]),
         'k-',
         label=rf'$\frac{{1}}{{v}} = \frac{{{popt_lb[1]:.2f}\,\mathrm{{mᴍ}}}}{{{1/popt_lb[0]:.4f}\,\mathrm{{mᴍ/min}}}}\frac{{1}}{{\mathrm{{[S]}}}} + \frac{{1}}{{{1/popt_lb[0]:.4f}\,\mathrm{{mᴍ/min}}}}$')

    if removed_points:
        plot(inv_s[:-removed_points], inv_rates[:-removed_points], 'bo')
    else:
        plot(inv_s, inv_rates, 'bo')

    title(variant_name, fontsize=20)
    xlabel('1/[S] (1/mᴍ)', fontsize=16)
    ylabel(r'$1/v$ (min/mᴍ)', fontsize=16)
    legend(fontsize=10, loc="upper center")

    savefig(buf2, format="png", bbox_inches="tight")
    close()
    buf2.seek(0)
    image2_base64 = b64encode(buf2.read()).decode("utf-8")

    # Output the kinetic constants in a dictionary to be input back into the webpage.
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

    figure(figsize=(5, 5))
    plot(temperature_data, normalized_slopes, 'bo')
    x_values = linspace(30, 50, 100)
    plot(x_values, func(x_values, *k_T50_pair), 'r-')
    plot([T50]*50, linspace(-0.05, 1.05, 50), 'k--',
             label=f'T50 = {T50:.2f} ± {T50_SD:.2f}°C')
    a = k / 4
    x_k_values = linspace(30, 50, 50)
    plot(x_k_values, line(x_k_values, a, (0.5 - a*T50)), 'k:',
             label=f'k = {k:.2f}')
    title(variant_name, fontsize=20)
    xlabel('T (°C)', fontsize=16)
    ylabel('Normalized product formation rate', fontsize=16)
    legend(fontsize=12)
    ylim(-0.05, 1.25)

    buffer = BytesIO()
    savefig(buffer, format='png')
    buffer.seek(0)
    image_base64 = b64encode(buffer.read()).decode('utf-8')
    close()
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
    port = int(environ.get('PORT', 5002))
    app.run(host='0.0.0.0', port=port)
