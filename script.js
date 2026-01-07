// Utility functions
function isValidIp(ip) {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    return parts.every(p => {
        if (!/^[0-9]+$/.test(p)) return false;
        const n = Number(p);
        return n >= 0 && n <= 255;
    });
}

function ip2long(ip) {
    const parts = ip.split('.').map(p => parseInt(p, 10));
    return (((parts[0] << 24) >>> 0) | ((parts[1] << 16) >>> 0) | ((parts[2] << 8) >>> 0) | (parts[3] >>> 0)) >>> 0;
}

function long2ip(long) {
    return [
        (long >>> 24) & 0xFF,
        (long >>> 16) & 0xFF,
        (long >>> 8) & 0xFF,
        long & 0xFF
    ].join('.');
}

function maskForPrefix(prefix) {
    if (prefix === 0) return 0 >>> 0;
    return ((0xFFFFFFFF << (32 - prefix)) >>> 0) >>> 0;
}

function prefixFromMaskLong(maskLong) {
    let cnt = 0;
    for (let i = 31; i >= 0; i--) {
        if ((maskLong >>> i) & 1) cnt++; else break;
    }
    return cnt;
}

function parseMask(maskStr) {
    if (!maskStr) return null;
    maskStr = maskStr.trim();
    // /24 style
    if (maskStr.startsWith('/')) {
        const p = parseInt(maskStr.slice(1), 10);
        if (isNaN(p) || p < 0 || p > 32) return null;
        return { prefix: p, maskLong: maskForPrefix(p) };
    }
    // plain number 24
    if (/^\d+$/.test(maskStr)) {
        const p = parseInt(maskStr, 10);
        if (p >=0 && p <= 32) return { prefix: p, maskLong: maskForPrefix(p) };
    }
    // dotted decimal
    if (isValidIp(maskStr)) {
        const m = ip2long(maskStr);
        const p = prefixFromMaskLong(m);
        return { prefix: p, maskLong: m };
    }
    return null;
}

function formatNumber(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function calculate() {
    const ip = document.getElementById('ip').value.trim();
    const network = document.getElementById('network').value.trim();
    const maskInput = document.getElementById('mask').value.trim();
    const nrRaw = document.getElementById('nr_subnets').value.trim();
    const nr = nrRaw ? parseInt(nrRaw, 10) : 0;

    const notes = [];

    // Validation
    let maskInfo = parseMask(maskInput);
    const defaultPrefix = 24;
    if (!maskInfo) {
        maskInfo = { prefix: defaultPrefix, maskLong: maskForPrefix(defaultPrefix) };
    }

    // Determine base network
    let baseNetL = null;
    let maskL = maskInfo.maskLong;
    let basePrefix = maskInfo.prefix;

    if (network) {
        if (!isValidIp(network)) {
            return showError('Adresa e rrjetit nuk është një IPv4 e vlefshme.');
        }
        const netCandidate = ip2long(network) & maskL;
        baseNetL = netCandidate >>> 0;
        if (!maskInput) notes.push(`Nuk u dha mask - u supozua /${basePrefix}.`);
    } else if (ip) {
        if (!isValidIp(ip)) {
            return showError('Adresa IP nuk është e vlefshme.');
        }
        baseNetL = (ip2long(ip) & maskL) >>> 0;
        if (!maskInput) notes.push(`Nuk u dha mask - u supozua /${basePrefix}.`);
    } else {
        return showError('Ju lutem vendosni të paktën një adresë IP ose Network.');
    }

    // Store base network info for "show all subnets" feature
    window.baseNetworkInfo = {
        baseNetL: baseNetL,
        maskL: maskL,
        basePrefix: basePrefix,
        ipAddress: ip
    };

    // Basic network info
    const netL = baseNetL;
    const broadL = (netL | (~maskL >>> 0)) >>> 0;
    const firstL = (netL + 1) >>> 0;
    const lastL = (broadL - 1) >>> 0;
    const hosts_total = ((~maskL >>> 0) + 1) >>> 0;
    const hosts_active = hosts_total >= 2 ? hosts_total - 2 : 0;

    const netID = long2ip(netL);
    const broadID = long2ip(broadL);
    const ip_first = hosts_total >= 2 ? long2ip(firstL) : '-';
    const ip_last = hosts_total >= 2 ? long2ip(lastL) : '-';
    const maskStr = long2ip(maskL);

    // Subnetting if requested
    const subnets = [];
    let newPrefix = basePrefix;
    if (nr && nr > 0) {
        if (nr === 1) {
            notes.push('U kërkua 1 subnet - po kthehet rrjeti bazë.');
        }
        const bits = Math.ceil(Math.log2(nr));
        if (bits > (32 - basePrefix)) {
            return showError('Numri i subnet-eve të kërkuara kërkon më shumë bit se sa ka në dispozicion në maskën bazë.');
        }
        newPrefix = basePrefix + bits;
        const step = Math.pow(2, 32 - newPrefix) >>> 0;
        const possible = Math.pow(2, bits);
        if (possible > nr) notes.push(`Mund të krijohen vetëm numra të subnet-eve në fuqi të 2-shit; do të krijohen ${possible} subnet për të mbuluar ${nr} të kërkuara.`);

        // Align base network to new prefix boundary
        const newMaskL = maskForPrefix(newPrefix);
        const alignedBase = (netL & newMaskL) >>> 0;

        for (let i = 0; i < nr; i++) {
            const sNet = (alignedBase + (i * step)) >>> 0;
            const sBroad = (sNet + step - 1) >>> 0;
            const sFirst = (sNet + 1) >>> 0;
            const sLast = (sBroad - 1) >>> 0;
            subnets.push({
                'Subnet ID': long2ip(sNet),
                'Broadcast ID': long2ip(sBroad),
                'First IP': step >= 2 ? long2ip(sFirst) : '-',
                'Last IP': step >= 2 ? long2ip(sLast) : '-',
                'Total Hosts': step,
                'Active Hosts': step >= 2 ? (step - 2) : 0,
                'Mask': `/${newPrefix}`
            });
        }

        notes.push(`Çdo subnet ka mask /${newPrefix} dhe ${formatNumber(step)} host në total (${step >= 2 ? formatNumber(step - 2) : 0} të përdorshëm).`);
    }

    displayResults(netID, broadID, ip_first, ip_last, hosts_total, hosts_active, maskStr, basePrefix, subnets, notes);
}

function showError(msg) {
    const basicResults = document.getElementById('basicResults');
    const subnetResults = document.getElementById('subnetResults');
    basicResults.innerHTML = `<div class="empty-state">⚠️ ${msg}</div>`;
    subnetResults.innerHTML = '';
    document.getElementById('showAllSubnetsBtn').style.display = 'none';
}

function displayResults(netID, broadID, ip_first, ip_last, hosts_total, hosts_active, maskStr, prefix, subnets, notes) {
    const basicResults = document.getElementById('basicResults');
    const subnetResults = document.getElementById('subnetResults');
    const resultsNotes = document.getElementById('resultsNotes');

    let noteHtml = '';
    if (notes && notes.length) {
        noteHtml = `<div class="empty-state">💡 ${notes.join(' ')}</div>`;
    }

    resultsNotes.innerHTML = noteHtml;

    let html = '<div class="grid-2">';
    if (netID) html += `<div class="input-group result-field"><label>🌐 Network ID</label><input readonly value="${netID}" id="res-netid"><button class="copy-btn" data-copy="#res-netid" title="Kopjo Network ID">📋</button></div>`;
    if (broadID) html += `<div class="input-group result-field"><label>📡 Broadcast ID</label><input readonly value="${broadID}" id="res-broadid"><button class="copy-btn" data-copy="#res-broadid" title="Kopjo Broadcast ID">📋</button></div>`;
    if (ip_first) html += `<div class="input-group result-field"><label>▶️ First IP</label><input readonly value="${ip_first}" id="res-first"><button class="copy-btn" data-copy="#res-first" title="Kopjo First IP">📋</button></div>`;
    if (ip_last) html += `<div class="input-group result-field"><label>⏸️ Last IP</label><input readonly value="${ip_last}" id="res-last"><button class="copy-btn" data-copy="#res-last" title="Kopjo Last IP">📋</button></div>`;
    if (maskStr) html += `<div class="input-group result-field"><label>🎭 Subnet Mask</label><input readonly value="${maskStr}" id="res-mask"><button class="copy-btn" data-copy="#res-mask" title="Kopjo Mask">📋</button></div>`;
    html += `<div class="input-group result-field"><label>🔢 Prefix Length</label><input readonly value="/${prefix}" id="res-prefix"><button class="copy-btn" data-copy="#res-prefix" title="Kopjo Prefix">📋</button></div>`;
    if (hosts_total !== undefined) html += `<div class="input-group result-field"><label>💻 Total Hosts</label><input readonly value="${formatNumber(hosts_total)}" id="res-total"><button class="copy-btn" data-copy="#res-total" title="Kopjo Total Hosts">📋</button></div>`;
    if (hosts_active !== undefined) html += `<div class="input-group result-field"><label>✅ Active Hosts</label><input readonly value="${formatNumber(hosts_active)}" id="res-active"><button class="copy-btn" data-copy="#res-active" title="Kopjo Active Hosts">📋</button></div>`;
    html += '</div>';

    basicResults.innerHTML = html;

    let subnetHtml = '';
    if (subnets && subnets.length > 0) {
        subnetHtml += '<div class="divider"></div>';
        subnetHtml += '<div class="result-title">🔀 Subnets <span class="info-badge">' + subnets.length + '</span></div>';
        subnetHtml += '<div class="subnet-list">';
        subnets.forEach((subnet, i) => {
            subnetHtml += `<div class="subnet-card">`;
            subnetHtml += `<div class="subnet-header">📦 Subnet ${i + 1} <span style="margin-left:auto;font-weight:600">${subnet.Mask}</span></div>`;
            subnetHtml += '<div class="grid-2">';
            for (const [key, value] of Object.entries(subnet)) {
                if (key === 'Mask') continue;
                const icons = {
                    'Subnet ID': '🌐',
                    'Broadcast ID': '📡',
                    'First IP': '▶️',
                    'Last IP': '⏸️',
                    'Total Hosts': '💻',
                    'Active Hosts': '✅'
                };
                const id = `sub-${i}-${key.replace(/\s+/g,'').toLowerCase()}`;
                const displayValue = (key === 'Total Hosts' || key === 'Active Hosts') ? formatNumber(value) : value;
                subnetHtml += `<div class="input-group result-field"><label>${icons[key]} ${key}</label><input readonly value="${displayValue}" id="${id}"><button class="copy-btn" data-copy="#${id}" title="Kopjo ${key}">📋</button></div>`;
            }
            subnetHtml += '</div></div>';
        });
        subnetHtml += '</div>';
    }

    subnetResults.innerHTML = subnetHtml;

    // Show "All Subnets" button
    const showAllBtn = document.getElementById('showAllSubnetsBtn');
    if (showAllBtn) {
        showAllBtn.style.display = 'block';
        showAllBtn.onclick = showAllPossibleSubnets;
    }

    // Attach copy handlers
    setupCopyButtons();

    setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
}

function showAllPossibleSubnets() {
    if (!window.baseNetworkInfo) return;

    const { baseNetL, maskL, basePrefix, ipAddress } = window.baseNetworkInfo;
    
    // Calculate all possible /24 subnets (or current prefix +1)
    const targetPrefix = Math.min(basePrefix + 8, 30); // Show up to /30
    const newMaskL = maskForPrefix(targetPrefix);
    const step = Math.pow(2, 32 - targetPrefix) >>> 0;
    
    // Calculate how many subnets we can create
    const totalSubnets = Math.pow(2, targetPrefix - basePrefix);
    
    // Limit display to reasonable amount
    const maxDisplay = Math.min(totalSubnets, 256);
    
    const subnets = [];
    const alignedBase = (baseNetL & newMaskL) >>> 0;
    
    for (let i = 0; i < maxDisplay; i++) {
        const sNet = (alignedBase + (i * step)) >>> 0;
        const sBroad = (sNet + step - 1) >>> 0;
        const sFirst = (sNet + 1) >>> 0;
        const sLast = (sBroad - 1) >>> 0;
        
        subnets.push({
            index: i + 1,
            network: long2ip(sNet),
            broadcast: long2ip(sBroad),
            first: step >= 2 ? long2ip(sFirst) : '-',
            last: step >= 2 ? long2ip(sLast) : '-',
            hosts: step >= 2 ? (step - 2) : 0,
            mask: `/${targetPrefix}`
        });
    }
    
    displayAllSubnets(subnets, totalSubnets, maxDisplay);
}

function displayAllSubnets(subnets, total, displayed) {
    const subnetResults = document.getElementById('subnetResults');
    
    let html = '<div class="divider"></div>';
    html += `<div class="result-title">🌐 Të gjitha Subnetet <span class="info-badge">${displayed}${total > displayed ? ' nga ' + total : ''}</span></div>`;
    
    if (total > displayed) {
        html += `<div class="empty-state">💡 Duke shfaqur ${displayed} subnet të para nga ${formatNumber(total)} në total.</div>`;
    }
    
    html += '<div class="all-subnets-container">';
    
    subnets.forEach(subnet => {
        html += `<div class="subnet-item">`;
        html += `<div class="subnet-item-info">`;
        html += `<div><span class="subnet-item-label">#${subnet.index}</span></div>`;
        html += `<div><span class="subnet-item-label">Network:</span> <span class="subnet-item-value">${subnet.network}${subnet.mask}</span></div>`;
        html += `<div><span class="subnet-item-label">First IP:</span> <span class="subnet-item-value">${subnet.first}</span></div>`;
        html += `<div><span class="subnet-item-label">Last IP:</span> <span class="subnet-item-value">${subnet.last}</span></div>`;
        html += `<div><span class="subnet-item-label">Hosts:</span> <span class="subnet-item-value">${formatNumber(subnet.hosts)}</span></div>`;
        html += `</div>`;
        html += `</div>`;
    });
    
    html += '</div>';
    
    subnetResults.innerHTML += html;
    
    // Scroll to the new section
    setTimeout(() => {
        document.querySelector('.all-subnets-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

// Copy helpers
function copyToClipboard(selector) {
    try {
        const el = document.querySelector(selector);
        if (!el) return false;
        const val = el.value || el.innerText || '';
        navigator.clipboard.writeText(val);
        return true;
    } catch (e) {
        return false;
    }
}

function setupCopyButtons() {
    // individual buttons
    document.querySelectorAll('.copy-btn[data-copy]').forEach(btn => {
        btn.removeEventListener('click', btn._cb);
        const cb = () => {
            const sel = btn.getAttribute('data-copy');
            const ok = copyToClipboard(sel);
            btn.textContent = ok ? '✅' : '❌';
            setTimeout(() => btn.textContent = '📋', 900);
        };
        btn._cb = cb;
        btn.addEventListener('click', cb);
    });

    // copy all
    const copyAll = document.getElementById('copyAllBtn');
    if (copyAll) {
        copyAll.removeEventListener('click', copyAll._cb);
        copyAll._cb = () => {
            const values = Array.from(document.querySelectorAll('#basicResults input[readonly], .subnet-card input[readonly]'))
                .map(i => i.previousElementSibling.textContent + ': ' + i.value)
                .filter(v => v !== undefined && v !== null && String(v).trim() !== '');
            if (values.length === 0) return;
            navigator.clipboard.writeText(values.join('\n'))
                .then(() => { copyAll.textContent = '✅ Kopjuar'; setTimeout(()=> copyAll.textContent = '📋 Kopjo të gjitha',1200); })
                .catch(() => { copyAll.textContent = '❌ Gabim'; setTimeout(()=> copyAll.textContent = '📋 Kopjo të gjitha',1200); });
        };
        copyAll.addEventListener('click', copyAll._cb);
    }
}
