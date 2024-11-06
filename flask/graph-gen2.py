from flask import Flask, request, send_file, jsonify
import matplotlib
from flask_cors import CORS
matplotlib.use('Agg')  # Use non-GUI backend for rendering plots
import pandas as pd
import matplotlib.pyplot as plt
import io
from numpy import exp, sqrt, diag, linspace
from scipy.optimize import curve_fit
from statistics import mean

app = Flask(__name__)
CORS(app)

# Logistic function for curve fitting
def func(T, k, T50):
    """Logistic curve function: Sigmoid to fit temperature vs. rate data."""
    return 1 / (1 + exp(-k * (T - T50)))

@app.route('/plot_temperature', methods=['POST'])
def plot_temperature():
    file = request.files.get('file')
    if not file:
        print("No file provided!")
        return jsonify({'error': 'No file provided'}), 400

    print(f"Received file: {file.filename}")

    try:
        # Read the CSV and extract relevant data rows and columns
        df = pd.read_csv(file, header=None)
        print("CSV Data:\n", df)

        # Extract temperatures and slope data for all replicates
        temperature_data = df.iloc[4:12, 0].repeat(3).astype(float).tolist()  # Repeat temperatures 3 times
        slope_data = df.iloc[4:12, 2:5].values.flatten().astype(float).tolist()  # Flatten slope columns

    except Exception as e:
        print(f"Error reading or processing CSV: {str(e)}")
        return jsonify({'error': f'Invalid data in CSV: {str(e)}'}), 400

    # Normalize the slope data
    max_slope = mean(sorted(slope_data, reverse=True)[:3])
    normalized_slopes = [s / max_slope for s in slope_data]

    # Perform curve fitting
    initial_guess = [-1, 40]  # Initial guess for [k, T50]
    try:
        k_T50_pair, pcov = curve_fit(
            func, temperature_data, normalized_slopes, p0=initial_guess, bounds=([-10, 30], [0, 50])
        )
    except Exception as e:
        print(f"Curve fitting failed: {str(e)}")
        return jsonify({'error': f'Curve fitting failed: {str(e)}'}), 400

    # Extract fitted parameters and their standard deviations
    k, T50 = k_T50_pair
    T50_SD = sqrt(diag(pcov))[1]

    # Plot the data and fitted curve
    plt.figure(figsize=(5, 5))
    plt.plot(temperature_data, normalized_slopes, 'bo')  # Plot data points as blue circles

    # Generate x values for the fitted curve
    x_values = linspace(30, 50, 100)
    plt.plot(x_values, func(x_values, *k_T50_pair), 'r-')  # Red sigmoid curve

    # Add a vertical dashed line for T50
    plt.plot([T50] * 50, linspace(-0.05, 1.05, 50), 'k--', label=f'T50 = {T50:.2f} ± {T50_SD:.2f}°C')

    # Set plot labels, title, and legend
    plt.title("Thermostability Assay Data", fontsize=20)
    plt.xlabel('Temperature (°C)', fontsize=16)
    plt.ylabel('Normalized Rate', fontsize=16)
    plt.legend(fontsize=12)

    # Set y-axis limits for consistency
    plt.ylim(-0.05, 1.25)

    # Save plot to a buffer
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)  # Move to the beginning of the buffer

    # Send the plot as a PNG image
    return send_file(buffer, mimetype='image/png')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003, debug=True)
