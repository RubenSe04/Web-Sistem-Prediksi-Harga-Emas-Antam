/**
 * NAVIGATION, TOAST, & RUNNING MARKET TICKER MODULE
 * Menghidupkan kembali animasi berjalan (Running Ticker) 6 status variabel makro & emas Antam.
 */

window.AppUI = (function () {
    let toastTimer = null;

    function showToast(message, iconClass = 'fa-check-circle') {
        const toastEl = document.getElementById('globalToast');
        const toastMsg = document.getElementById('globalToastMsg');
        const toastIcon = document.getElementById('globalToastIcon');
        if (!toastEl || !toastMsg) return;

        toastMsg.textContent = message;
        if (toastIcon) {
            toastIcon.className = `fa-solid ${iconClass}`;
        }

        toastEl.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toastEl.classList.remove('show');
        }, 1800);
    }

    function initSidebarDrawer() {
        const sidebar = document.getElementById('appSidebar');
        const backdrop = document.getElementById('sidebarBackdrop');
        const openBtn = document.getElementById('btnOpenSidebar');
        const closeBtn = document.getElementById('btnCloseSidebar');

        if (!sidebar) return;

        function openSidebar() {
            sidebar.classList.add('show');
            if (backdrop) backdrop.classList.add('show');
            if (openBtn) openBtn.setAttribute('aria-expanded', 'true');
        }

        function closeSidebar() {
            sidebar.classList.remove('show');
            if (backdrop) backdrop.classList.remove('show');
            if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
        }

        if (openBtn) openBtn.addEventListener('click', openSidebar);
        if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
        if (backdrop) backdrop.addEventListener('click', closeSidebar);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('show')) {
                closeSidebar();
            }
        });
    }

    function updateClockSync() {
        const timeEl = document.getElementById('timeSync');
        if (!timeEl) return;
        const now = new Date();
        const formatted = now.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });
        timeEl.textContent = `${formatted} WIB`;
    }

    function loadGlobalTicker() {
        const tickerEl = document.getElementById('liveTicker');
        fetch('/market_status')
            .then((res) => res.json())
            .then((data) => {
                if (data.status !== 'success') return;

                if (tickerEl) {
                    tickerEl.innerHTML = `
                        <span class="ticker-item"><i class="fa-solid fa-coins text-gold"></i> ANTAM JUAL: <span class="ticker-value text-white">${data.antam}</span></span>
                        <span class="ticker-item"><i class="fa-solid fa-hand-holding-dollar text-gold"></i> ANTAM BUYBACK: <span class="ticker-value text-white">${data.buyback}</span></span>
                        <span class="ticker-item"><i class="fa-solid fa-globe text-gold"></i> GLOBAL XAU/USD: <span class="ticker-value" style="color: #10B981;">${data.global_gold}</span></span>
                        <span class="ticker-item"><i class="fa-solid fa-money-bill-transfer text-gold"></i> KURS USD/IDR: <span class="ticker-value" style="color: #EF4444;">${data.usd_idr}</span></span>
                        <span class="ticker-item"><i class="fa-solid fa-chart-line text-gold"></i> INDEKS DXY: <span class="ticker-value text-white">${data.dxy}</span></span>
                        <span class="ticker-item"><i class="fa-solid fa-droplet text-gold"></i> MINYAK WTI: <span class="ticker-value text-white">${data.wti}</span></span>
                    `;
                }

                const mapIds = {
                    liveAntam: data.antam,
                    liveBuyback: data.buyback,
                    liveGlobal: data.global_gold,
                    liveKurs: data.usd_idr,
                    liveDxy: data.dxy,
                    liveWti: data.wti
                };
                Object.keys(mapIds).forEach((id) => {
                    const el = document.getElementById(id);
                    if (el) {
                        el.textContent = mapIds[id];
                        el.classList.remove('value-updated');
                        void el.offsetWidth;
                        el.classList.add('value-updated');
                    }
                });

                document.dispatchEvent(new CustomEvent('marketStatusLoaded', { detail: data }));
            })
            .catch(() => {
                if (tickerEl) {
                    tickerEl.innerHTML = `<span class="ticker-item">Memuat Sinkronisasi Pasar...</span>`;
                }
            });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initSidebarDrawer();
        updateClockSync();
        loadGlobalTicker();
    });

    return {
        showToast
    };
})();
