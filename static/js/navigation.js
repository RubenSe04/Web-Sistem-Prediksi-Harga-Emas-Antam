/**
 * NAVIGATION, TOAST, & GLOBAL MARKET TICKER MODULE
 * Mengelola drawer mobile, aksesibilitas keyboard (Esc), toast notification, dan sinkronisasi ticker.
 */

window.AppUI = (function () {
    let toastTimer = null;

    function showToast(message, iconClass = 'fa-circle-check') {
        const toastEl = document.getElementById('globalToast');
        const toastMsg = document.getElementById('globalToastMsg');
        const toastIcon = document.getElementById('globalToastIcon');
        if (!toastEl || !toastMsg) return;

        toastMsg.textContent = message;
        if (toastIcon) {
            toastIcon.className = `fa-solid ${iconClass} text-gold`;
        }

        toastEl.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toastEl.classList.remove('show');
        }, 2400);
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
                        <span class="ticker-node"><i class="fa-solid fa-coins text-gold" aria-hidden="true"></i> Antam Jual (1g): <strong>${data.antam}</strong></span>
                        <span class="ticker-node"><i class="fa-solid fa-hand-holding-dollar text-gold" aria-hidden="true"></i> Buyback: <strong>${data.buyback}</strong></span>
                        <span class="ticker-node"><i class="fa-solid fa-globe text-gold" aria-hidden="true"></i> Spot XAU/USD: <strong style="color: var(--status-success);">${data.global_gold}</strong></span>
                        <span class="ticker-node"><i class="fa-solid fa-money-bill-transfer text-gold" aria-hidden="true"></i> USD/IDR: <strong>${data.usd_idr}</strong></span>
                        <span class="ticker-node"><i class="fa-solid fa-chart-line text-gold" aria-hidden="true"></i> Indeks DXY: <strong>${data.dxy}</strong></span>
                        <span class="ticker-node"><i class="fa-solid fa-droplet text-gold" aria-hidden="true"></i> Minyak WTI: <strong>${data.wti}</strong></span>
                    `;
                }

                // Isi kartu KPI di halaman Beranda jika ada
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
                    if (el) el.textContent = mapIds[id];
                });

                document.dispatchEvent(new CustomEvent('marketStatusLoaded', { detail: data }));
            })
            .catch(() => {
                if (tickerEl) {
                    tickerEl.innerHTML = `<span class="ticker-node">Data pasar menggunakan mode sinkronisasi cadangan.</span>`;
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
