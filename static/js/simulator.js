/**
 * HOME TERMINAL MODULE — SIMULATOR SVR, KALKULATOR PROFIT, & HASIL PROYEKSI
 */

(function () {
    let myChart = null;
    let gaugeChart = null;
    let polarChart = null;
    let currentAntamPrice = 2598000;
    let currentBuybackPrice = 2438000;

    if (typeof Chart !== 'undefined') {
        Chart.defaults.color = '#8c8c8c';
        Chart.defaults.borderColor = 'rgba(212, 175, 55, 0.1)';
        Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
    }

    function formatRupiah(num) {
        return 'Rp ' + Math.round(num).toLocaleString('id-ID').replace(/,/g, '.');
    }

    window.startTour = function () {
        if (typeof introJs === 'undefined') return;
        introJs()
            .setOptions({
                steps: [
                    {
                        element: document.querySelector('#step1-market'),
                        title: '1. Data Pasar Real-time',
                        intro: 'Fundamental terkini dari Yahoo Finance (XAU, Kurs, DXY, WTI) dan Emas Antam.'
                    },
                    {
                        element: document.querySelector('#step2-predict'),
                        title: '2. Mesin AI (SVR)',
                        intro: 'Atur sensitivitas dan eksekusi algoritma SVR untuk melihat proyeksi harga besok (H+1).'
                    },
                    {
                        element: document.querySelector('#step5-news'),
                        title: '3. Radar Global',
                        intro: 'Kalender ekonomi dan sentimen berita yang menggerakkan volatilitas emas.'
                    }
                ],
                showProgress: true,
                showBullets: false,
                nextLabel: 'Lanjut',
                prevLabel: 'Kembali',
                doneLabel: 'Selesai'
            })
            .start();
    };

    function savePortfolio(silent = false) {
        const pInputs = document.querySelectorAll('.price-input');
        const gInputs = document.querySelectorAll('.gram-input');
        const data = [];
        pInputs.forEach((inp, idx) => {
            data.push({ p: inp.value, g: gInputs[idx] ? gInputs[idx].value : '' });
        });
        localStorage.setItem('emasPortfolio', JSON.stringify(data));
        if (!silent && window.AppUI) {
            window.AppUI.showToast('Data Tersimpan');
        }
    }

    window.addPortfolioRow = function (priceVal = '', gramVal = '') {
        const container = document.getElementById('transactionList');
        if (!container) return;
        const idx = container.children.length + 1;
        const newRow = document.createElement('div');
        newRow.className = 'transaction-row row g-2 align-items-end mb-3';
        newRow.innerHTML = `
            <div class="col-6">
                <label class="visually-hidden" for="priceInput_${idx}">Harga Beli per Gram</label>
                <div class="input-group">
                    <span class="input-group-text input-group-text-dark"><i class="fa-solid fa-tag"></i></span>
                    <input type="number" id="priceInput_${idx}" class="form-control input-dark price-input" placeholder="Rp/gr" value="${priceVal}">
                </div>
            </div>
            <div class="col-4">
                <label class="visually-hidden" for="gramInput_${idx}">Jumlah Gram</label>
                <input type="number" id="gramInput_${idx}" class="form-control input-dark gram-input" placeholder="Gram" value="${gramVal}">
            </div>
            <div class="col-2 text-end">
                <button type="button" class="btn-icon-only btn-remove-row" aria-label="Hapus baris transaksi">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;

        newRow.querySelectorAll('input').forEach((inp) => {
            inp.addEventListener('change', () => savePortfolio(false));
        });

        newRow.querySelector('.btn-remove-row').addEventListener('click', function () {
            const rows = document.querySelectorAll('.transaction-row');
            if (rows.length > 1) {
                newRow.remove();
                savePortfolio(false);
            } else if (window.AppUI) {
                window.AppUI.showToast('Minimal satu riwayat aktif', 'fa-circle-info');
            }
        });

        container.appendChild(newRow);
    };

    window.resetPortfolio = function () {
        localStorage.removeItem('emasPortfolio');
        loadPortfolio();
        const resBox = document.getElementById('calcResult');
        if (resBox) resBox.classList.add('d-none');
        if (window.AppUI) window.AppUI.showToast('Portofolio direset', 'fa-rotate-left');
    };

    function loadPortfolio() {
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
                // fallback
            }
        }
        window.addPortfolioRow('', '');
    }

    window.downloadHomeCSV = function () {
        let csv = 'data:text/csv;charset=utf-8,Tanggal,Harga Antam,SMA 7,SMA 30\n';
        document.querySelectorAll('#dataTableBody tr').forEach((row) => {
            const cols = row.querySelectorAll('td');
            if (cols.length < 4) return;
            const rowData = Array.from(cols).map((c) => c.innerText.replace(/,/g, '').replace(/\./g, '').trim());
            csv += rowData.join(',') + '\n';
        });
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csv));
        link.setAttribute('download', 'Log_SVR_Antam.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (window.AppUI) window.AppUI.showToast('CSV berhasil diunduh');
    };

    function renderChart(hjToday, hbToday, hjBesok, hbBesok) {
        const canvas = document.getElementById('predChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (myChart) myChart.destroy();
        const minVal = Math.min(hjToday, hbToday, hjBesok, hbBesok) - 20000;
        myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Jual Kini', 'Buy Kini', 'Est Jual', 'Est Buy'],
                datasets: [
                    {
                        label: 'Harga (IDR)',
                        data: [hjToday, hbToday, hjBesok, hbBesok],
                        backgroundColor: ['rgba(255, 255, 255, 0.1)', 'rgba(212, 175, 55, 0.3)', '#ffffff', '#D4AF37'],
                        borderRadius: 8,
                        borderSkipped: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { min: minVal, grid: { borderDash: [5, 5], color: 'rgba(255,255,255,0.05)' } },
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } }
                }
            }
        });
    }

    function renderPolar(today, besok) {
        const canvas = document.getElementById('polarChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (polarChart) polarChart.destroy();
        let pSangatTurun = 5;
        let pTurun = 15;
        let pStabil = 50;
        let pNaik = 20;
        let pSangatNaik = 10;
        if (besok > today + 8000) {
            pSangatTurun = 5;
            pTurun = 10;
            pStabil = 20;
            pNaik = 40;
            pSangatNaik = 25;
        } else if (besok < today - 8000) {
            pSangatTurun = 25;
            pTurun = 40;
            pStabil = 20;
            pNaik = 10;
            pSangatNaik = 5;
        }
        polarChart = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: ['Strong Bearish', 'Bearish', 'Neutral (Sideways)', 'Bullish', 'Strong Bullish'],
                datasets: [
                    {
                        data: [pSangatTurun, pTurun, pStabil, pNaik, pSangatNaik],
                        backgroundColor: [
                            'rgba(239, 68, 68, 0.7)',
                            'rgba(239, 68, 68, 0.4)',
                            'rgba(255, 255, 255, 0.1)',
                            'rgba(16, 185, 129, 0.4)',
                            'rgba(16, 185, 129, 0.7)'
                        ],
                        borderColor: '#111318'
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
                            label: (c) => `${c.label}: ${c.raw}% Probabilitas`
                        }
                    }
                },
                scales: { r: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { display: false } } }
            }
        });
    }

    function renderGauge(today, besok) {
        const canvas = document.getElementById('gaugeChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (gaugeChart) gaugeChart.destroy();
        const diff = besok - today;
        let signalValue = 50;
        let signalText = 'NEUTRAL';
        let signalColor = '#D4AF37';
        if (diff > 8000) {
            signalValue = 85;
            signalText = 'BUY SIGNAL';
            signalColor = '#10B981';
        } else if (diff < -8000) {
            signalValue = 15;
            signalText = 'SELL SIGNAL';
            signalColor = '#EF4444';
        }
        const labelEl = document.getElementById('gaugeLabel');
        if (labelEl) {
            labelEl.textContent = signalText;
            labelEl.style.color = signalColor;
        }
        gaugeChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Indikator'],
                datasets: [
                    {
                        data: [signalValue, 100 - signalValue],
                        backgroundColor: [signalColor, '#2a2a2a'],
                        borderWidth: 0,
                        circumference: 180,
                        rotation: 270
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        const simKurs = document.getElementById('simKurs');
        const simGold = document.getElementById('simGold');
        const btnRunSim = document.getElementById('btnRunSim');
        const btnHitung = document.getElementById('btnHitungSimulasi');
        if (!simKurs) return;

        loadPortfolio();

        simKurs.addEventListener('input', function () {
            document.getElementById('valSimKurs').textContent = parseInt(this.value, 10).toLocaleString('id-ID').replace(/,/g, '.');
        });
        simGold.addEventListener('input', function () {
            document.getElementById('valSimGold').textContent = parseInt(this.value, 10).toLocaleString('id-ID').replace(/,/g, '.');
        });

        document.addEventListener('marketStatusLoaded', (e) => {
            const d = e.detail;
            if (!d) return;
            const parsedAntam = parseInt(String(d.antam).replace(/[^0-9]/g, ''), 10);
            const parsedBuyback = parseInt(String(d.buyback).replace(/[^0-9]/g, ''), 10);
            if (!isNaN(parsedAntam) && parsedAntam > 0) currentAntamPrice = parsedAntam;
            if (!isNaN(parsedBuyback) && parsedBuyback > 0) currentBuybackPrice = parsedBuyback;
        });

        fetch('/api/chart_data')
            .then((r) => r.json())
            .then((data) => {
                if (data.status === 'success') {
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
                                    <td class="text-muted">${sma7}</td>
                                    <td class="text-muted">${sma30}</td>
                                </tr>
                            `;
                        }
                        tbody.innerHTML = html;
                    }
                }
            });

        if (btnRunSim) {
            btnRunSim.addEventListener('click', function () {
                const btn = this;
                const originalText = btn.innerHTML;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm text-dark"></span> Kalkulasi AI SVR...';
                btn.disabled = true;

                document.getElementById('simActualResult').classList.add('d-none');
                document.getElementById('simLoading').classList.remove('d-none');
                document.getElementById('aiSummaryBox').classList.add('d-none');

                fetch('/api/simulate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        kurs: simKurs.value,
                        gold_global: simGold.value,
                        dxy: document.getElementById('simDxy').value,
                        wti: document.getElementById('simWti').value
                    })
                })
                    .then((res) => res.json())
                    .then((data) => {
                        document.getElementById('simLoading').classList.add('d-none');
                        document.getElementById('simActualResult').classList.remove('d-none');

                        if (data.status === 'success') {
                            document.getElementById('simResultValue').textContent = data.formatted;
                            const rawResult = parseInt(data.formatted.replace(/[^0-9]/g, ''), 10);
                            const currentGold = currentAntamPrice || 2598000;
                            const selisih = rawResult - currentGold;
                            const arah =
                                selisih > 0
                                    ? 'mengalami penguatan (NAIK)'
                                    : selisih < 0
                                    ? 'mengalami koreksi (TURUN)'
                                    : 'cenderung STABIL';
                            const rekomendasi =
                                selisih > 8000
                                    ? 'BUY (Akumulasi Aset)'
                                    : selisih < -8000
                                    ? 'SELL (Amankan Margin)'
                                    : 'HOLD (Wait & See)';

                            const narasi = `<strong>Market Outlook:</strong> Jika Indeks Dolar AS (DXY) bertahan di level ${document.getElementById('simDxy').value} dan sentimen global kondusif, momentum Emas Antam esok hari diproyeksikan <strong>${arah}</strong> sekitar Rp ${Math.abs(selisih).toLocaleString('id-ID')} per gram. <br>Berdasarkan kalkulasi volatilitas, rekomendasi teknikal model adalah: <strong class="text-gold" style="text-decoration: underline;">${rekomendasi}</strong>.`;

                            document.getElementById('aiSummaryText').innerHTML = narasi;
                            document.getElementById('aiSummaryBox').classList.remove('d-none');
                            document.getElementById('resultContainer').style.display = 'flex';

                            document.getElementById('sellToday').textContent = formatRupiah(currentGold);
                            document.getElementById('sellBesok').textContent = data.formatted;
                            document.getElementById('calcHargaJual').value = currentBuybackPrice || currentGold - 160000;

                            renderChart(currentGold, currentBuybackPrice, rawResult, rawResult - 160000);
                            renderGauge(currentGold, rawResult);
                            renderPolar(currentGold, rawResult);
                            document.getElementById('aiSummaryBox').scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    })
                    .finally(() => {
                        btn.innerHTML = originalText;
                        btn.disabled = false;
                    });
            });
        }

        if (btnHitung) {
            btnHitung.addEventListener('click', function () {
                const pInputs = document.querySelectorAll('.price-input');
                const gInputs = document.querySelectorAll('.gram-input');
                const currentJual = parseFloat(document.getElementById('calcHargaJual').value);
                if (!currentJual) {
                    if (window.AppUI) window.AppUI.showToast('Silakan isi Harga Buyback!', 'fa-circle-exclamation');
                    return;
                }
                let totalCost = 0;
                let totalGrams = 0;
                pInputs.forEach((inp, i) => {
                    const p = parseFloat(inp.value);
                    const g = parseFloat(gInputs[i] ? gInputs[i].value : 0);
                    if (p && g) {
                        totalCost += p * g;
                        totalGrams += g;
                    }
                });
                if (totalGrams === 0) {
                    if (window.AppUI) window.AppUI.showToast('Masukkan minimal satu riwayat beli!', 'fa-circle-exclamation');
                    return;
                }

                const avgPrice = totalCost / totalGrams;
                let currentVal = currentJual * totalGrams;
                if (currentVal > 10000000) {
                    currentVal = currentVal - currentVal * 0.015;
                }
                const diff = currentVal - totalCost;
                const percent = (diff / totalCost) * 100;
                const resBox = document.getElementById('calcResult');
                resBox.classList.remove('d-none');

                const resText = document.getElementById('resProfitText');
                if (diff >= 0) {
                    resBox.style.background = 'rgba(16, 185, 129, 0.1)';
                    resBox.style.borderColor = '#10B981';
                    resText.style.color = '#10B981';
                    resText.textContent = `PROFIT: +${formatRupiah(diff)}`;
                } else {
                    resBox.style.background = 'rgba(239, 68, 68, 0.1)';
                    resBox.style.borderColor = '#EF4444';
                    resText.style.color = '#EF4444';
                    resText.textContent = `RUGI: -${formatRupiah(Math.abs(diff))}`;
                }

                document.getElementById('resGrams').textContent = `${totalGrams} gr`;
                document.getElementById('resAvg').textContent = formatRupiah(avgPrice);
                document.getElementById('resModal').textContent = formatRupiah(totalCost);
                document.getElementById('resPercent').textContent = `${percent.toFixed(2)}%`;
                savePortfolio(false);
            });
        }
    });
})();
