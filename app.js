document.addEventListener('DOMContentLoaded', () => {
    // --- Bagian 1: Deklarasi Variabel Utama & Seleksi Elemen DOM ---
    let currentLang = localStorage.getItem('language') || 'id';
    let siteTranslations = {}; // Akan diisi oleh data dari file JSON

    const docElement = document.documentElement;
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.querySelector('header nav#main-nav');
    const currentYearSpan = document.getElementById('current-year');
    const themeToggleButton = document.getElementById('theme-toggle');
    const currentThemeIcon = themeToggleButton ? themeToggleButton.querySelector('i') : null;
    const langButtons = document.querySelectorAll('.lang-button');

    // --- Bagian 2: Fungsi-Fungsi Utama ---

    // Fungsi untuk memuat file terjemahan
    async function loadTranslations(lang) {
        try {
            const response = await fetch(`lang/${lang}.json?v=${new Date().getTime()}`); // Cache busting
            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status} for lang/${lang}.json`);
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error(`Could not load ${lang}.json:`, error);
            return null;
        }
    }

    // Fungsi untuk memperbarui aria-label tombol tema
    function updateThemeButtonAriaLabel() {
        if (!themeToggleButton) return;
        const isDark = docElement.classList.contains('dark-theme');
        let labelKey = isDark ? 'themeToggleButtonDark' : 'themeToggleButtonLight';
        let fallbackLabel = isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap';

        if (siteTranslations && siteTranslations[currentLang] && siteTranslations[currentLang][labelKey]) {
            themeToggleButton.setAttribute('aria-label', siteTranslations[currentLang][labelKey]);
        } else {
            themeToggleButton.setAttribute('aria-label', fallbackLabel);
        }
    }

    // Fungsi untuk menerapkan perubahan visual tema
    function applyThemeVisuals(theme) {
        if (theme === 'dark') {
            docElement.classList.add('dark-theme');
            if (currentThemeIcon) currentThemeIcon.className = 'fas fa-sun';
        } else {
            docElement.classList.remove('dark-theme');
            if (currentThemeIcon) currentThemeIcon.className = 'fas fa-moon';
        }
        updateThemeButtonAriaLabel(); // Selalu update label setelah tema berubah
    }

    // Fungsi untuk memperbarui semua teks di halaman berdasarkan bahasa
    function updateTexts() {
        if (!siteTranslations || !siteTranslations[currentLang]) {
            console.warn(`Terjemahan untuk bahasa "${currentLang}" tidak tersedia.`);
            return;
        }
        const translations = siteTranslations[currentLang];

        document.querySelectorAll('[data-lang-key]').forEach(el => {
            const key = el.dataset.langKey;
            if (translations[key] !== undefined) el.innerHTML = translations[key];
        });
        document.querySelectorAll('[data-lang-key-alt]').forEach(el => {
            const key = el.dataset.langKeyAlt;
            if (translations[key] !== undefined) el.alt = translations[key];
        });
        document.querySelectorAll('[data-lang-key-placeholder]').forEach(el => {
            const key = el.dataset.langKeyPlaceholder;
            if (translations[key] !== undefined) el.placeholder = translations[key];
        });
        document.querySelectorAll('[data-lang-key-aria-label]').forEach(el => {
            const key = el.dataset.langKeyAriaLabel;
            if (translations[key] !== undefined) el.setAttribute('aria-label', translations[key]);
        });
        document.querySelectorAll('[data-lang-key-tel]').forEach(el => {
            const key = el.dataset.langKeyTel;
            if (translations[key] !== undefined) el.href = `tel:${translations[key]}`;
        });
        document.querySelectorAll('[data-lang-key-email]').forEach(el => {
            const key = el.dataset.langKeyEmail;
            if (translations[key] !== undefined) el.href = `mailto:${translations[key]}`;
        });


        const pageTitleEl = document.querySelector('title');
        if (pageTitleEl && translations.pageTitle) pageTitleEl.textContent = translations.pageTitle;

        const metaDescriptionEl = document.querySelector('meta[name="description"]');
        if (metaDescriptionEl && translations.metaDescription) metaDescriptionEl.setAttribute('content', translations.metaDescription);

        docElement.lang = currentLang;
    }

    // Fungsi untuk mengatur dan menerapkan bahasa baru
    async function setLanguage(lang) {
        if (!lang || (lang !== 'id' && lang !== 'en')) lang = 'id'; // Fallback

        // Hanya muat jika terjemahan belum ada atau bahasa berubah
        if (!siteTranslations[lang]) {
            const newTranslations = await loadTranslations(lang);
            if (newTranslations) {
                siteTranslations[lang] = newTranslations;
            } else {
                console.error(`Gagal memuat terjemahan untuk "${lang}". Menggunakan bahasa sebelumnya atau default.`);
                // Jika bahasa saat ini gagal dimuat, jangan ubah currentLang kecuali ini adalah pemuatan awal
                if (Object.keys(siteTranslations).length === 0) { // Jika belum ada terjemahan sama sekali
                    currentLang = 'id'; // Default keras
                    docElement.lang = currentLang;
                }
                updateTexts(); // Coba update dengan apa pun yang ada
                updateThemeButtonAriaLabel();
                return; // Keluar jika gagal memuat terjemahan baru
            }
        }

        currentLang = lang; // Tetapkan bahasa saat ini setelah berhasil memuat (jika perlu)
        localStorage.setItem('language', currentLang);

        updateTexts();
        updateThemeButtonAriaLabel();

        langButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.lang === currentLang);
        });
    }

    // --- Bagian 3: Logika Event Listener & Inisialisasi ---

    // Toggle Menu Mobile
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
            mainNav.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', !isExpanded);
            // Teks tombol akan diatur oleh updateTexts jika ada data-lang-key
            if (!menuToggle.dataset.langKeyAriaLabel) {
                menuToggle.textContent = mainNav.classList.contains('active') ? '✕' : '☰';
            }
        });
    }

    // Smooth Scroll & Tutup Menu
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetHref = this.getAttribute('href');
            if (targetHref.startsWith('#') && targetHref.length > 1) {
                e.preventDefault();
                if (mainNav && mainNav.classList.contains('active')) {
                    mainNav.classList.remove('active');
                    if (menuToggle) {
                        menuToggle.setAttribute('aria-expanded', 'false');
                        if (!menuToggle.dataset.langKeyAriaLabel) menuToggle.textContent = '☰';
                    }
                }
                const targetElement = document.querySelector(targetHref);
                if (targetElement) targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Tahun Dinamis di Footer
    if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();

    // Event Listener Tombol Tema
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            let newTheme = docElement.classList.contains('dark-theme') ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyThemeVisuals(newTheme);
        });
    }

    // Event Listener Tombol Bahasa
    if (langButtons.length > 0) {
        langButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const newLang = e.target.dataset.lang;
                if (newLang !== currentLang || !siteTranslations[newLang]) { // Muat jika bahasa baru atau belum dimuat
                    setLanguage(newLang);
                }
            });
        });
    }

    // Fungsi Inisialisasi Halaman Utama
    async function initializePage() {
        // 1. Terapkan tema visual awal (ikon tombol)
        // Kelas .dark-theme pada <html> sudah diatur oleh skrip inline di <head>
        const initialTheme = docElement.classList.contains('dark-theme') ? 'dark' : 'light';
        if (currentThemeIcon) { // Pastikan ikon ada
             currentThemeIcon.className = initialTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }

        // 2. Muat dan terapkan bahasa awal
        await setLanguage(currentLang); // Ini akan memuat JSON, update teks & label tombol tema

        // 3. Panggil updateThemeButtonAriaLabel sekali lagi untuk memastikan label sudah benar
        //    setelah bahasa dan tema awal diterapkan.
        updateThemeButtonAriaLabel();
    }

    initializePage(); // Panggil fungsi inisialisasi
});