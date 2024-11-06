# This is the original code for generating graphs for kinetic data (not used in our application, refer to graph-gen.py)
# Takes command-line arguments to perform its tasks. The user needs to provide inputs directly via the command line when running the script (or, arguments need to be passed to the cmd line somehow, like how Jason handled it). There are no web endpoints

from sys import argv
from math import ceil, sqrt
from numpy import diag, sqrt, linspace, inf
from scipy.optimize import curve_fit 
from matplotlib.pyplot import figure, plot, ylabel, xlabel, title, savefig, gca, legend

# Turn debug mode on or off
debug_mode = False

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


if debug_mode:
    with open("plot_script_log", 'a') as log_file:
        log_file.write("\nSTART LOG\n")


# Grab the information from the command line.
slope_u = argv[4]
yld = float(argv[5])
yld_u = argv[6]  # This needs to be surrounded with quotes at the command line, if it includes parentheses.
dil = float(argv[7])  # "Traditionally", either 10 or 100

# Constant values
# TODO: Read these from a database file in preparation for future systems.
epsilon_enz = 113330  # M^-1 cm^-1 for BglB at 280 nm, according to Expasy
#epsilon_byprod = 200  # M^-1 cm^-1 for PNP at pH 5.4 and 405 nm (Clinical Chemistry. 26 (6): 724–729)
#epsilon_byprod = 18350  # M^-1 cm^-1 for PNP^-1 at pH 7.5 and 405 nm (Clinical Chemistry. 26 (6): 724–729)
epsilon_byprod = 10660  # M^-1 cm^-1 for PNP^-1 at pH 7.5 and 420 nm (calculated by Ashley)

#molar_mass_enz = 51573  # g/mol (or is it 51,225?)
molar_mass_enz = 51395.85  # Ashley calculated from Expasy

#assay_cell_length = 0.66  # cm
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

# Parse out data from comma-delimited string passed at command line.
# This must be a comma-delimited string of slopes for cells A1,A2,A3,B1,B2,B3,... etc.
# If the value is empty, it means that it was removed as an outlier.
#slopes = [float(i) for i in argv[3].split(',')]
empty_cells =[]
slopes = [0]*24
for i, slope in enumerate(argv[3].split(',')):
    if slope == '':
        empty_cells.append(i)
    else:
        slopes[i] = float(slope)
for i in reversed(range(24)):
    if i in empty_cells:
        c_substrate.pop(i)
        slopes.pop(i)

# Convert all slopes into units of inverse minutes.
if slope_u[1:6] == '10^-3':
    slopes = [slope / 1000 for slope in slopes]
if slope_u[-2:-1] == "s":
    slopes = [slope * 60 for slope in slopes]

# Convert yield into common units.
diluted_yld = yld / dil  # dil is either a dilution factor of 10x or 100x, "traditionally"
c_enz_molar = 0
c_enz_mg_per_mL = 0  # equivalent to c in g/L
if yld_u == 'A280*':
    # Calculate enzyme concentrations, using Beer's law.
    c_enz_molar = diluted_yld / (epsilon_enz * A280_cell_length)
    c_enz_mg_per_mL = c_enz_molar * molar_mass_enz
elif yld_u == '(mg/mL)':
    print("boom")
    c_enz_molar = diluted_yld / molar_mass_enz
    c_enz_mg_per_mL = diluted_yld
elif yld_u == '(M)':
    c_enz_molar = diluted_yld
    c_enz_mg_per_mL = c_enz_molar * molar_mass_enz  
elif yld_u == '(mM)':
    c_enz_molar = diluted_yld / 1000
    c_enz_mg_per_mL = c_enz_molar * molar_mass_enz
elif yld_u == '(uM)':
    c_enz_molar = diluted_yld / 1000000
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
rates = [slope / (epsilon_byprod * assay_cell_length) for slope in slopes]  # values in M/min

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
# print(rate)
print(assay_vol)
print(c_enz_molar)
print(enz_vol)
kobs = [(rate * assay_vol) / (c_enz_molar * enz_vol) for rate in rates]  # direct calculation from molarity

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
popt, pcov = curve_fit(kobs_f, c_substrate, kobs,
        p0=initial_guesses, bounds=(0, inf))
pSD = sqrt(diag(pcov))

# Rename the values to something readable.
kcat = popt[0]  # 1/min
KM = popt[1]  # millimolar
kcat_SD = pSD[0]
KM_SD = pSD[1]

# Calculate kcat/KM with its standard deviation and vmax for comparison.
kcat_over_KM = kcat / KM
kcat_over_KM_SD = kcat_over_KM * sqrt((kcat_SD/kcat)**2 + (KM_SD/KM)**2)

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
if KM > 75:
    # Try to fit a linear plot to find kcat/KM, instead.
    popt, pcov = curve_fit(high_KM_kobs_f, c_substrate, kobs,
        p0=kcat_over_KM, bounds=(0, inf))
    pSD = sqrt(diag(pcov))
    kcat_over_KM = popt[0]  # inverse mM/min
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
if KM <= 75:
    figure(figsize=(5, 5))
    fakex = linspace(0, 80, 100)  # 100 x values to plot for [S] in the range
    plot(fakex, kobs_f(fakex, kcat, KM), 'k-')  # the main curve

    fakey = [kcat]*100
    plot(fakex, fakey, 'k:',
        label=r'$\mathit{k}_{\mathrm{cat}} = %3.1f \pm %3.1f\, \mathrm{min}^{-1}$' % (kcat, kcat_SD))  # reference line for kcat

    plot([], [], " ",
        label=r'($\mathit{v}\mathrm{max}$ = %2.4f mᴍ/min)' % (vmax))  # Plot nothing to create an additional label for the legend.
    plot([], [], " ", label=" ")  # Plot nothing to create a gap in the legend.

    fakex = linspace(0.00, KM, 50)
    fakey = [kcat/2]*50
    plot(fakex, fakey, 'k--')  # horizontal reference line for KM

    fakex = [KM]*50
    fakey = linspace(0.00, kobs_f(KM, kcat, KM), 50)
    plot(fakex, fakey, 'k--',
        label=r'$\mathit{K}\mathrm{M}$ = %3.2f ± %3.2f mᴍ' % (KM, KM_SD))  # vertical reference line for KM

    plot(c_substrate, kobs, 'bo')  # Plot raw data with blue circles.

    title(argv[2], fontsize='20')
    ylabel(r'$\mathit{k}_{\mathrm{obs}}$ (min$^{-1}$)', fontsize='16')
    xlabel('[S] (mᴍ)', fontsize='16')
    legend(fontsize='12', loc='lower right')
    savefig(argv[1] + '.png', bbox_inches='tight')

else:
    figure(figsize=(5, 5))
    fakex = linspace(0, 80, 100)  # 100 x values to plot for [S] in the range
    plot(fakex, high_KM_kobs_f(fakex, kcat_over_KM), 'k-',
         label=r'$\mathit{k}_{\mathrm{cat}}/\mathit{K}_{\mathrm{M}} = %2.2f \pm %2.2f \, \mathrm{mM}^{-1}\, \mathrm{min}^{-1}$' % (kcat_over_KM, kcat_over_KM_SD))  # the main curve

    plot(c_substrate, kobs, "bo")  # Plot raw data with blue circles.

    title(argv[2] + ' (linear curve fit)', fontsize='20')
    ylabel(r'$\mathit{k}_{\mathrm{obs}}$ (min$^{-1}$)', fontsize='16')
    xlabel('[S] (mᴍ)', fontsize='16')
    legend(fontsize='12')
    savefig(argv[1] + '.png', bbox_inches='tight')

# Now, we'll plot Lineweaver-Burk for comparison.
inv_vmax = 1/vmax

rates = [k * c_enz_molar * 1000 for k in kobs]  # millimolar per minute
inv_s = []  # inverse molar
inv_rates = []
for i in range(len(rates)):
    rate = rates[i]
    if rate > 0 and c_substrate[i] > 0:
        inv_s.append(1/c_substrate[i])
        inv_rates.append(1/rate)

initial_guesses = (inv_vmax, KM)
removed_points = 0
try:
    popt, pcov = curve_fit(inv_v, inv_s, inv_rates,
            p0=initial_guesses, bounds=(0, inf))
except RuntimeError:
    # If the curve can't be fit, the smallest concentrations are probably too
    # close to zero.  Toss them one at a time and try again.
    if debug_mode:
        with open("plot_script_log", 'a') as log_file:
            log_file.write("ERROR: Could not fit LB plot; removing smallest values and retrying...\n")
    for i in range(1, 24):
        if debug_mode:
            with open("plot_script_log", 'a') as log_file:
                log_file.write("   Reattempt " + str(i) + "\n")
        try:
            popt, pcov = curve_fit(inv_v, inv_s[:-i], inv_rates[:-i],
                    p0=initial_guesses, bounds=(0, inf))
            removed_points = i
            break
        except RuntimeError:
            continue
    
'''try:
    popt, pcov = curve_fit(inv_v, inv_s, inv_rates,
            p0=initial_guesses, bounds=(0, inf))
except RuntimeError:
    # If the curve can't be fit, the smallest concentrations are probably too
    # close to zero.  Toss them one at a time and try again.
    try:
        popt, pcov = curve_fit(inv_v, inv_s[:-1], inv_rates[:-1],
                p0=initial_guesses, bounds=(0, inf))
    except RuntimeError:
        with open("plot_script_log", 'a') as log_file:
            log_file.write("ERROR: Could not fit LB plot; removing smallest values and retrying...\n")
        try:
            popt, pcov = curve_fit(inv_v, inv_s[:-2], inv_rates[:-2],
                    p0=initial_guesses, bounds=(0, inf))
        except RuntimeError:
            with open("plot_script_log", 'a') as log_file:
                log_file.write("ERROR: Could not fit LB plot; removing smallest values and retrying...\n")
            try:
                popt, pcov = curve_fit(inv_v, inv_s[:-3], inv_rates[:-3],
                        p0=initial_guesses, bounds=(0, inf))
            except RuntimeError:
                with open("plot_script_log", 'a') as log_file:
                    log_file.write("ERROR: Could not fit LB plot; removing smallest values and retrying...\n")
                    popt, pcov = curve_fit(inv_v, inv_s[:-4], inv_rates[:-4],
                            p0=initial_guesses, bounds=(0, inf))'''

# 100 x values to plot for 1/[S] in the range
max_value = max(inv_s)
if removed_points: max_value = max(inv_s[:-removed_points])
fakex = linspace(-max_value / 7, max_value, 100)
figure(figsize=(5, 5))
axes = gca()
axes.spines['left'].set_position('zero')
axes.spines['right'].set_color('none')
axes.spines['bottom'].set_position('zero')
axes.spines['top'].set_color('none')
if KM <= 75:
    plot(fakex, inv_v(fakex, inv_vmax, KM), 'k--',
        label=r'$\frac{1}{v} = \frac{\mathrm{%2.2f mᴍ}}{\mathrm{%1.4f mᴍ/min}}$ $\frac{1}{\mathrm{[S]}} + \frac{1}{\mathrm{%1.4f mᴍ/min}}$' % (KM, vmax, vmax))  # plot of curve using "good" values
plot(fakex, inv_v(fakex, popt[0], popt[1]), 'k-',
     label=r'$\frac{1}{v} = \frac{\mathrm{%2.2f mᴍ}}{\mathrm{%1.4f mᴍ/min}}$ $\frac{1}{\mathrm{[S]}} + \frac{1}{\mathrm{%1.4f mᴍ/min}}$' % (popt[1], 1/popt[0], 1/popt[0]))  # plot of curve using "bad" values
if removed_points:
    plot(inv_s[:-removed_points], inv_rates[:-removed_points], 'bo')
else:
    plot(inv_s, inv_rates, 'bo')

title(argv[2], fontsize='20')
ylabel(r'$1/\mathit{v}$ (min/mM)', fontsize='16')
xlabel('1/[S] (1/mᴍ)', fontsize='16')
legend(fontsize='10', loc='upper center')
savefig(argv[1] + '-LB.png', bbox_inches='tight')

# Output the kinetic constants in a list to be input back into the webpage.
if KM <= 75:
    print(str(kcat) + "," + str(kcat_SD) + "," + str(KM) + "," + str(KM_SD) + "," +
          str(kcat_over_KM) + "," + str(kcat_over_KM_SD))
else:
    print(',,,,' + str(kcat_over_KM) + "," + str(kcat_over_KM_SD))

if debug_mode:    
    with open("plot_script_log", 'a') as log_file:
        log_file.write(str(kcat) + "," + str(kcat_SD) + "," + str(KM) + "," +
                str(KM_SD) + "," + str(kcat_over_KM) + "," + str(kcat_over_KM_SD))
        log_file.write("\nSTOP LOG\n")
