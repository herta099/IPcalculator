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
        const p = (m === 0) ? 0 : (32 - Math.clz32(~m));
        return { prefix: p, maskLong: m };
    }
    return null;
}

function formatNumber(n) {
    return String(n);
}

function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        ip: params.get('ip') || '',
        network: params.get('network') || '',
        mask: params.get('mask') || '',
        nr_subnets: params.get('nr_subnets') || ''
    };
}

function calculate() {
    const params = getUrlParams();
    const ip = params.ip.trim();
    const network = params.network.trim();
    const maskInput = params.mask.trim();
    const nrRaw = params.nr_subnets.trim();
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
            return showError('Network address is not a valid IPv4 address.');
        }
        const netCandidate = ip2long(network) & maskL;
        baseNetL = netCandidate >>> 0;
        if (!maskInput) notes.push(`No mask provided — assumed /${basePrefix}.`);
    } else if (ip) {
        if (!isValidIp(ip)) {
            return showError('IP address is not a valid IPv4 address.');
        }
        baseNetL = (ip2long(ip) & maskL) >>> 0;
        if (!maskInput) notes.push(`No mask provided — assumed /${basePrefix}.`);
    } else {
        return showError('Provide at least an IP address or a Network address.');
    }

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

    // Store for hosts page
    localStorage.setItem('subnet_data', JSON.stringify({
        netID: netID,
        broadID: broadID,
        firstIP: ip_first,
        lastIP: ip_last,
        firstL: firstL,
        lastL: lastL,
        hosts_total: hosts_total,
        hosts_active: hosts_active
    }));

    // Subnetting if requested
    const subnets = [];
    if (nr && nr > 0) {
        if (nr === 1) {
            notes.push('Number of subnets requested is 1 — returning the base network.');
        }
        const bits = Math.ceil(Math.log2(nr));
        if (bits > (32 - basePrefix)) {
            return showError('Requested number of subnets requires more bits than available in the base network mask.');
        }
        const newPrefix = basePrefix + bits;
        const step = Math.pow(2, 32 - newPrefix) >>> 0;
        const possible = Math.pow(2, bits);
        if (possible > nr) notes.push(`Can only create subnet counts in powers of two; ${possible} subnets will be created to cover ${nr} requested.`);

        const newMaskL = maskForPrefix(newPrefix);
        const alignedBase = (netL & newMaskL) >>> 0;

        for (let i = 0; i < nr; i++) {
            const sNet = (alignedBase + (i * step)) >>> 0;
            const sBroad = (sNet + step - 1) >>> 0;
            const sFirst = (sNet + 1) >>> 0;
            const sLast = (sBroad - 1) >>> 0;
            subnets.push({
                index: i,
                'Subnet ID': long2ip(sNet),
                'Broadcast ID': long2ip(sBroad),
                'First IP': step >= 2 ? long2ip(sFirst) : '-',
                'Last IP': step >= 2 ? long2ip(sLast) : '-',
                'Total Hosts': step,
                'Active Hosts': step >= 2 ? (step - 2) : 0,
                'Mask': `/${newPrefix}`,
                firstL: sFirst,
                lastL: sLast
            });
        }

        notes.push(`Each subnet has mask /${newPrefix} and ${step} total hosts (${step >= 2 ? step - 2 : 0} usable).`);
    }

    displayResults(netID, broadID, ip_first, ip_last, hosts_total, hosts_active, subnets, notes);
}

function showError(msg) {
    const basicResults = document.getElementById('basicResults');
    const subnetResults = document.getElementById('subnetResults');
    basicResults.innerHTML = `<div class="empty-state">⚠️ ${msg}</div>`;
    subnetResults.innerHTML = '';
}

function displayResults(netID, broadID, ip_first, ip_last, hosts_total, hosts_active, subnets, notes) {
    const basicResults = document.getElementById('basicResults');
    const subnetResults = document.getElementById('subnetResults');
    const resultsNotes = document.getElementById('resultsNotes');

    let noteHtml = '';
    if (notes && notes.length) {
        noteHtml = `<div class="empty-state">💡 ${notes.join(' ')}</div>`;
    }
    resultsNotes.innerHTML = noteHtml;

    let html = '';
    html += '<div class="grid-2">';
    if (netID) html += `<div class="input-group result-field"><label>🌐 Network ID</label><input readonly value="${netID}" id="res-netid"><button class="copy-btn" data-copy="#res-netid" title="Copy Network ID">📋</button></div>`;
    if (broadID) html += `<div class="input-group result-field"><label>📡 Broadcast ID</label><input readonly value="${broadID}" id="res-broadid"><button class="copy-btn" data-copy="#res-broadid" title="Copy Broadcast ID">📋</button></div>`;
    if (ip_first) html += `<div class="input-group result-field"><label>▶️ First IP</label><input readonly value="${ip_first}" id="res-first"><button class="copy-btn" data-copy="#res-first" title="Copy First IP">📋</button></div>`;
    if (ip_last) html += `<div class="input-group result-field"><label>⏸️ Last IP</label><input readonly value="${ip_last}" id="res-last"><button class="copy-btn" data-copy="#res-last" title="Copy Last IP">📋</button></div>`;
    if (hosts_total !== undefined) html += `<div class="input-group result-field"><label>💻 Total Hosts</label><input readonly value="${formatNumber(hosts_total)}" id="res-total"><button class="copy-btn" data-copy="#res-total" title="Copy Total Hosts">📋</button></div>`;
    if (hosts_active !== undefined) html += `<div class="input-group result-field"><label>✅ Active Hosts</label><input readonly value="${formatNumber(hosts_active)}" id="res-active"><button class="copy-btn" data-copy="#res-active" title="Copy Active Hosts">📋</button></div>`;
    html += '</div>';
    
    // Add View Hosts button
    html += `<a href="hosts.html" class="btn btn-host">🖥️ View All Hosts</a>`;

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
                if (key === 'Mask' || key === 'index' || key === 'firstL' || key === 'lastL') continue;
                const icons = {
                    'Subnet ID': '🌐',
                    'Broadcast ID': '📡',
                    'First IP': '▶️',
                    'Last IP': '⏸️',
                    'Total Hosts': '💻',
                    'Active Hosts': '✅'
                };
                const id = `sub-${i}-${key.replace(/\s+/g,'').toLowerCase()}`;
                subnetHtml += `<div class="input-group result-field"><label>${icons[key]} ${key}</label><input readonly value="${value}" id="${id}"><button class="copy-btn" data-copy="#${id}" title="Copy ${key}">📋</button></div>`;
            }
            subnetHtml += '</div>';
            
            // Store subnet data for hosts page
            const subnetKey = `subnet_${i}`;
            localStorage.setItem(subnetKey, JSON.stringify({
                index: subnet.index,
                subnetID: subnet['Subnet ID'],
                broadID: subnet['Broadcast ID'],
                firstIP: subnet['First IP'],
                lastIP: subnet['Last IP'],
                firstL: subnet.firstL,
                lastL: subnet.lastL,
                total: subnet['Total Hosts'],
                active: subnet['Active Hosts']
            }));
            
            subnetHtml += `<a href="hosts.html?subnet=${i}" class="btn btn-host">🖥️ View Hosts for Subnet ${i + 1}</a>`;
            subnetHtml += `</div>`;
        });
        subnetHtml += '</div>';
        
        // Store subnet count
        localStorage.setItem('subnet_count', subnets.length);
    } else {
        localStorage.removeItem('subnet_count');
    }

    subnetResults.innerHTML = subnetHtml;

    setupCopyButtons();
}

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

    const copyAll = document.getElementById('copyAllBtn');
    if (copyAll) {
        copyAll.removeEventListener('click', copyAll._cb);
        copyAll._cb = () => {
            const values = Array.from(document.querySelectorAll('#basicResults input[readonly], .subnet-list input[readonly]'))
                .map(i => i.value)
                .filter(v => v !== undefined && v !== null && String(v).trim() !== '');
            if (values.length === 0) return;
            navigator.clipboard.writeText(values.join('\n'))
                .then(() => { copyAll.textContent = '✅'; setTimeout(()=> copyAll.textContent = '📋 Copy All',900); })
                .catch(() => { copyAll.textContent = '❌'; setTimeout(()=> copyAll.textContent = '📋 Copy All',900); });
        };
        copyAll.addEventListener('click', copyAll._cb);
    }
}

// Run calculation on page load
window.addEventListener('DOMContentLoaded', calculate);