function long2ip(long) {
    return [
        (long >>> 24) & 0xFF,
        (long >>> 16) & 0xFF,
        (long >>> 8) & 0xFF,
        long & 0xFF
    ].join('.');
}

const mainNetwork = JSON.parse(localStorage.getItem('main_network') || 'null');
const subnetsData = JSON.parse(localStorage.getItem('subnets_data') || '[]');

if (subnetsData && subnetsData.length > 0) {
    let totalSubnets = subnetsData.length;
    document.getElementById('badge').textContent = totalSubnets;
    document.getElementById('title').textContent = 'Të gjitha Subnetet';
    
    let html = '';
    subnetsData.forEach((subnet, index) => {
        html += `
        <div class="subnet-item">
            <h3>#${index + 1} - Network: ${subnet.subnetID}</h3>
            <div class="subnet-row">
                <div class="subnet-field">
                    <label>Subnet ID</label>
                    <div class="value">${subnet.subnetID}</div>
                </div>
                <div class="subnet-field">
                    <label>Broadcast ID</label>
                    <div class="value">${subnet.broadID}</div>
                </div>
                <div class="subnet-field">
                    <label>First IP</label>
                    <div class="value">${long2ip(subnet.firstL)}</div>
                </div>
                <div class="subnet-field">
                    <label>Last IP</label>
                    <div class="value">${long2ip(subnet.lastL)}</div>
                </div>
            </div>
            <div class="subnet-row" style="margin-top:10px;">
                <div class="subnet-field">
                    <label>Host Total</label>
                    <div class="value">${subnet.hostsTotal}</div>
                </div>
                <div class="subnet-field">
                    <label>Host Aktiv</label>
                    <div class="value">${subnet.hostsActive}</div>
                </div>
                <div class="subnet-field">
                    <label>Range</label>
                    <div class="value">${long2ip(subnet.firstL)} - ${long2ip(subnet.lastL)}</div>
                </div>
            </div>
        </div>`;
    });
    
    document.getElementById('hostsList').innerHTML = html;
    
} else if (mainNetwork) {
    const total = (mainNetwork.lastL - mainNetwork.firstL) + 1;
    document.getElementById('badge').textContent = total;
    document.getElementById('title').textContent = 'Network Kryesor';
    
    const maxDisplay = Math.min(total, 500);
    let html = '';
    
    for (let i = 0; i < maxDisplay; i++) {
        const hostL = mainNetwork.firstL + i;
        const hostIP = long2ip(hostL);
        
        html += `
        <div class="subnet-item">
            <h3>Host #${i + 1}</h3>
            <div class="subnet-row">
                <div class="subnet-field">
                    <label>IP Address</label>
                    <div class="value">${hostIP}</div>
                </div>
            </div>
        </div>`;
    }
    
    if (total > maxDisplay) {
        html += `<p style="text-align:center; margin-top:20px; color:#aaa;">Shfaqen ${maxDisplay} nga ${total} hosts totale</p>`;
    }
    
    document.getElementById('hostsList').innerHTML = html;
} else {
    document.getElementById('hostsList').innerHTML = '<p style="text-align:center;">Nuk ka të dhëna. Kthe pas dhe llogarit përsëri.</p>';
}

function copyAll() {
    alert('Funksionaliteti i kopjimit do të shtohet së shpejti!');
    return false;
}