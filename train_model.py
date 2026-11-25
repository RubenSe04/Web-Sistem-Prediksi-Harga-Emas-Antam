import pandas as pd
import numpy as np
import pickle
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler # <-- NORMALISASI Z-SCORE
from sklearn.svm import SVR # <-- SUPPORT VECTOR REGRESSION
from sklearn.metrics import mean_absolute_percentage_error

print("1. Memuat dataset...")
df = pd.read_csv("dataset/dataset_multivariat_antam_cleaned.csv")

X = df[['Antam_Price', 'Global_Gold_Price', 'USD_IDR_Price', 'DXY_Price', 'WTI_Price']]
y = df['Target_Antam_H_plus_1']

# ====================================================================
# FASE EVALUASI 
# ====================================================================
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, shuffle=False)

# ====================================================================
# FASE NORMALISASI Z-SCORE
# ====================================================================
scaler_X_eval = StandardScaler() # <-- Z-Score untuk fitur (X)
scaler_y_eval = StandardScaler() # <-- Z-Score untuk target (y)

X_train_scaled = scaler_X_eval.fit_transform(X_train) # <-- hitung mean & std, lalu transform (Z-Score)
X_test_scaled = scaler_X_eval.transform(X_test) # <-- transform saja (pakai mean & std dari train)
y_train_scaled = scaler_y_eval.fit_transform(y_train.values.reshape(-1, 1)).ravel()

print("2. Mengevaluasi SVR (Kernel rbf)...")

# ============================
# SUPPORT VECTOR REGRESSION + RBF
# ============================
svr_eval = SVR(
    kernel='rbf', # <-- RADIAL BASIS FUNCTION (RBF)
    C=100, # <-- parameter regularisasi SVR
    epsilon=0.1 # <-- epsilon-tube (toleransi error)
    )

# ============================
# PROSES TRAINING SVR
# ============================
svr_eval.fit(X_train_scaled, y_train_scaled)
# <-- DI SINI TERJADI PROSES SUPPORT VECTOR REGRESSION:
#     model belajar mencari support vectors & membentuk fungsi regresi

# ============================
# PROSES PREDIKSI
# ============================
y_pred_scaled = svr_eval.predict(X_test_scaled)
y_pred = scaler_y_eval.inverse_transform(y_pred_scaled.reshape(-1, 1)).ravel()

mape = mean_absolute_percentage_error(y_test, y_pred) * 100
print(f"   -> Nilai MAPE: {mape:.2f}%")

# ====================================================================
# FASE DEPLOYMENT FINAL
# ====================================================================
print("\n3. Melatih ulang SVR FINAL dengan 100% data (Kernel rbf)...")
scaler_X_final = StandardScaler()
scaler_y_final = StandardScaler()

# ============================
# NORMALISASI Z-SCORE (FINAL)
# ============================
X_scaled_final = scaler_X_final.fit_transform(X) # <-- Z-Score seluruh data
y_scaled_final = scaler_y_final.fit_transform(y.values.reshape(-1, 1)).ravel()

# ============================
# SVR + RBF (FINAL MODEL)
# ============================
svr_final = SVR(
    kernel='rbf', 
    C=100, 
    epsilon=0.1
    )

# ============================
# TRAINING FINAL SVR
# ============================
svr_final.fit(X_scaled_final, y_scaled_final)
# <-- PROSES UTAMA SVR: mencari support vectors dari seluruh dataset

print("4. Menyimpan otak FINAL ke folder 'models'...")
os.makedirs("models", exist_ok=True)

with open("models/svr_model.pkl", "wb") as f:
    pickle.dump(svr_final, f)
with open("models/scaler_X.pkl", "wb") as f:
    pickle.dump(scaler_X_final, f)
with open("models/scaler_y.pkl", "wb") as f:
    pickle.dump(scaler_y_final, f)

print("FASE 1 SELESAI! SVR Radial Basis Function (RBF) siap mendeteksi tren harga tertinggi!")