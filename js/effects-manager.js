/**
 * GP Effects Manager
 * - Adds a bottom-right toggle button.
 * - Toggles:
 *   - root class "reduced-effects"
 *   - background-image -> flat color
 *   - glass blur/shadows (via CSS + optional selector list)
 *   - snow / leaves via window.initLeaves()
 *
 * Usage per page:
 *   window.initEffectsManager({
 *     backgroundFallback: '#050915',
 *     glassSelectors: ['.sidebar', '.catalog-frame'], // optional, page-specific
 *     storageKey: 'gp-reduced-effects'               // optional, shared key
 *   });
 */
(function(){
  if (window.initEffectsManager) return; // don't define twice

  window.initEffectsManager = function(options){
    const opts = Object.assign({
      backgroundFallback: '#050915',
      glassSelectors: [],       // extra selectors that should lose blur/shadows
      storageKey: 'gp-reduced-effects',
      buttonLabel: 'Effects',
      buttonOnText: 'On',
      buttonOffText: 'Off'
    }, options || {});

    const root = document.documentElement;
    const leafLayer = document.getElementById('leaf-layer');

    // Create toggle button if not already present
    let btn = document.getElementById('effectsToggle');
    let labelEl = document.getElementById('effectsToggleLabel');

    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'effectsToggle';
      btn.type = 'button';
      btn.className = 'effects-toggle';
      btn.setAttribute('aria-pressed', 'false');
      btn.setAttribute('aria-label', 'Toggle visual effects');

      const strong = document.createElement('strong');
      strong.textContent = opts.buttonLabel;

      labelEl = document.createElement('span');
      labelEl.id = 'effectsToggleLabel';
      labelEl.textContent = opts.buttonOnText;

      btn.appendChild(strong);
      btn.appendChild(labelEl);
      document.body.appendChild(btn);
    }

    // Ensure base styles exist once
    if (!document.getElementById('effectsManagerStyles')) {
      const style = document.createElement('style');
      style.id = 'effectsManagerStyles';
      style.textContent = `
:root.reduced-effects {
  --bg-image: none;
  --glass-bg: rgba(0,0,0,0.65);
  --glass-bg-hover: rgba(0,0,0,0.80);
  --glass-border: rgba(0,0,0,0.85);
  --glass-highlight: transparent;
}
:root.reduced-effects .glass{
  backdrop-filter: none !important;
  box-shadow: none !important;
}
.effects-toggle {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 10000;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.4);
  background: rgba(0,0,0,0.55);
  color: #fff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.45);
  backdrop-filter: blur(10px);
}
.effects-toggle span {
  opacity: 0.8;
}
.effects-toggle:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}
:root.reduced-effects .effects-toggle {
  background: rgba(0,0,0,0.85);
  border-color: rgba(0,0,0,0.9);
}
`;
      document.head.appendChild(style);
    }

    // Optional: apply glass overrides for arbitrary selectors
    function applyGlassOverrides(on) {
      if (!opts.glassSelectors || !opts.glassSelectors.length) return;
      const els = document.querySelectorAll(opts.glassSelectors.join(','));
      els.forEach(el => {
        if (on) {
          // reduced mode ON -> no blur / lighter shadows
          el.style.backdropFilter = 'none';
          el.style.boxShadow = 'none';
        } else {
          // let CSS handle default; just clear inline overrides
          el.style.backdropFilter = '';
          el.style.boxShadow = '';
        }
      });
    }

    // Core apply function
    function applyReducedEffects(on) {
      if (!labelEl) return;

      if (on) {
        root.classList.add('reduced-effects');
        btn.setAttribute('aria-pressed', 'true');
        labelEl.textContent = opts.buttonOffText;

        // Kill snow / leaves
        if (leafLayer) {
          leafLayer.innerHTML = '';
          leafLayer.style.display = 'none';
        }

        // Kill background image with a flat color
        document.body.style.background = opts.backgroundFallback;

        applyGlassOverrides(true);
      } else {
        root.classList.remove('reduced-effects');
        btn.setAttribute('aria-pressed', 'false');
        labelEl.textContent = opts.buttonOnText;

        // Restore snow / leaves (if page supplied initLeaves)
        if (leafLayer) {
          leafLayer.style.display = '';
          if (typeof window.initLeaves === 'function') {
            window.initLeaves();
          }
        }

        // Let CSS restore background (var(--bg-image))
        document.body.style.background = '';

        applyGlassOverrides(false);
      }

      try {
        localStorage.setItem(opts.storageKey, on ? '1' : '0');
      } catch (e) {}
    }

    // Restore saved preference
    try {
      const saved = localStorage.getItem(opts.storageKey);
      if (saved === '1') {
        applyReducedEffects(true);
      } else {
        applyReducedEffects(false);
      }
    } catch (e) {
      applyReducedEffects(false);
    }

    btn.addEventListener('click', function(){
      const enableReduced = !root.classList.contains('reduced-effects');
      applyReducedEffects(enableReduced);
    });

    // Expose a hook if needed
    return {
      applyReduced: () => applyReducedEffects(true),
      applyNormal: () => applyReducedEffects(false)
    };
  };
})();