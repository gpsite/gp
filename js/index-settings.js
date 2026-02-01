// --- Settings / Theme / Tools ---
const els = {
    settingsBtn: document.getElementById('settingsBtn'),
    closeSettings: document.getElementById('closeSettings'),
    overlay: document.getElementById('settingsOverlay'),
    themeSwitch: document.getElementById('themeSwitch'),
    cloakSelect: document.getElementById('cloakSelect'),
    abBtn: document.getElementById('abBtn'),
    resetBtn: document.getElementById('resetBtn'),
    html: document.documentElement
};

// 1. Modal Logic
const toggleModal = (show) => {
    if (show) {
        els.overlay.classList.add('active');
    } else {
        els.overlay.classList.remove('active');
    }
};

els.settingsBtn.addEventListener('click', () => toggleModal(true));
els.closeSettings.addEventListener('click', () => toggleModal(false));
els.overlay.addEventListener('click', (e) => {
    if (e.target === els.overlay) toggleModal(false);
});

// 2. Theme Logic
const applyTheme = (theme) => {
    els.html.setAttribute('data-theme', theme);
    localStorage.setItem('gp-final-theme', theme);

    // Update switch state
    if (theme === 'dark') {
        els.themeSwitch.classList.add('active'); // active means Dark in this context? 
        // Wait, usually "active" switch means "ON". Let's say ON = Dark, OFF = Light if default is light. 
        // Actually base theme is dark. Let's make Switch ON = Dark Mode.
    } else {
        els.themeSwitch.classList.remove('active');
    }
};

els.themeSwitch.addEventListener('click', () => {
    const current = els.html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
});

// Init Theme
const savedTheme = localStorage.getItem('gp-final-theme') || 'dark';
applyTheme(savedTheme);
if (savedTheme === 'dark') els.themeSwitch.classList.add('active');


// 3. Tab Cloaker
// UI Logic Only (Logic moved to js/settings.js)
const savedCloak = localStorage.getItem('gp-cloak') || 'none';
els.cloakSelect.value = savedCloak;

els.cloakSelect.addEventListener('change', (e) => {
    if (window.setCloak) {
        window.setCloak(e.target.value);
    }
});


// 4. About:Blank Opener
els.abBtn.addEventListener('click', () => {
    const win = window.open('about:blank', '_blank');
    if (win) {
        const doc = win.document;
        const iframe = doc.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.position = 'fixed';
        iframe.style.inset = '0';
        iframe.src = window.location.href;

        doc.body.style.margin = '0';
        doc.body.appendChild(iframe);
    }
});

// 5. Reset
els.resetBtn.addEventListener('click', () => {
    if (confirm('Reset all settings?')) {
        localStorage.removeItem('gp-final-theme');
        localStorage.removeItem('gp-cloak');
        window.location.reload();
    }
});

// Keyboard Shortcut (ESC to close)
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') toggleModal(false);
});
