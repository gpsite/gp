/**
 * GP Settings Manager
 * Handles global settings like Tab Cloaking and Theme application across pages.
 */

(function () {
    // Save original title/icon to revert to 'Default' state
    const ORIGINAL_TITLE = document.title;
    let originalIconLink = document.querySelector("link[rel~='icon']");
    const ORIGINAL_ICON = originalIconLink ? originalIconLink.href : '';

    // Cloak Definitions
    // Exposed globally for UI scripts to use if needed
    window.CLOAKS = {
        none: { title: 'Default', icon: '' }, // Special case handled in logic
        google: { title: 'Google', icon: 'https://www.google.com/favicon.ico' },
        drive: { title: 'My Drive - Google Drive', icon: 'https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png' },
        classroom: { title: 'Home', icon: 'https://ssl.gstatic.com/classroom/favicon.png' },
        canvas: { title: 'Dashboard', icon: 'https://du11hjcvx0uqb.cloudfront.net/dist/images/favicon-e10d657a73.ico' },
        schoology: { title: 'Home | Schoology', icon: 'https://asset-cdn.schoology.com/sites/all/themes/schoology_theme/favicon.ico' },
        gmail: { title: 'Inbox', icon: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico' }
    };

    /**
     * Applies the specified cloak key.
     * @param {string} key - The cloak key (e.g., 'google', 'none')
     */
    window.setCloak = function (key) {
        if (!key) key = 'none';

        // Save preference
        localStorage.setItem('gp-cloak', key);

        // Apply
        if (key === 'none' || !window.CLOAKS[key]) {
            document.title = ORIGINAL_TITLE;
            if (originalIconLink) originalIconLink.href = ORIGINAL_ICON;
            return;
        }

        const data = window.CLOAKS[key];
        document.title = data.title;

        // Update or Create Favicon
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
            // If we created it, update our 'original' ref if ours was missing
            if (!originalIconLink) originalIconLink = link;
        }
        link.href = data.icon;
    };

    // Initialize
    const initSettings = () => {
        const savedCloak = localStorage.getItem('gp-cloak') || 'none';
        window.setCloak(savedCloak);
    };

    // Run on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSettings);
    } else {
        initSettings();
    }

})();
