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

if (mainNetwork) {
    const firstL = mainNetwork.firstL;
    const lastL = mainNetwork.lastL;
    const total = (lastL - firstL) + 1;
    
    document.getElementById('badge').textContent = total;
    document.getElementById('title').textContent = 'Renditja e Hosteve';
    
    const maxDisplay = Math.min(total, 1000);
    let html = '';
    
    html += `<div style="background: rgba(100,100,200,0.2); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 16px;">
            <strong>Network ID:</strong> ${mainNetwork.netID}<br>
            <strong>Broadcast ID:</strong> ${mainNetwork.broadID}<br>
            <strong>IP Range:</strong> ${long2ip(firstL)} - ${long2ip(lastL)}<br>
            <strong>Total Hosts:</strong> ${mainNetwork.hostsTotal}<br>
            <strong>Usable Hosts:</strong> ${mainNetwork.hostsActive}
        </p>
    </div>`;
    
    for (let i = 0; i < maxDisplay; i++) {
        const hostL = firstL + i;
        const hostIP = long2ip(hostL);
        
        html += `
        <div class="subnet-item">
            <div style="display: flex; align-items: center; gap: 20px;">
                <h3 style="margin: 0; min-width: 100px;">Host #${i + 1}</h3>
                <div class="subnet-field" style="flex: 1;">
                    <label>IP Address</label>
                    <div class="value">${hostIP}</div>
                </div>
            </div>
        </div>`;
    }
    
    if (total > maxDisplay) {
        html += `<p style="text-align:center; margin-top:20px; color:#aaa;">Duke shfaqur ${maxDisplay} nga ${total} hosts totale (limituar për performancë)</p>`;
    }
    
    document.getElementById('hostsList').innerHTML = html;
    
} else if (subnetsData && subnetsData.length > 0) {
    let totalSubnets = subnetsData.length;
    document.getElementById('badge').textContent = totalSubnets;
    document.getElementById('title').textContent = 'Të gjitha Subnetet';
    
    let html = '';
    subnetsData.forEach((subnet, index) => {
        const subnetTotal = (subnet.lastL - subnet.firstL) + 1;
        
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
                <div class="subnet-field">
                    <label>Total IPs</label>
                    <div class="value">${subnetTotal}</div>
                </div>
            </div>
        </div>`;
    });
    
    document.getElementById('hostsList').innerHTML = html;
    
} else {
    document.getElementById('hostsList').innerHTML = '<p style="text-align:center; padding: 40px;">Nuk ka të dhëna. Kthehu prapa dhe llogarit përsëri.</p>';
}

function copyAll() {
    let textToCopy = '';
    
    if (mainNetwork) {
        const firstL = mainNetwork.firstL;
        const lastL = mainNetwork.lastL;
        const total = (lastL - firstL) + 1;
        const maxCopy = Math.min(total, 1000);
        
        for (let i = 0; i < maxCopy; i++) {
            const hostL = firstL + i;
            const hostIP = long2ip(hostL);
            textToCopy += `Host #${i + 1}: ${hostIP}\n`;
        }
    } else if (subnetsData && subnetsData.length > 0) {
        subnetsData.forEach((subnet, index) => {
            textToCopy += `Subnet #${index + 1}\n`;
            textToCopy += `Network: ${subnet.subnetID}\n`;
            textToCopy += `Broadcast: ${subnet.broadID}\n`;
            textToCopy += `Range: ${long2ip(subnet.firstL)} - ${long2ip(subnet.lastL)}\n`;
            textToCopy += `Hosts: ${subnet.hostsActive} usable\n\n`;
        });
    }
    
    if (textToCopy) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert('Të dhënat u kopjuan me sukses!');
        }).catch(err => {
            alert('Gabim gjatë kopjimit: ' + err);
        });
    } else {
        alert('Nuk ka të dhëna për të kopjuar!');
    }
    
    return false;
}