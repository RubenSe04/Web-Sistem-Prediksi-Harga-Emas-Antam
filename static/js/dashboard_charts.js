/**
 * DASHBOARD ANALYTICS MODULE — HISTORICAL CHART, SMA/RSI TOGGLE, FEATURE IMPORTANCE, & TABLE FILTER
 * Mengelola seluruh visualisasi ilmiah dan tabel log historis pada halaman /dashboard.
 */

(function () {
    let histChart = null;

    if (typeof Chart !== 'undefined') {
        Chart.defaults.color = '#94A3B8';
        Chart.defaults.borderColor = 'rgba(212, 175, 55, 0.12)';
        Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
    }

    function formatRupiah(num) {
        return 'Rp ' + Math.round(num).toLocaleString('id-ID').replace(/,/g, '.');
    }

    function calculateRSI(prices, period = 14) {
        const rsi = new Array(prices.length).fill(null);
        if (prices.length <= period) return rsi;

        let gains = 0;
        let losses = 0;
        for (let i = 1; i <= period; i++) {
            const change = prices[i] - prices[i - 1];
            if (change > 0) gains += change;
            else losses -= change;
        }
        let avgGain = gains / period;
        let avgLoss = losses / period;
        let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi[period] = 100 - 100 / (1 + rs);

        for (let i = period + 1; i < prices.length; i++) {
            const change = prices[i] - prices[i - 1];
            const gain = change > 0 ? change : 0;
            const loss = change < 0 ? -change : 0;
            avgGain = (avgGain * (period - 1) + gain) / period;
            avgLoss = (avgLoss * (period - 1) + loss) / period;
            rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
            rsi[i] = 100 - 100 / (1 + rs);
        }
        return rsi;
    }

    window.downloadDashboardCSV = function () {
        let csvContent = 'data:text/csv;charset=utf-8,Tanggal,Harga Antam (1gr),SMA 7,SMA 30,Sinyal Pasar\n';
        document.querySelectorAll('#dataTableBody tr').forEach((row) => {
            if (row.style.display === 'none') return;
            const cols = row.querySelectorAll('td');
            if (cols.length < 5) return;
            const rowData = Array.from(cols).map((c) => c.innerText.replace(/,/g, '').replace(/\./g, '').trim());
            csvContent += rowData.join(',') + '\n';
        });
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', 'Laporan_Analitik_Historis_SVR.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (window.AppUI) window.AppUI.showToast('Laporan CSV berhasil diunduh', 'fa-file-csv');
    };

    document.addEventListener('DOMContentLoaded', () => {
        const histCanvas = document.getElementById('historicalChart');
        if (!histCanvas) return; // Bukan halaman Dashboard

        fetch('/api/chart_data')
            .then((r) => r.json())
            .then((data) => {
                if (data.status !== 'success') return;

                // 1. Update Metrik Validasi Ilmiah
                if (data.metrics) {
                    const rmseEl = document.getElementById('valRMSE');
                    const maeEl = document.getElementById('valMAE');
                    const r2El = document.getElementById('valR2');
                    if (rmseEl) rmseEl.textContent = data.metrics.rmse;
                    if (maeEl) maeEl.textContent = data.metrics.mae;
                    if (r2El) r2El.textContent = data.metrics.r2;
                }

                // 2. Render Grafik Tren Historis (dengan Area Gradient Emas ala Referensi)
                const ctxHist = histCanvas.getContext('2d');
                const areaGradient = ctxHist.createLinearGradient(0, 0, 0, 340);
                areaGradient.addColorStop(0, 'rgba(212, 175, 55, 0.28)');
                areaGradient.addColorStop(1, 'rgba(212, 175, 55, 0.00)');

                const pointColors = data.labels.map((_, i) => (i === data.labels.length - 1 ? '#D4AF37' : 'transparent'));
                const pointRadii = data.labels.map((_, i) => (i === data.labels.length - 1 ? 6 : 0));
                const rsiData = calculateRSI(data.antam_prices);

                histChart = new Chart(ctxHist, {
                    type: 'line',
                    data: {
                        labels: data.labels,
                        datasets: [
                            {
                                label: 'Harga Emas Antam (IDR)',
                                data: data.antam_prices,
                                borderColor: '#D4AF37',
                                backgroundColor: areaGradient,
                                fill: true,
                                borderWidth: 2.5,
                                pointBackgroundColor: pointColors,
                                pointRadius: pointRadii,
                                pointHoverRadius: 5,
                                tension: 0.35,
                                yAxisID: 'y'
                            },
                            {
                                label: 'SMA 7 (Tren Pendek)',
                                data: data.sma7,
                                borderColor: '#F8FAFC',
                                borderWidth: 1.8,
                                pointRadius: 0,
                                borderDash: [5, 5],
                                tension: 0.35,
                                yAxisID: 'y'
                            },
                            {
                                label: 'SMA 30 (Tren Panjang)',
                                data: data.sma30,
                                borderColor: '#10B981',
                                borderWidth: 1.8,
                                pointRadius: 0,
                                tension: 0.35,
                                yAxisID: 'y'
                            },
                            {
                                label: 'Momentum RSI (14)',
                                data: rsiData,
                                borderColor: '#38BDF8',
                                borderWidth: 1.5,
                                pointRadius: 0,
                                borderDash: [3, 3],
                                tension: 0.3,
                                yAxisID: 'y1',
                                hidden: true
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: { mode: 'index', intersect: false },
                        plugins: {
                            legend: {
                                position: 'top',
                                labels: { boxWidth: 12, usePointStyle: true, color: '#CBD5E1', font: { size: 12 } }
                            },
                            tooltip: {
                                callbacks: {
                                    label: (ctx) => {
                                        if (ctx.dataset.yAxisID === 'y1') {
                                            return `${ctx.dataset.label}: ${ctx.raw ? ctx.raw.toFixed(1) : '-'} poin`;
                                        }
                                        return `${ctx.dataset.label}: ${ctx.raw ? formatRupiah(ctx.raw) : '-'}`;
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                grid: { color: 'rgba(255,255,255,0.06)' },
                                type: 'linear',
                                position: 'left',
                                ticks: {
                                    callback: (val) => 'Rp ' + (val / 1000000).toFixed(2) + ' Jt'
                                }
                            },
                            y1: {
                                grid: { drawOnChartArea: false },
                                type: 'linear',
                                position: 'right',
                                min: 0,
                                max: 100,
                                ticks: { color: '#38BDF8' },
                                display: false
                            },
                            x: {
                                grid: { display: false },
                                ticks: { maxTicksLimit: 10 }
                            }
                        }
                    }
                });

                // Toggle SMA & RSI
                let smaVisible = true;
                const btnSMA = document.getElementById('btnToggleSMA');
                if (btnSMA) {
                    btnSMA.addEventListener('click', function () {
                        smaVisible = !smaVisible;
                        histChart.setDatasetVisibility(1, smaVisible);
                        histChart.setDatasetVisibility(2, smaVisible);
                        histChart.update();
                        this.classList.toggle('active', smaVisible);
                        this.setAttribute('aria-pressed', String(smaVisible));
                    });
                }

                let rsiVisible = false;
                const btnRSI = document.getElementById('btnToggleRSI');
                if (btnRSI) {
                    btnRSI.addEventListener('click', function () {
                        rsiVisible = !rsiVisible;
                        histChart.setDatasetVisibility(3, rsiVisible);
                        histChart.options.scales.y1.display = rsiVisible;
                        histChart.update();
                        this.classList.toggle('active', rsiVisible);
                        this.setAttribute('aria-pressed', String(rsiVisible));
                    });
                }

                // 3. Render Grafik Bobot & Sensitivitas Variabel
                if (data.importance) {
                    const impCanvas = document.getElementById('importanceChart');
                    if (impCanvas) {
                        const ctxImp = impCanvas.getContext('2d');
                        const barGrad = ctxImp.createLinearGradient(0, 0, 380, 0);
                        barGrad.addColorStop(0, '#B58E24');
                        barGrad.addColorStop(1, '#E5C158');

                        new Chart(ctxImp, {
                            type: 'bar',
                            data: {
                                labels: data.importance.labels,
                                datasets: [
                                    {
                                        label: 'Kontribusi (%)',
                                        data: data.importance.values,
                                        backgroundColor: barGrad,
                                        borderRadius: 6
                                    }
                                ]
                            },
                            options: {
                                indexAxis: 'y',
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                        callbacks: { label: (c) => `Bobot Pengaruh: ${c.raw}%` }
                                    }
                                },
                                scales: {
                                    x: {
                                        beginAtZero: true,
                                        max: 50,
                                        grid: { color: 'rgba(255,255,255,0.06)' },
                                        ticks: { callback: (v) => v + '%' }
                                    },
                                    y: {
                                        grid: { display: false },
                                        ticks: { color: '#F8FAFC', font: { weight: '600' } }
                                    }
                                }
                            }
                        });
                    }

                    const doughnutCanvas = document.getElementById('doughnutChart');
                    if (doughnutCanvas) {
                        new Chart(doughnutCanvas.getContext('2d'), {
                            type: 'doughnut',
                            data: {
                                labels: data.importance.labels,
                                datasets: [
                                    {
                                        data: data.importance.values,
                                        backgroundColor: ['#D4AF37', '#B58E24', '#10B981', '#38BDF8', '#64748B'],
                                        borderColor: '#111318',
                                        borderWidth: 2
                                    }
                                ]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                cutout: '72%',
                                plugins: {
                                    legend: {
                                        position: 'right',
                                        labels: { color: '#CBD5E1', font: { size: 12 }, padding: 14 }
                                    }
                                }
                            }
                        });
                    }

                    const radarCanvas = document.getElementById('radarChart');
                    if (radarCanvas) {
                        new Chart(radarCanvas.getContext('2d'), {
                            type: 'radar',
                            data: {
                                labels: ['Kurs USD/IDR', 'Spot XAU/USD', 'Antam (H-1)', 'Minyak WTI', 'Indeks DXY'],
                                datasets: [
                                    {
                                        label: 'Indeks Sensitivitas',
                                        data: [88, 78, 56, 34, 42],
                                        backgroundColor: 'rgba(212, 175, 55, 0.20)',
                                        borderColor: '#D4AF37',
                                        pointBackgroundColor: '#F8FAFC',
                                        pointBorderColor: '#D4AF37',
                                        borderWidth: 2
                                    }
                                ]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    r: {
                                        angleLines: { color: 'rgba(255,255,255,0.08)' },
                                        grid: { color: 'rgba(255,255,255,0.08)' },
                                        pointLabels: { color: '#CBD5E1', font: { size: 11, weight: '600' } },
                                        ticks: { display: false, max: 100 }
                                    }
                                }
                            }
                        });
                    }
                }

                // 4. Populate Tabel Log Data Historis
                const tbody = document.getElementById('dataTableBody');
                if (tbody) {
                    let html = '';
                    for (let i = data.labels.length - 1; i >= 0; i--) {
                        const date = data.labels[i];
                        const price = data.antam_prices[i] ? formatRupiah(data.antam_prices[i]) : '-';
                        const sma7 = data.sma7[i] ? formatRupiah(data.sma7[i]) : '-';
                        const sma30 = data.sma30[i] ? formatRupiah(data.sma30[i]) : '-';

                        let signalBadge = '<span class="status-badge status-badge-gold">LiveAktual</span>';
                        if (data.sma7[i] && data.sma30[i]) {
                            if (data.sma7[i] > data.sma30[i]) {
                                signalBadge = '<span class="status-badge status-badge-success"><i class="fa-solid fa-arrow-trend-up" aria-hidden="true"></i> Tren Bullish (Buy)</span>';
                            } else if (data.sma7[i] < data.sma30[i]) {
                                signalBadge = '<span class="status-badge status-badge-danger"><i class="fa-solid fa-arrow-trend-down" aria-hidden="true"></i> Tren Koreksi (Sell)</span>';
                            } else {
                                signalBadge = '<span class="status-badge status-badge-gold"><i class="fa-solid fa-minus" aria-hidden="true"></i> Netral (Hold)</span>';
                            }
                        }

                        const isLive = i === data.labels.length - 1;
                        html += `
                            <tr class="${isLive ? 'row-live' : ''}">
                                <td>${date}</td>
                                <td>${price}</td>
                                <td class="text-secondary-light">${sma7}</td>
                                <td class="text-secondary-light">${sma30}</td>
                                <td>${signalBadge}</td>
                            </tr>
                        `;
                    }
                    tbody.innerHTML = html;
                }

                // 5. Filter Pencarian Tabel
                const filterInput = document.getElementById('tableSearchFilter');
                if (filterInput && tbody) {
                    filterInput.addEventListener('input', function () {
                        const q = this.value.trim().toLowerCase();
                        tbody.querySelectorAll('tr').forEach((tr) => {
                            const text = tr.innerText.toLowerCase();
                            tr.style.display = text.includes(q) ? '' : 'none';
                        });
                    });
                }
            });
    });
})();
