from flask import Flask, request, jsonify
import matplotlib
from flask_cors import CORS
import base64
import pandas as pd
import matplotlib.pyplot as plt
import io
from numpy import exp, sqrt, diag, linspace
from scipy.optimize import curve_fit
from statistics import mean

app = Flask(__name__)
CORS(app)

def func(T, k, T50):
    return 1 / (1 + exp(-k * (T - T50)))

def line(x, a, b):
    return a * x + b

@app.route('/plot_temperature', methods=['POST'])
def plot_temperature():
    file = request.files.get('file')
    variant_name = request.form.get('variant-name', 'Thermostability Assay Data')

    if not file:
        return jsonify({'error': 'No file provided'}), 400

    try:
        df = pd.read_csv(file, header=None)
        temperature_data = df.iloc[4:12, 0].repeat(3).astype(float).tolist()
        slope_data = df.iloc[4:12, 2:5].values.flatten().astype(float).tolist()
        temperature_data = [temp for temp, slope in zip(temperature_data, slope_data) if not pd.isna(slope)]
        slope_data = [slope for slope in slope_data if not pd.isna(slope)]
    except Exception as e:
        return jsonify({'error': f'Invalid data in CSV: {str(e)}'}), 400

    max_slope = mean(sorted(slope_data, reverse=True)[:3])
    normalized_slopes = [s / max_slope for s in slope_data]

    initial_guess = [-1, 40]
    try:
        k_T50_pair, pcov = curve_fit(
            func, temperature_data, normalized_slopes, p0=initial_guess, bounds=([-10, 30], [0, 50])
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
    plt.plot([T50] * 50, linspace(-0.05, 1.05, 50), 'k--', label=f'T50 = {T50:.2f} ± {T50_SD:.2f}°C')
    a = k / 4
    x_k_values = linspace(30, 50, 50)
    plt.plot(x_k_values, line(x_k_values, a, (0.5 - a * T50)), 'k:', label=f'k = {k:.2f}')
    plt.title(variant_name, fontsize=20)
    plt.xlabel('T (°C)', fontsize=16)
    plt.ylabel('Normalized product formation rate', fontsize=16)
    plt.legend(fontsize=12)
    plt.ylim(-0.05, 1.25)

    buffer = io.BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
    buffer.close()

    response = {
        'T50': T50,
        'T50_SD': T50_SD,
        'k': k,
        'k_SD': k_SD,
        'image': image_base64
    }
    return jsonify(response)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003, debug=True)
