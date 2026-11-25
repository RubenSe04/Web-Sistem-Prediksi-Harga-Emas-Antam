/**
 * DASHBOARD ANALYTICS MODULE — HISTORICAL CHART, SMA/RSI TOGGLE, & 5-VARIABLE IMPORTANCE
 */

(function () {
    let histChart = null;

    if (typeof Chart !== 'undefined') {
        Chart.defaults.color = '#8c8c8c';
        Chart.defaults.borderColor = 'rgba(212, 175, 55, 0.1)';
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
        let csvContent = 'data:text/csv;charset=utf-8,Tanggal,Harga Antam,SMA 7,SMA 30,Sinyal Pasar\n';
        document.querySelectorAll('#dataTableBody tr').forEach((row) => {
            if (row.style.display === 'none') return;
            const cols = row.querySelectorAll('td');
            if (cols.length < 5) return;
            const rowData = Array.from(cols).map((c) => c.innerText.replace(/,/g, '').replace(/\./g, '').trim());
            csvContent += rowData.join(',') + '\n';
        });
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', 'Laporan_Historis_SVR.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (window.AppUI) window.AppUI.showToast('CSV berhasil diunduh');
    };

    document.addEventListener('DOMContentLoaded', () => {
        const histCanvas = document.getElementById('historicalChart');
        if (!histCanvas) return;

        fetch('/api/chart_data')
            .then((r) => r.json())
            .then((data) => {
                if (data.status !== 'success') return;

                if (data.metrics) {
                    const rmseEl = document.getElementById('valRMSE');
                    const maeEl = document.getElementById('valMAE');
                    const r2El = document.getElementById('valR2');
                    if (rmseEl) rmseEl.textContent = data.metrics.rmse;
                    if (maeEl) maeEl.textContent = data.metrics.mae;
                    if (r2El) r2El.textContent = data.metrics.r2;
                }

                const ctxHist = histCanvas.getContext('2d');
                const pointColors = data.labels.map((_, i) => (i === data.labels.length - 1 ? '#D4AF37' : 'transparent'));
                const pointRadii = data.labels.map((_, i) => (i === data.labels.length - 1 ? 6 : 0));
                const rsiData = calculateRSI(data.antam_prices);

                histChart = new Chart(ctxHist, {
                    type: 'line',
                    data: {
                        labels: data.labels,
                        datasets: [
                            {
                                label: 'Harga Antam (IDR)',
                                data: data.antam_prices,
                                borderColor: '#ffffff',
                                borderWidth: 2,
                                pointBackgroundColor: pointColors,
                                pointRadius: pointRadii,
                                pointBorderWidth: 2,
                                pointBorderColor: '#0f1014',
                                tension: 0.4,
                                yAxisID: 'y'
                            },
                            {
                                label: 'SMA 7',
                                data: data.sma7,
                                borderColor: '#D4AF37',
                                borderWidth: 2,
                                pointRadius: 0,
                                borderDash: [5, 5],
                                tension: 0.4,
                                yAxisID: 'y'
                            },
                            {
                                label: 'SMA 30',
                                data: data.sma30,
                                borderColor: '#ef4444',
                                borderWidth: 2,
                                pointRadius: 0,
                                tension: 0.4,
                                yAxisID: 'y'
                            },
                            {
                                label: 'RSI (14)',
                                data: rsiData,
                                borderColor: '#3B82F6',
                                borderWidth: 1.5,
                                pointRadius: 0,
                                borderDash: [2, 2],
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
                                labels: { boxWidth: 12, usePointStyle: true, color: '#ffffff' }
                            }
                        },
                        scales: {
                            y: {
                                grid: { color: 'rgba(255,255,255,0.05)', borderDash: [5, 5] },
                                type: 'linear',
                                position: 'left'
                            },
                            y1: {
                                grid: { drawOnChartArea: false },
                                type: 'linear',
                                position: 'right',
                                min: 0,
                                max: 100,
                                ticks: { color: '#3B82F6' },
                                display: false
                            },
                            x: { grid: { display: false } }
                        }
                    }
                });

                let smaVisible = true;
                const btnSMA = document.getElementById('btnToggleSMA');
                if (btnSMA) {
                    btnSMA.addEventListener('click', function () {
                        smaVisible = !smaVisible;
                        histChart.setDatasetVisibility(1, smaVisible);
                        histChart.setDatasetVisibility(2, smaVisible);
                        histChart.update();
                        this.innerHTML = smaVisible ? '<i class="fa-solid fa-eye-slash"></i> SMA' : '<i class="fa-solid fa-eye"></i> SMA';
                        this.style.opacity = smaVisible ? '1' : '0.55';
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
                        this.style.backgroundColor = rsiVisible ? '#3B82F6' : 'rgba(212, 175, 55, 0.08)';
                        this.style.color = rsiVisible ? '#ffffff' : 'var(--gold-primary)';
                        this.style.borderColor = rsiVisible ? '#3B82F6' : 'var(--border-gold-strong)';
                    });
                }

                if (data.importance) {
                    const impCanvas = document.getElementById('importanceChart');
                    if (impCanvas) {
                        const ctxImp = impCanvas.getContext('2d');
                        const gradient = ctxImp.createLinearGradient(0, 0, 400, 0);
                        gradient.addColorStop(0, '#AA771C');
                        gradient.addColorStop(1, '#D4AF37');

                        new Chart(ctxImp, {
                            type: 'bar',
                            data: {
                                labels: data.importance.labels,
                                datasets: [
                                    {
                                        data: data.importance.values,
                                        backgroundColor: gradient,
                                        borderRadius: 4
                                    }
                                ]
                            },
                            options: {
                                indexAxis: 'y',
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    x: {
                                        beginAtZero: true,
                                        max: 50,
                                        grid: { color: 'rgba(255,255,255,0.05)' },
                                        ticks: { callback: (v) => v + '%' }
                                    },
                                    y: {
                                        grid: { display: false },
                                        ticks: { color: '#ffffff' }
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
                                        backgroundColor: ['#D4AF37', '#AA771C', '#4b5563', '#10B981', '#3B82F6'],
                                        borderWidth: 0
                                    }
                                ]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                cutout: '75%',
                                plugins: {
                                    legend: {
                                        position: 'right',
                                        labels: { color: '#8c8c8c', font: { size: 11 } }
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
                                labels: ['KURS USD/IDR', 'EMAS GLOBAL', 'ANTAM H-1', 'MINYAK WTI', 'INDEKS DXY'],
                                datasets: [
                                    {
                                        label: 'Sensitivitas',
                                        data: [85, 75, 55, 30, 40],
                                        backgroundColor: 'rgba(212, 175, 55, 0.2)',
                                        borderColor: '#D4AF37',
                                        pointBackgroundColor: '#ffffff',
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
                                        angleLines: { color: 'rgba(255,255,255,0.05)' },
                                        grid: { color: 'rgba(255,255,255,0.05)' },
                                        pointLabels: { color: '#8c8c8c', font: { size: 10 } },
                                        ticks: { display: false, max: 100 }
                                    }
                                }
                            }
                        });
                    }
                }

                const tbody = document.getElementById('dataTableBody');
                if (tbody) {
                    let html = '';
                    for (let i = data.labels.length - 1; i >= 0; i--) {
                        const date = data.labels[i];
                        const price = data.antam_prices[i] ? formatRupiah(data.antam_prices[i]) : '-';
                        const sma7 = data.sma7[i] ? formatRupiah(data.sma7[i]) : '-';
                        const sma30 = data.sma30[i] ? formatRupiah(data.sma30[i]) : '-';

                        let signalBadge = '<span class="status-badge status-badge-gold">Live</span>';
                        if (data.sma7[i] && data.sma30[i]) {
                            if (data.sma7[i] > data.sma30[i]) {
                                signalBadge = '<span class="status-badge status-badge-success"><i class="fa-solid fa-arrow-trend-up"></i> Buy</span>';
                            } else if (data.sma7[i] < data.sma30[i]) {
                                signalBadge = '<span class="status-badge status-badge-danger"><i class="fa-solid fa-arrow-trend-down"></i> Sell</span>';
                            } else {
                                signalBadge = '<span class="status-badge status-badge-gold"><i class="fa-solid fa-minus"></i> Hold</span>';
                            }
                        }

                        const isLive = i === data.labels.length - 1;
                        html += `
                            <tr class="${isLive ? 'row-live' : ''}">
                                <td>${date}</td>
                                <td>${price}</td>
                                <td class="text-muted">${sma7}</td>
                                <td class="text-muted">${sma30}</td>
                                <td>${signalBadge}</td>
                            </tr>
                        `;
                    }
                    tbody.innerHTML = html;
                }

                const filterInput = document.getElementById('tableSearchFilter');
                if (filterInput && tbody) {
                    filterInput.addEventListener('input', function () {
                        const q = this.value.trim().toLowerCase();
                        tbody.querySelectorAll('tr').forEach((tr) => {
                            tr.style.display = tr.innerText.toLowerCase().includes(q) ? '' : 'none';
                        });
                    });
                }
            });
    });
})();
