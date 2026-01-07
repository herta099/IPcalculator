function long2ip(l) {
    return [(l >>> 24) & 255, (l >>> 16) & 255, (l >>> 8) & 255, l & 255].join('.');
}

const data = JSON.parse(localStorage.getItem('hosts_data') || '{}');

if (data.firstL && data.lastL) {
    const total = data.lastL - data.firstL + 1;
    document.getElementById('badge').textContent = total;
    
    const max = Math.min(total, 1000);
    let html = '';
    
    for (let i = 0; i < max; i++) {
        const hostL = data.firstL + i;
        const ip = long2ip(hostL);
        const num = i + 1;
        
        html += `
        <div class="subnet-item">
            <div class="subnet-row">
                <div class="subnet-field">
                    <label>#${num}</label>
                    <div class="value">Network: ${ip}/30</div>
                </div>
                <div class="subnet-field">
                    <label>First IP</label>
                    <div class="value">${ip}</div>
                </div>
                <div class="subnet-field">
                    <label>Last IP</label>
                    <div class="value">${ip}</div>
                </div>
                <div class="subnet-field">
                    <label>Hosts</label>
                    <div class="value">2</div>
                </div>
            </div>
        </div>`;
    }
    
    document.getElementById('hostsList').innerHTML = html;
} else {
    document.getElementById('hostsList').innerHTML = '<p style="text-align:center">Nuk ka të dhëna. Kthe pas dhe llogarit përsëri.</p>';
}