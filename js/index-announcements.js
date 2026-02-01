// Announcements + Full Color System
(function () {
    const ENDPOINT = 'https://sheets.googleapis.com/v4/spreadsheets/1nw0SDop0IeFr6q776thp_eSCZZulaxZBtM55ECrHD5A/values/home?key=AIzaSyBdnupZe6bJH43XE0Hj77n0AmlR3wVfN9M';
    const container = document.getElementById('annContainer');

    const ALLOWED_COLORS = new Set([
        'black', 'white', 'gray', 'grey', 'silver', 'lightgray', 'darkgray',
        'red', 'crimson', 'maroon', 'orange', 'coral', 'tomato',
        'yellow', 'gold', 'khaki', 'green', 'lime', 'olive', 'seagreen', 'teal',
        'blue', 'navy', 'royalblue', 'dodgerblue', 'deepskyblue', 'skyblue',
        'indigo', 'violet', 'purple', 'magenta', 'fuchsia', 'pink', 'hotpink',
        'cyan', 'aqua', 'turquoise'
    ]);

    function normalizeColor(c) {
        if (!c) return null;
        c = c.trim().toLowerCase();
        if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c)) return c;
        return ALLOWED_COLORS.has(c) ? c : null;
    }

    function parseMarkup(text) {
        const frag = document.createDocumentFragment();
        let i = 0, bold = false, color = null;
        const colorStack = [];
        let buf = '';

        const flush = () => {
            if (!buf) return;
            let node;
            if (color || bold) {
                node = document.createElement(bold ? 'b' : 'span');
                if (color) node.style.color = color;
                node.textContent = buf;
            } else {
                node = document.createTextNode(buf);
            }
            frag.appendChild(node);
            buf = '';
        };

        while (i < text.length) {
            if (text.startsWith('**', i)) { flush(); bold = !bold; i += 2; continue; }
            if (text.startsWith('[b]', i)) { flush(); bold = true; i += 3; continue; }
            if (text.startsWith('[/b]', i)) { flush(); bold = false; i += 4; continue; }
            if (text.startsWith('[color=', i)) {
                const end = text.indexOf(']', i + 7);
                if (end !== -1) {
                    flush();
                    colorStack.push(color);
                    const raw = text.slice(i + 7, end);
                    const ok = normalizeColor(raw);
                    color = ok || color;
                    i = end + 1; continue;
                }
            }
            if (text.startsWith('[/color]', i)) { flush(); color = colorStack.pop() || null; i += 8; continue; }
            buf += text[i++];
        }
        flush();
        return frag;
    }

    async function load() {
        try {
            const res = await fetch(ENDPOINT + '&t=' + Date.now());
            const data = await res.json();
            const items = (data.values || []).map(r => r[0]).filter(v => v && !/^announcements?$/i.test(v));

            const ul = document.createElement('ul');
            ul.className = 'ann-list';
            items.forEach(t => {
                const li = document.createElement('li');
                li.appendChild(parseMarkup(t));
                ul.appendChild(li);
            });

            container.innerHTML = '';
            container.appendChild(ul);
        } catch (e) {
            container.innerHTML = '<ul class="ann-list"><li>System offline. Retrying...</li></ul>';
        }
    }

    load();
    setInterval(load, 300000);
})();
