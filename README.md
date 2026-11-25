# SVR Gold Analytics — Sistem Pendukung Keputusan Prediksi Harga Emas Antam

Aplikasi web **Sistem Pendukung Keputusan (Decision Support System)** berbasis **Flask** dan **Support Vector Regression (SVR)** berkernel *Radial Basis Function (RBF)* untuk memproyeksikan harga emas batangan PT Antam Tbk (H+1) menggunakan 5 indikator makroekonomi multivariat.

Dikembangkan oleh **Ruben Setiaji** — Program Studi Teknik Informatika, **Universitas Tarumanagara (UNTAR)**.

---

## Fitur Utama

1. **Terminal Proyeksi & Indikator Pasar Langsung (`/`)**
   - Pemantauan harga jual & *buyback* emas Antam (1 gram), Emas Spot Dunia (`XAU/USD`), Kurs `USD/IDR`, Indeks Dolar AS (`DXY`), dan Minyak Mentah `WTI`.
   - **Simulator Skenario Sensitivitas (*What-If Analysis*):** Uji dampak perubahan variabel makroekonomi terhadap proyeksi harga emas esok hari (`H+1`).
   - **Kalkulator Portofolio & Pajak PPh 22:** Menghitung estimasi nilai *buyback* bersih secara otomatis sesuai regulasi **PMK No. 34/PMK.010/2017** (potongan PPh 22 sebesar 1,5% untuk transaksi di atas Rp 10.000.000), dilengkapi penyimpanan lokal (*Auto-Save LocalStorage*).
2. **Dasbor Analitik & Validasi Ilmiah (`/dashboard`)**
   - Metrik evaluasi model: **RMSE** (`Rp 125.420`), **MAE** (`Rp 69.409`), dan **R-Squared / $R^2$** (`93,02%`).
   - Grafik interaktif tren harga historis 60 periode terakhir dengan sakelar indikator **SMA 7**, **SMA 30**, dan **Momentum RSI (14)**.
   - Visualisasi peringkat pengaruh variabel independen, grafik proporsi faktor pembentuk harga, peta sensitivitas radar, serta ekspor laporan ke **CSV** dan **PDF**.
3. **Dokumentasi Arsitektur & Metodologi (`/tentang-sistem` atau `/about`)**
   - Penjelasan tahapan pipeline akuisisi data, normalisasi *Z-Score*, spesifikasi 5 variabel multivariat, serta tanya-jawab sistem (FAQ) yang dikelola melalui konfigurasi JSON.
4. **Pencarian Cepat Internal (`Ctrl+K`)**
   - Modal pencarian instan di seluruh halaman untuk melompat cepat ke fitur, simulator, kalkulator pajak, grafik, atau dokumentasi metodologi.

---

## Struktur Direktori Proyek

```text
Skripsi_SVR_Emas/
├── app.py                        # Aplikasi utama Flask, routing halaman, & endpoint API SVR
├── train_model.py                # Skrip pelatihan model SVR & penyimpanan scaler (.pkl)
├── clean_data.py                 # Skrip pembersihan dataset historis multivariat
├── requirements.txt              # Daftar pustaka Python yang dibutuhkan
├── Procfile                      # Konfigurasi deployment server (Gunicorn)
├── data/
│   └── content.json              # Lightweight CMS (profil penulis, pipeline, metodologi, pajak, FAQ, search index)
├── dataset/
│   └── dataset_multivariat_antam_cleaned.csv
├── models/
│   ├── svr_model.pkl             # Model Support Vector Regression terlatih
│   ├── scaler_X.pkl              # StandardScaler untuk 5 variabel independen
│   └── scaler_Y.pkl              # StandardScaler untuk target harga emas
├── static/
│   ├── css/
│   │   ├── tokens.css            # Design Tokens (:root palet warna, tipografi, spacing, radius)
│   │   ├── layout.css            # Sistem grid, sidebar, topbar, drawer mobile, & responsivitas
│   │   ├── components.css        # Kartu KPI, form slider, tabel, skeleton loader, modal Ctrl+K, & print CSS
│   │   └── style.css             # Entry stylesheet utama
│   ├── js/
│   │   ├── navigation.js         # Logika drawer mobile, waktu sinkronisasi, toast, & pita harga live
│   │   ├── search.js             # Logika pencarian cepat internal (Ctrl+K)
│   │   ├── simulator.js          # Logika simulator What-If, grafik proyeksi H+1, & kalkulator PPh 22
│   │   └── dashboard_charts.js   # Logika grafik tren historis SMA/RSI, bobot variabel, & filter tabel
│   └── img/
│       └── logo_antam.png
└── templates/
    ├── base.html                 # Master layout (SEO meta, Open Graph, skip link, struktur halaman)
    ├── partials/
    │   ├── _sidebar.html         # Navigasi sidebar dengan indikator halaman aktif
    │   ├── _topbar.html          # Top utility bar, breadcrumb dinamis, & pemicu pencarian Ctrl+K
    │   ├── _search_modal.html    # Dialog modal pencarian internal
    │   └── _footer.html          # Footer akademis & penafian investasi
    ├── index.html                # Halaman Beranda (Terminal Proyeksi SVR)
    ├── dashboard.html            # Halaman Dasbor Analitik & Evaluasi Model
    └── about.html                # Halaman Tentang Sistem & Metodologi
```

---

## Cara Menjalankan Aplikasi Secara Lokal

1. **Aktifkan Virtual Environment (opsional namun disarankan):**
   ```powershell
   .\env\Scripts\Activate.ps1
   ```
2. **Pasang Dependensi (jika belum terpasang):**
   ```powershell
   pip install -r requirements.txt
   ```
3. **Jalankan Server Flask:**
   ```powershell
   python app.py
   ```
4. Buka peramban dan akses `http://127.0.0.1:5000`.

---

## Cara Memperbarui Konten Statis (Lightweight CMS)

Anda dapat memperbarui informasi profil peneliti, tahapan pipeline, deskripsi variabel, regulasi pajak, daftar FAQ, maupun indeks pencarian internal **tanpa mengedit kode HTML** dengan mengubah isi berkas:
- `data/content.json`

Setiap perubahan pada `data/content.json` akan langsung dimuat secara otomatis oleh Flask pada permintaan halaman berikutnya.
