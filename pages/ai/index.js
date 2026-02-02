// CONFIG
const SHEET_ID = "1nw0SDop0IeFr6q776thp_eSCZZulaxZBtM55ECrHD5A";
const API_KEY = "AIzaSyBdnupZe6bJH43XE0Hj77n0AmlR3wVfN9M";
const TAB_NAME = "clanker";
const URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${TAB_NAME}?key=${API_KEY}`;

let rawData = [];
let categories = new Set();
let allModels = new Set();
let activeCat = 'all';
let activeModel = 'all';

// Elements
const grid = document.getElementById('grid');
const overlay = document.getElementById('overlay');
const iframeBox = document.getElementById('iframeBox');
const closeBtn = document.getElementById('closeBtn');

async function init() {
    lucide.createIcons();
    try {
        const res = await fetch(URL);
        const data = await res.json();

        if (!data.values || data.values.length < 2) {
            grid.innerHTML = '<div style="text-align:center;">No AI tools found.</div>';
            return;
        }

        // Parse (Skip header)
        // 0=Name, 1=URL, 2=Models, 3=ImgGen, 4=ImgURL, 5=Desc, 6=Category (Comma sep)
        const rows = data.values.slice(1);

        rawData = rows.map(r => {
            const models = r[2] ? r[2].split(',').map(m => m.trim()) : [];
            const catString = r[6] || 'General';
            const cats = catString.split(',').map(c => c.trim()); // Split multiple categories

            // Collect for filters
            cats.forEach(c => categories.add(c));
            models.forEach(m => allModels.add(m));

            return {
                name: r[0],
                url: r[1],
                models: models,
                imgGen: r[3],
                imgUrl: r[4],
                desc: r[5],
                categories: cats // Array
            };
        }).filter(i => i.name && i.url);

        populateFilters();
        renderGrid(rawData);

    } catch (e) {
        console.error(e);
        grid.innerHTML = `<div style="color:red; text-align:center;">Failed connecting to AI Database.</div>`;
    }
}

function populateFilters() {
    // Categories
    const catMenu = document.getElementById('catMenu');
    catMenu.innerHTML = '';

    const allCat = document.createElement('div');
    allCat.className = 'filter-option';
    allCat.innerText = 'All';
    allCat.onclick = () => filterGrid('category', 'all');
    catMenu.appendChild(allCat);

    const sortedCats = Array.from(categories).sort();
    sortedCats.forEach(c => {
        const div = document.createElement('div');
        div.className = 'filter-option';
        div.innerText = c;
        div.onclick = () => filterGrid('category', c);
        catMenu.appendChild(div);
    });

    // Models
    const modelMenu = document.getElementById('modelMenu');
    modelMenu.innerHTML = '';

    const allModel = document.createElement('div');
    allModel.className = 'filter-option';
    allModel.innerText = 'All';
    allModel.onclick = () => filterGrid('model', 'all');
    modelMenu.appendChild(allModel);

    const sortedModels = Array.from(allModels).sort();
    sortedModels.forEach(m => {
        const div = document.createElement('div');
        div.className = 'filter-option';
        div.innerText = m;
        div.onclick = () => filterGrid('model', m);
        modelMenu.appendChild(div);
    });
}

function toggleFilter(id) {
    const menu = document.getElementById(id);
    const isActive = menu.classList.contains('active');
    // Close all
    document.querySelectorAll('.filter-menu').forEach(m => m.classList.remove('active'));

    if (!isActive) menu.classList.add('active');
}

function filterGrid(type, val) {
    if (type === 'category') activeCat = val;
    if (type === 'model') activeModel = val;

    // UI Label updates
    if (type === 'category') document.getElementById('catLabel').innerText = val === 'all' ? 'Use Cases' : val;
    if (type === 'model') document.getElementById('modelLabel').innerText = val === 'all' ? 'Models' : val;

    document.querySelectorAll('.filter-menu').forEach(m => m.classList.remove('active'));

    const filtered = rawData.filter(item => {
        // Multi-category match: item.categories includes activeCat
        const catMatch = activeCat === 'all' || item.categories.includes(activeCat);
        const modMatch = activeModel === 'all' || item.models.includes(activeModel);
        return catMatch && modMatch;
    });

    renderGrid(filtered);
}

function renderGrid(items) {
    grid.innerHTML = '';
    items.forEach(item => {
        grid.appendChild(createCard(item));
    });
    lucide.createIcons();
    if (items.length === 0) grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;">No tools match filters.</div>';
}

function createCard(item) {
    const el = document.createElement('div');
    el.className = 'ai-card';

    // Image Gen Badge
    const hasImg = item.imgGen && ['yes', 'true', 'y'].includes(item.imgGen.toLowerCase());
    const badgeHtml = hasImg ?
        `<div class="img-gen-badge"><i data-lucide="image"></i></div>` : '';

    // Fallback Image
    const safeImg = item.imgUrl || 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800';

    el.innerHTML = `
        <div class="card-image-wrapper">
            <img src="${safeImg}" class="card-image" alt="${item.name}">
        </div>
        <div class="card-content">
            <div class="card-header">
                <div class="card-title">${item.name}</div>
                ${badgeHtml}
            </div>
            <div class="card-desc">${item.desc || 'No description available.'}</div>
            <div class="card-models-placeholder"></div>
        </div>
    `;

    // Manual Models Insertion for Safety
    const modelsContainer = el.querySelector('.card-models-placeholder');
    if (item.models.length > 0) {
        const realContainer = document.createElement('div');
        realContainer.className = 'card-models-container';

        const summary = document.createElement('div');
        summary.className = 'model-summary';
        summary.innerHTML = `<span>${item.models[0]}</span>`;

        if (item.models.length > 1) {
            const expander = document.createElement('div');
            expander.className = 'expand-btn';
            expander.innerText = `+${item.models.length - 1} More`;
            expander.onclick = (e) => {
                e.stopPropagation();
                toggleCardExpand(expander);
            };
            summary.appendChild(expander);
        }

        realContainer.appendChild(summary);

        if (item.models.length > 1) {
            const list = document.createElement('div');
            list.className = 'model-list-expanded';
            list.innerHTML = item.models.slice(1).map(m => `<div class="model-tag">${m}</div>`).join('');
            realContainer.appendChild(list);
        }

        modelsContainer.replaceWith(realContainer);
    } else {
        modelsContainer.innerHTML = `<div class="card-models-container"><div class="model-summary">Unknown Model</div></div>`;
    }

    el.onclick = (e) => {
        // Prevent if clicking expander or inside expanded list
        if (e.target.closest('.expand-btn') || e.target.closest('.model-list-expanded')) return;
        openTool(item);
    };
    return el;
}

function toggleCardExpand(btn) {
    const container = btn.closest('.card-models-container');
    const list = container.querySelector('.model-list-expanded');
    const tags = container.querySelectorAll('.model-tag');

    if (list.classList.contains('active')) {
        // Collapse
        list.classList.remove('active');
        btn.innerText = `+${tags.length} More`;
    } else {
        // Expand
        list.classList.add('active');
        btn.innerText = `Less`;
    }
};

function openTool(item) {
    document.getElementById('overlayTitle').innerText = item.name;
    iframeBox.innerHTML = '';

    // Loader
    const loader = document.createElement('div');
    loader.className = 'overlay-loader';
    loader.innerHTML = `
        <div class="spinner"></div>
        <div class="loader-text">Connecting to ${item.name}...</div>
    `;
    iframeBox.appendChild(loader);

    const iframe = document.createElement('iframe');
    iframe.src = item.url;
    iframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-same-origin');

    // Allow loader to show for at least 1.5s visual
    const minLoadTime = new Promise(resolve => setTimeout(resolve, 1500));

    iframe.onload = async () => {
        await minLoadTime;
        loader.style.opacity = '0';
        setTimeout(() => {
            if (loader.parentNode) loader.remove();
        }, 500);
    };

    iframeBox.appendChild(iframe);
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

closeBtn.onclick = () => {
    overlay.classList.remove('active');
    iframeBox.innerHTML = '';
    document.body.style.overflow = '';
};

// Init
init();

// Close filters on outside click
window.addEventListener('click', (e) => {
    if (!e.target.closest('.filter-group')) {
        document.querySelectorAll('.filter-menu').forEach(m => m.classList.remove('active'));
    }
});
