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

        if (!siteTranslations[lang]) {
            const newTranslations = await loadTranslations(lang);
            if (newTranslations) {
                siteTranslations[lang] = newTranslations;
            } else {
                console.error(`Gagal memuat terjemahan untuk "${lang}". Menggunakan bahasa sebelumnya atau default.`);
                if (Object.keys(siteTranslations).length === 0) { 
                    currentLang = 'id'; 
                    docElement.lang = currentLang;
                }
                updateTexts(); 
                updateThemeButtonAriaLabel();
                return; 
            }
        }

        currentLang = lang; 
        localStorage.setItem('language', currentLang);

        updateTexts();
        updateThemeButtonAriaLabel();

        langButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.lang === currentLang);
        });
    }

    // --- Hero Slideshow Logic ---
    const heroSlides = document.querySelectorAll('.hero-slide');
    let currentSlideIndex = 0;
    const slideIntervalTime = 3000; // 3 detik
    let heroIntervalId; // Untuk menyimpan ID interval

    function showNextHeroSlide() {
        if (heroSlides.length === 0) return;

        heroSlides[currentSlideIndex].classList.remove('active');
        currentSlideIndex = (currentSlideIndex + 1) % heroSlides.length;
        heroSlides[currentSlideIndex].classList.add('active');
    }

    function startHeroSlideshow() {
        if (heroSlides.length > 1) {
            if (!heroSlides[0].classList.contains('active') && currentSlideIndex === 0) {
                 heroSlides[0].classList.add('active'); // Pastikan slide pertama aktif saat mulai
            }
            heroIntervalId = setInterval(showNextHeroSlide, slideIntervalTime);
        } else if (heroSlides.length === 1 && !heroSlides[0].classList.contains('active')) {
             heroSlides[0].classList.add('active'); // Jika hanya 1 slide, pastikan tetap terlihat
        }
    }
    
    function stopHeroSlideshow() {
        clearInterval(heroIntervalId);
    }

    // Mulai slideshow
    startHeroSlideshow();
    // Opsional: Hentikan slideshow saat hover di atas gambar hero
    const heroImageContainer = document.querySelector('.hero-image');
    if (heroImageContainer) {
        heroImageContainer.addEventListener('mouseenter', stopHeroSlideshow);
        heroImageContainer.addEventListener('mouseleave', startHeroSlideshow);
    }
    // --- End Hero Slideshow Logic ---


    // --- Bagian 3: Logika Event Listener & Inisialisasi ---

    // Toggle Menu Mobile
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
            mainNav.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', String(!isExpanded));
            
            const menuToggleLabelKey = "menuToggleLabel"; // Kunci untuk aria-label
            const menuToggleTextOpen = siteTranslations[currentLang]?.[menuToggleLabelKey] || "Toggle menu"; // Fallback
            const menuToggleTextClose = siteTranslations[currentLang]?.['menuToggleLabelClose'] || "Close menu"; // Tambahkan key baru jika perlu, atau gunakan simbol

            if(mainNav.classList.contains('active')) {
                menuToggle.setAttribute('aria-label', menuToggleTextClose);
                // menuToggle.innerHTML = '<i class="fas fa-times"></i>'; // Simbol X jika aktif
            } else {
                menuToggle.setAttribute('aria-label', menuToggleTextOpen);
                // menuToggle.innerHTML = '☰'; // Simbol hamburger jika tidak aktif
            }
            // Jika menggunakan teks dari data-lang-key-aria-label, pastikan itu terupdate oleh updateTexts()
        });
    }

    // Smooth Scroll & Tutup Menu
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetHref = this.getAttribute('href');
            if (targetHref.startsWith('#') && targetHref.length > 1 && targetHref !== '#privasi' && targetHref !== '#syarat') { // Hindari untuk link footer dummy
                e.preventDefault();
                if (mainNav && mainNav.classList.contains('active')) {
                    mainNav.classList.remove('active');
                    if (menuToggle) {
                        menuToggle.setAttribute('aria-expanded', 'false');
                        // Update aria-label dan teks/ikon menu toggle di sini jika diperlukan
                        const menuToggleLabelKey = "menuToggleLabel";
                        const menuToggleTextOpen = siteTranslations[currentLang]?.[menuToggleLabelKey] || "Toggle menu";
                        menuToggle.setAttribute('aria-label', menuToggleTextOpen);
                        // menuToggle.innerHTML = '☰';
                    }
                }
                const targetElement = document.querySelector(targetHref);
                if (targetElement) {
                    const headerOffset = document.querySelector('header').offsetHeight;
                    const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                    const offsetPosition = elementPosition - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
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
                if (newLang !== currentLang || !siteTranslations[newLang]) { 
                    setLanguage(newLang);
                }
            });
        });
    }
    
    // Active Nav Link Highlighting on Scroll
    const sections = document.querySelectorAll('main section[id]');
    const navLinks = document.querySelectorAll('header nav ul li a');

    function changeNavActiveState() {
        let index = sections.length;
        const headerHeight = document.querySelector('header').offsetHeight;

        while(--index && window.scrollY + headerHeight + 50 < sections[index].offsetTop) {}
        
        navLinks.forEach((link) => link.classList.remove('active-link'));
        // Pastikan link yang sesuai ada sebelum menambahkan kelas
        if (sections[index] && navLinks[index]) {
             // Cek apakah href dari link cocok dengan ID section
            const targetLink = Array.from(navLinks).find(link => link.getAttribute('href') === `#${sections[index].id}`);
            if (targetLink) {
                targetLink.classList.add('active-link');
            }
        } else if (window.scrollY < sections[0].offsetTop - headerHeight - 50) {
            // Jika di paling atas, set Beranda sebagai aktif
            const homeLink = document.querySelector('header nav ul li a[href="#hero"]');
            if (homeLink) {
                navLinks.forEach(a => a.classList.remove('active-link')); // Hapus semua dulu
                homeLink.classList.add('active-link');
            }
        }
    }
    
    // Panggil changeNavActiveState saat load dan scroll
    window.addEventListener('scroll', changeNavActiveState);


    // Fungsi Inisialisasi Halaman Utama
    async function initializePage() {
        const initialTheme = docElement.classList.contains('dark-theme') ? 'dark' : 'light';
        if (currentThemeIcon) { 
            currentThemeIcon.className = initialTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        await setLanguage(currentLang); 
        updateThemeButtonAriaLabel(); // Pastikan label tombol tema sudah benar setelah bahasa dimuat
        changeNavActiveState(); // Set initial active nav link on load
    }

    initializePage(); // Panggil fungsi inisialisasi
});
