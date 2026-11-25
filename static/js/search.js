/**
 * INTERNAL QUICK SEARCH MODULE (Ctrl+K / Cmd+K)
 * Memungkinkan pencarian cepat halaman, fitur simulator, kalkulator pajak, dan metrik SVR.
 */

(function () {
    document.addEventListener('DOMContentLoaded', () => {
        const modal = document.getElementById('searchModalOverlay');
        const openBtn = document.getElementById('btnOpenSearch');
        const closeBtn = document.getElementById('btnCloseSearch');
        const input = document.getElementById('quickSearchInput');
        const resultsList = document.getElementById('quickSearchResults');

        if (!modal || !input || !resultsList) return;

        const searchItems = Array.isArray(window.SITE_SEARCH_INDEX) ? window.SITE_SEARCH_INDEX : [];

        function renderResults(query = '') {
            const q = query.trim().toLowerCase();
            const filtered = searchItems.filter((item) => {
                if (!q) return true;
                const haystack = `${item.title} ${item.category} ${item.description} ${item.keywords || ''}`.toLowerCase();
                return haystack.includes(q);
            });

            if (filtered.length === 0) {
                resultsList.innerHTML = `
                    <li class="p-4 text-center text-muted">
                        Tidak ditemukan fitur atau halaman untuk kata kunci "<strong>${query}</strong>".
                    </li>
                `;
                return;
            }

            resultsList.innerHTML = filtered
                .map(
                    (item) => `
                    <li class="search-result-item">
                        <a href="${item.url}" class="search-result-link">
                            <div>
                                <div class="search-result-category">${item.category}</div>
                                <div class="search-result-title">${item.title}</div>
                                <p class="search-result-desc">${item.description}</p>
                            </div>
                            <i class="fa-solid fa-arrow-right text-gold" aria-hidden="true"></i>
                        </a>
                    </li>
                `
                )
                .join('');

            resultsList.querySelectorAll('.search-result-link').forEach((link) => {
                link.addEventListener('click', () => {
                    closeSearchModal();
                });
            });
        }

        function openSearchModal() {
            modal.classList.add('show');
            modal.setAttribute('aria-hidden', 'false');
            input.value = '';
            renderResults('');
            setTimeout(() => input.focus(), 50);
        }

        function closeSearchModal() {
            modal.classList.remove('show');
            modal.setAttribute('aria-hidden', 'true');
        }

        if (openBtn) openBtn.addEventListener('click', openSearchModal);
        if (closeBtn) closeBtn.addEventListener('click', closeSearchModal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeSearchModal();
        });

        input.addEventListener('input', (e) => {
            renderResults(e.target.value);
        });

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                if (modal.classList.contains('show')) {
                    closeSearchModal();
                } else {
                    openSearchModal();
                }
            } else if (e.key === 'Escape' && modal.classList.contains('show')) {
                closeSearchModal();
            }
        });
    });
})();
