/**
 * HOME TERMINAL MODULE — SIMULATOR SVR, KALKULATOR PROFIT PPh 22, & TABEL HISTORIS
 * Terhubung langsung dengan endpoint /api/simulate, /api/chart_data, dan /calculate_profit
 */

(function () {
    let predBarChart = null;
    let gaugeSignalChart = null;
    let polarDistChart = null;
    let currentAntamPrice = 2598000;
    let currentBuybackPrice = 2438000;

    if (typeof Chart !== 'undefined') {
        Chart.defaults.color = '#94A3B8';
        Chart.defaults.borderColor = 'rgba(212, 175, 55, 0.12)';
        Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
    }

    function formatRupiah(num) {
        return 'Rp ' + Math.round(num).toLocaleString('id-ID').replace(/,/g, '.');
    }

    // 1. PANDUAN INTERAKTIF (INTRO.JS)
    window.startTour = function () {
        if (typeof introJs === 'undefined') return;
        introJs()
            .setOptions({
                steps: [
                    {
                        element: document.querySelector('#marketOverviewSection'),
                        title: '1. Ikhtisar Pasar Real-Time',
                        intro: 'Memantau harga emas Antam (Jual & Buyback) beserta indikator makroekonomi global.'
                    },
                    {
                        element: document.querySelector('#simulatorSection'),
                        title: '2. Simulator Sensitivitas SVR',
                        intro: 'Ubah parameter Kurs USD/IDR, Emas Dunia (XAU), DXY, dan WTI untuk menguji proyeksi harga H+1.'
                    },
                    {
                        element: document.querySelector('#calculatorSection'),
                        title: '3. Kalkulator Portofolio & Pajak PPh 22',
                        intro: 'Hitung nilai bersih aset emas Anda lengkap dengan ketentuan pajak buyback PMK No. 34/2017.'
                    }
                ],
                showProgress: true,
                showBullets: false,
                nextLabel: 'Berikutnya',
                prevLabel: 'Sebelumnya',
                doneLabel: 'Selesai'
            })
            .start();
    };

    // 2. MANAJEMEN PORTOFOLIO (LOCALSTORAGE)
    function savePortfolioToStorage(silent = false) {
        const pInputs = document.querySelectorAll('.price-input');
        const gInputs = document.querySelectorAll('.gram-input');
        const data = [];
        pInputs.forEach((input, idx) => {
            data.push({
                p: input.value,
                g: gInputs[idx] ? gInputs[idx].value : ''
            });
        });
        localStorage.setItem('emasPortfolio', JSON.stringify(data));
        if (!silent && window.AppUI) {
            window.AppUI.showToast('Perubahan portofolio tersimpan otomatis');
        }
    }

    window.addPortfolioRow = function (priceVal = '', gramVal = '') {
        const container = document.getElementById('transactionList');
        if (!container) return;

        const rowIndex = container.children.length + 1;
        const newRow = document.createElement('div');
        newRow.className = 'transaction-row row g-2 align-items-center mb-3';
        newRow.innerHTML = `
            <div class="col-7 col-sm-6">
                <label class="visually-hidden" for="priceInput_${rowIndex}">Harga Beli per Gram</label>
                <div class="input-group">
                    <span class="input-group-text input-group-text-dark">Rp</span>
                    <input type="number" id="priceInput_${rowIndex}" class="form-control input-dark price-input" placeholder="Harga beli/gr (cth: 2150000)" value="${priceVal}" min="100000" step="1000">
                </div>
            </div>
            <div class="col-3 col-sm-4">
                <label class="visually-hidden" for="gramInput_${rowIndex}">Jumlah Gram</label>
                <div class="input-group">
                    <input type="number" id="gramInput_${rowIndex}" class="form-control input-dark gram-input" placeholder="Gram" value="${gramVal}" min="0.5" step="0.5">
                    <span class="input-group-text input-group-text-dark d-none d-sm-inline-flex">gr</span>
                </div>
            </div>
            <div class="col-2 text-end">
                <button type="button" class="btn-icon-only btn-remove-row" aria-label="Hapus baris transaksi" title="Hapus baris transaksi">
                    <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
                </button>
            </div>
        `;

        newRow.querySelectorAll('input').forEach((inp) => {
            inp.addEventListener('change', () => savePortfolioToStorage(false));
        });

        newRow.querySelector('.btn-remove-row').addEventListener('click', function () {
            const rows = document.querySelectorAll('.transaction-row');
            if (rows.length > 1) {
                newRow.remove();
                savePortfolioToStorage(false);
            } else if (window.AppUI) {
                window.AppUI.showToast('Minimal satu baris transaksi harus aktif', 'fa-circle-info');
            }
        });

        container.appendChild(newRow);
    };

    window.resetPortfolio = function () {
        localStorage.removeItem('emasPortfolio');
        const container = document.getElementById('transactionList');
        if (container) container.innerHTML = '';
        window.addPortfolioRow('2250000', '5');
        const resBox = document.getElementById('calcResult');
        if (resBox) resBox.classList.add('d-none');
        if (window.AppUI) window.AppUI.showToast('Data portofolio direset ke nilai awal', 'fa-rotate-left');
    };

    function loadPortfolioFromStorage() {
        const container = document.getElementById('transactionList');
        if (!container) return;
        container.innerHTML = '';

        const saved = localStorage.getItem('emasPortfolio');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    parsed.forEach((item) => window.addPortfolioRow(item.p, item.g));
                    return;
                }
            } catch (e) {
                // fallback default
            }
        }
        window.addPortfolioRow('2250000', '5');
    }

    // 3. UNDUH CSV TABEL HISTORIS
    window.downloadHomeCSV = function () {
        let csv = 'data:text/csv;charset=utf-8,Tanggal,Harga Antam (IDR),SMA 7 (IDR),SMA 30 (IDR)\n';
        document.querySelectorAll('#dataTableBody tr').forEach((row) => {
            const cols = row.querySelectorAll('td');
            if (cols.length < 4) return;
            const rowData = Array.from(cols).map((c) => c.innerText.replace(/,/g, '').replace(/\./g, '').trim());
            csv += rowData.join(',') + '\n';
        });
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csv));
        link.setAttribute('download', 'Log_Historis_Emas_Antam_SVR.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (window.AppUI) window.AppUI.showToast('Berkas CSV berhasil diunduh', 'fa-file-csv');
    };

    // 4. CHART VISUALISASI PROYEKSI H+1
    function renderPredictionCharts(hjToday, hbToday, hjBesok, hbBesok) {
        const predCanvas = document.getElementById('predChart');
        const gaugeCanvas = document.getElementById('gaugeChart');
        const polarCanvas = document.getElementById('polarChart');
        if (!predCanvas || !gaugeCanvas || !polarCanvas) return;

        if (predBarChart) predBarChart.destroy();
        const minVal = Math.min(hjToday, hbToday, hjBesok, hbBesok) - 40000;

        predBarChart = new Chart(predCanvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Jual (H+0)', 'Buyback (H+0)', 'Proyeksi Jual (H+1)', 'Proyeksi Buyback (H+1)'],
                datasets: [
                    {
                        label: 'Harga (IDR)',
                        data: [hjToday, hbToday, hjBesok, hbBesok],
                        backgroundColor: [
                            'rgba(248, 250, 252, 0.25)',
                            'rgba(212, 175, 55, 0.35)',
                            '#F8FAFC',
                            '#D4AF37'
                        ],
                        borderRadius: 6,
                        borderSkipped: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => formatRupiah(ctx.raw)
                        }
                    }
                },
                scales: {
                    y: {
                        min: minVal > 0 ? minVal : 0,
                        grid: { color: 'rgba(255,255,255,0.06)' },
                        ticks: {
                            callback: (val) => 'Rp ' + (val / 1000000).toFixed(2) + ' Jt'
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#CBD5E1', font: { size: 11, weight: '600' } }
                    }
                }
            }
        });

        // Gauge Chart
        if (gaugeSignalChart) gaugeSignalChart.destroy();
        const diff = hjBesok - hjToday;
        let signalValue = 50;
        let signalText = 'HOLD / NEUTRAL';
        let signalColor = '#D4AF37';

        if (diff > 8000) {
            signalValue = 82;
            signalText = 'SINYAL AKUMULASI (BUY)';
            signalColor = '#10B981';
        } else if (diff < -8000) {
            signalValue = 18;
            signalText = 'SINYAL AMANKAN MARGIN';
            signalColor = '#F43F5E';
        }

        const gaugeLabel = document.getElementById('gaugeLabel');
        if (gaugeLabel) {
            gaugeLabel.textContent = signalText;
            gaugeLabel.style.color = signalColor;
        }

        gaugeSignalChart = new Chart(gaugeCanvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Kekuatan Sinyal', 'Sisa'],
                datasets: [
                    {
                        data: [signalValue, 100 - signalValue],
                        backgroundColor: [signalColor, '#1D212A'],
                        borderWidth: 0,
                        circumference: 180,
                        rotation: 270
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '74%',
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });

        // Polar Chart
        if (polarDistChart) polarDistChart.destroy();
        let distData = [5, 15, 50, 20, 10];
        if (diff > 8000) {
            distData = [5, 10, 20, 40, 25];
        } else if (diff < -8000) {
            distData = [25, 40, 20, 10, 5];
        }

        polarDistChart = new Chart(polarCanvas.getContext('2d'), {
            type: 'polarArea',
            data: {
                labels: ['Koreksi Kuat', 'Koreksi Wajar', 'Konsolidasi', 'Penguatan Wajar', 'Penguatan Kuat'],
                datasets: [
                    {
                        data: distData,
                        backgroundColor: [
                            'rgba(244, 63, 94, 0.72)',
                            'rgba(244, 63, 94, 0.42)',
                            'rgba(148, 163, 184, 0.28)',
                            'rgba(16, 185, 129, 0.45)',
                            'rgba(212, 175, 55, 0.80)'
                        ],
                        borderColor: '#111318',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#CBD5E1', boxWidth: 10, font: { size: 11 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: (c) => `${c.label}: ${c.raw}% Estimasi`
                        }
                    }
                },
                scales: {
                    r: {
                        grid: { color: 'rgba(255,255,255,0.06)' },
                        ticks: { display: false }
                    }
                }
            }
        });
    }

    // 5. EKSEKUSI SIMULASI SVR
    function runSimulation() {
        const btn = document.getElementById('btnRunSim');
        const simKurs = document.getElementById('simKurs');
        const simGold = document.getElementById('simGold');
        const simDxy = document.getElementById('simDxy');
        const simWti = document.getElementById('simWti');

        if (!btn || !simKurs || !simGold || !simDxy || !simWti) return;

        const originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Menghitung Proyeksi SVR...';

        const loadingEl = document.getElementById('simLoading');
        const actualEl = document.getElementById('simActualResult');
        if (loadingEl) loadingEl.classList.remove('d-none');
        if (actualEl) actualEl.classList.add('d-none');

        fetch('/api/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                kurs: simKurs.value,
                gold_global: simGold.value,
                dxy: simDxy.value,
                wti: simWti.value
            })
        })
            .then((res) => res.json())
            .then((data) => {
                if (loadingEl) loadingEl.classList.add('d-none');
                if (actualEl) actualEl.classList.remove('d-none');

                if (data.status === 'success') {
                    const predValue = data.prediction || parseInt(data.formatted.replace(/[^0-9]/g, ''), 10);
                    const resultValEl = document.getElementById('simResultValue');
                    if (resultValEl) resultValEl.textContent = data.formatted;

                    const diff = predValue - currentAntamPrice;
                    const diffPct = ((diff / currentAntamPrice) * 100).toFixed(2);
                    const compEl = document.getElementById('simComparison');

                    let badgeClass = 'status-badge-gold';
                    let arahText = 'cenderung stabil (konsolidasi)';
                    let rekomendasi = 'HOLD (Pertahankan Posisi)';
                    let sign = '';

                    if (diff > 0) {
                        badgeClass = 'status-badge-success';
                        arahText = 'mengalami penguatan';
                        sign = '+';
                    } else if (diff < 0) {
                        badgeClass = 'status-badge-danger';
                        arahText = 'mengalami koreksi';
                    }

                    if (diff > 8000) {
                        rekomendasi = 'BUY (Akumulasi Bertahap)';
                    } else if (diff < -8000) {
                        rekomendasi = 'SELL / TAKE PROFIT';
                    }

                    if (compEl) {
                        compEl.innerHTML = `
                            <div class="mb-2">
                                <span class="status-badge ${badgeClass}">
                                    ${sign}${formatRupiah(diff)} (${sign}${diffPct}%) vs Harga Saat Ini
                                </span>
                            </div>
                            <div class="text-secondary-light small">
                                Rekomendasi DSS: <strong class="text-gold">${rekomendasi}</strong>
                            </div>
                        `;
                    }

                    // Tampilkan Ringkasan Eksekutif
                    const summaryBox = document.getElementById('aiSummaryBox');
                    const summaryText = document.getElementById('aiSummaryText');
                    if (summaryBox && summaryText) {
                        summaryText.innerHTML = `
                            Pada skenario Kurs <strong>Rp ${parseInt(simKurs.value, 10).toLocaleString('id-ID')}</strong>, Emas Spot <strong>$${parseInt(simGold.value, 10).toLocaleString('id-ID')}/oz</strong>, DXY <strong>${simDxy.value}</strong>, dan WTI <strong>$${simWti.value}/barel</strong>, model Support Vector Regression memproyeksikan harga emas Antam (H+1) berada di level <strong>${data.formatted}/gram</strong> atau ${arahText} sebesar <strong>${formatRupiah(Math.abs(diff))}</strong> per gram dibandingkan harga aktual hari ini (${formatRupiah(currentAntamPrice)}). Indikasi keputusan taktis: <strong class="text-gold">${rekomendasi}</strong>.
                        `;
                        summaryBox.classList.remove('d-none');
                    }

                    const sellTodayEl = document.getElementById('sellToday');
                    const sellBesokEl = document.getElementById('sellBesok');
                    if (sellTodayEl) sellTodayEl.textContent = formatRupiah(currentAntamPrice);
                    if (sellBesokEl) sellBesokEl.textContent = data.formatted;

                    const buybackRatio = currentBuybackPrice / currentAntamPrice;
                    const estBuybackBesok = Math.round(predValue * buybackRatio);

                    renderPredictionCharts(currentAntamPrice, currentBuybackPrice, predValue, estBuybackBesok);
                    if (window.AppUI) window.AppUI.showToast('Proyeksi harga H+1 berhasil diperbarui');
                } else if (window.AppUI) {
                    window.AppUI.showToast('Gagal menjalankan simulasi: ' + (data.message || 'Error'), 'fa-triangle-exclamation');
                }
            })
            .catch(() => {
                if (loadingEl) loadingEl.classList.add('d-none');
                if (actualEl) actualEl.classList.remove('d-none');
                if (window.AppUI) window.AppUI.showToast('Gagal menghubungi server simulasi', 'fa-triangle-exclamation');
            })
            .finally(() => {
                btn.disabled = false;
                btn.innerHTML = originalHTML;
            });
    }

    // 6. KALKULATOR PROFIT & PAJAK PPh 22
    function calculatePortfolioProfit() {
        const pInputs = document.querySelectorAll('.price-input');
        const gInputs = document.querySelectorAll('.gram-input');
        const buybackInput = document.getElementById('calcHargaJual');
        const currentJual = parseFloat(buybackInput ? buybackInput.value : 0);

        if (!currentJual || currentJual <= 0) {
            if (window.AppUI) window.AppUI.showToast('Masukkan harga buyback acuan terlebih dahulu', 'fa-circle-exclamation');
            return;
        }

        let totalCost = 0;
        let totalGrams = 0;
        pInputs.forEach((inp, idx) => {
            const p = parseFloat(inp.value);
            const g = parseFloat(gInputs[idx] ? gInputs[idx].value : 0);
            if (p > 0 && g > 0) {
                totalCost += p * g;
                totalGrams += g;
            }
        });

        if (totalGrams <= 0) {
            if (window.AppUI) window.AppUI.showToast('Masukkan minimal satu entri pembelian emas yang valid', 'fa-circle-exclamation');
            return;
        }

        const avgPrice = totalCost / totalGrams;
        const grossVal = currentJual * totalGrams;
        const taxAmount = grossVal > 10000000 ? grossVal * 0.015 : 0;
        const netVal = grossVal - taxAmount;
        const diff = netVal - totalCost;
        const percent = (diff / totalCost) * 100;

        const resBox = document.getElementById('calcResult');
        const resProfitText = document.getElementById('resProfitText');
        if (!resBox || !resProfitText) return;

        resBox.classList.remove('d-none');
        if (diff >= 0) {
            resBox.style.backgroundColor = 'rgba(16, 185, 129, 0.10)';
            resBox.style.borderColor = 'rgba(16, 185, 129, 0.40)';
            resProfitText.style.color = '#10B981';
            resProfitText.textContent = `ESTIMASI PROFIT BERSIH: +${formatRupiah(diff)}`;
        } else {
            resBox.style.backgroundColor = 'rgba(244, 63, 94, 0.10)';
            resBox.style.borderColor = 'rgba(244, 63, 94, 0.40)';
            resProfitText.style.color = '#F43F5E';
            resProfitText.textContent = `ESTIMASI SELISIH: -${formatRupiah(Math.abs(diff))}`;
        }

        document.getElementById('resGrams').textContent = `${totalGrams.toFixed(2).replace(/\.00$/, '')} Gram`;
        document.getElementById('resAvg').textContent = formatRupiah(avgPrice) + '/gr';
        document.getElementById('resModal').textContent = formatRupiah(totalCost);
        document.getElementById('resTax').textContent = taxAmount > 0 ? `${formatRupiah(taxAmount)} (1,5%)` : 'Rp 0 (< Rp 10 Jt)';
        document.getElementById('resNetValue').textContent = formatRupiah(netVal);
        document.getElementById('resPercent').textContent = `${diff >= 0 ? '+' : ''}${percent.toFixed(2)}%`;

        savePortfolioToStorage(true);
        if (window.AppUI) window.AppUI.showToast('Kalkulasi portofolio selesai dihitung');
    }

    // 7. INISIALISASI HALAMAN BERANDA
    document.addEventListener('DOMContentLoaded', () => {
        const simKurs = document.getElementById('simKurs');
        const simGold = document.getElementById('simGold');
        const btnRunSim = document.getElementById('btnRunSim');
        const btnHitungSimulasi = document.getElementById('btnHitungSimulasi');

        if (!simKurs) return; // Bukan di halaman Beranda

        loadPortfolioFromStorage();

        simKurs.addEventListener('input', function () {
            document.getElementById('valSimKurs').textContent = 'Rp ' + parseInt(this.value, 10).toLocaleString('id-ID').replace(/,/g, '.');
        });

        simGold.addEventListener('input', function () {
            document.getElementById('valSimGold').textContent = '$ ' + parseInt(this.value, 10).toLocaleString('id-ID').replace(/,/g, '.');
        });

        if (btnRunSim) btnRunSim.addEventListener('click', runSimulation);
        if (btnHitungSimulasi) btnHitungSimulasi.addEventListener('click', calculatePortfolioProfit);

        // Sinkronisasi nilai awal dengan data pasar live
        document.addEventListener('marketStatusLoaded', (e) => {
            const d = e.detail;
            if (!d) return;
            const parsedAntam = parseInt(String(d.antam).replace(/[^0-9]/g, ''), 10);
            const parsedBuyback = parseInt(String(d.buyback).replace(/[^0-9]/g, ''), 10);
            if (!isNaN(parsedAntam) && parsedAntam > 0) currentAntamPrice = parsedAntam;
            if (!isNaN(parsedBuyback) && parsedBuyback > 0) {
                currentBuybackPrice = parsedBuyback;
                const calcInput = document.getElementById('calcHargaJual');
                if (calcInput && !calcInput.value) calcInput.value = parsedBuyback;
            }
        });

        // Muat data tabel log historis & jalankan grafik proyeksi awal
        fetch('/api/chart_data')
            .then((r) => r.json())
            .then((data) => {
                if (data.status !== 'success') return;
                const tbody = document.getElementById('dataTableBody');
                if (tbody) {
                    let html = '';
                    for (let i = data.labels.length - 1; i >= 0; i--) {
                        const date = data.labels[i];
                        const price = data.antam_prices[i] ? formatRupiah(data.antam_prices[i]) : '-';
                        const sma7 = data.sma7[i] ? formatRupiah(data.sma7[i]) : '-';
                        const sma30 = data.sma30[i] ? formatRupiah(data.sma30[i]) : '-';
                        const isLive = i === data.labels.length - 1;

                        html += `
                            <tr class="${isLive ? 'row-live' : ''}">
                                <td>${date}</td>
                                <td>${price}</td>
                                <td class="text-secondary-light">${sma7}</td>
                                <td class="text-secondary-light">${sma30}</td>
                            </tr>
                        `;
                    }
                    tbody.innerHTML = html;
                }

                // Tampilkan grafik awal dengan proyeksi default dari /predict
                fetch('/predict', { method: 'POST' })
                    .then((r) => r.json())
                    .then((pred) => {
                        if (pred.status === 'success') {
                            const pBesok = parseInt(String(pred.pred_sell_besok).replace(/[^0-9]/g, ''), 10) || currentAntamPrice;
                            const bBesok = parseInt(String(pred.pred_buyback_besok).replace(/[^0-9]/g, ''), 10) || currentBuybackPrice;

                            document.getElementById('simResultValue').textContent = pred.pred_sell_besok;
                            document.getElementById('sellToday').textContent = pred.sell_today;
                            document.getElementById('sellBesok').textContent = pred.pred_sell_besok;

                            const calcInput = document.getElementById('calcHargaJual');
                            if (calcInput && !calcInput.value) {
                                calcInput.value = pred.raw_buyback_today || currentBuybackPrice;
                            }

                            renderPredictionCharts(currentAntamPrice, currentBuybackPrice, pBesok, bBesok);
                        }
                    });
            });
    });
})();
