import pandas as pd

# 1. Membaca dataset mentah dari folder dataset/
file_mentah = "dataset/dataset_multivariat_antam_final (1).csv"
df = pd.read_csv(file_mentah)

# 2. Memastikan kolom Date berformat tanggal (datetime) dan mengurutkannya
df['Date'] = pd.to_datetime(df['Date'])
df = df.sort_values('Date').reset_index(drop=True)

# 3. Menghapus tanggal ganda (hanya menyimpan harga penutupan terakhir di hari tersebut)
df_clean = df.drop_duplicates(subset=['Date'], keep='last').copy()

# 4. Memperbaiki kolom Target H+1 agar 100% presisi dengan harga hari esoknya
df_clean['Target_Antam_H_plus_1'] = df_clean['Antam_Price'].shift(-1)

# 5. Menghapus baris paling akhir karena tidak memiliki target masa depan (NaN)
df_clean = df_clean.dropna(subset=['Target_Antam_H_plus_1'])

# 6. Mengubah format harga menjadi angka bulat (Integer)
df_clean['Target_Antam_H_plus_1'] = df_clean['Target_Antam_H_plus_1'].astype(int)
df_clean['Antam_Price'] = df_clean['Antam_Price'].astype(int)

# 7. Menyimpan dataset yang sudah bersih ke file baru
file_bersih = "dataset/dataset_multivariat_antam_cleaned.csv"
df_clean.to_csv(file_bersih, index=False)

print(f"Data mentah awal: {df.shape[0]} baris")
print(f"Data bersih siap pakai: {df_clean.shape[0]} baris")
print(f"BERHASIL! Data bersih telah disimpan di: {file_bersih}")