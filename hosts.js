function long2ip(long) {
    return [
        (long >>> 24) & 0xFF,
        (long >>> 16) & 0xFF,
        (long >>> 8) & 0xFF,
        long & 0xFF
    ].join('.');
}

function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        subnet: params.get('subnet')
    };
}

function displayHosts() {
    const params = getUrlParams();
    const subnetIndex = params.subnet;
    
    const hostInfo = document.getElementById('hostInfo');
    const hostsList = document.getElementById('hostsList');
    
    let data;
    let title = '';
    
    // Check if we're viewing a specific subnet or the main network
    if (subnetIndex !== null) {
        const subnetData = localStorage.getItem(`subnet_${subnetIndex}`);
        if (!subnetData) {
            hostInfo.innerHTML = '<div class="empty-state">⚠️ No subnet data found. Please calculate from the home page.</div>';
            return;
        }
        data = JSON.parse(subnetData);
        title = `Subnet ${parseInt(subnetIndex) + 1}`;
    } else {
        const networkData = localStorage.getItem('subnet_data');
        if (!networkData) {
            hostInfo.innerHTML = '<div class="empty-state">⚠️ No network data found. Please calculate from the home page.</div>';
            return;
        }
        data = JSON.parse(networkData);
        title = 'Main Network';
    }
    
    // Display info
    let infoHtml = '<div class="empty-state">';
    infoHtml += `<strong>${title}</strong><br>`;
    if (subnetIndex !== null) {
        infoHtml += `Network: ${data.subnetID} - ${data.broadID}<br>`;
        infoHtml += `Range: ${data.firstIP} - ${data.lastIP}<br>`;
        infoHtml += `Total Hosts: ${data.total} | Active Hosts: ${data.active}`;
    } else {
        infoHtml += `Network: ${data.netID} - ${data.broadID}<br>`;
        infoHtml += `Range: ${data.firstIP} - ${data.lastIP}<br>`;
        infoHtml += `Total Hosts: ${data.hosts_total} | Active Hosts: ${data.hosts_active}`;
    }
    infoHtml += '</div>';
    hostInfo.innerHTML = infoHtml;
    
    // Generate host list
    const firstL = data.firstL;
    const lastL = data.lastL;
    const totalHosts = (lastL - firstL) + 1;
    
    if (totalHosts <= 0) {
        hostsList.innerHTML = '<div class="empty-state">No usable hosts in this range.</div>';
        return;
    }
    
    // Limit display to prevent browser freeze (max 10000 hosts)
    const maxDisplay = Math.min(totalHosts, 10000);
    let hostsHtml = '';
    
    for (let i = 0; i < maxDisplay; i++) {
        const hostL = (firstL + i) >>> 0;
        const hostIP = long2ip(hostL);
        hostsHtml += `<div class="host-item">`;
        hostsHtml += `<span class="host-number">#${i + 1}</span>`;
        hostsHtml += `<span class="host-ip">${hostIP}</span>`;
        hostsHtml += `</div>`;
    }
    
    if (totalHosts > maxDisplay) {
        hostsHtml += `<div class="empty-state">⚠️ Showing first ${maxDisplay} of ${totalHosts} hosts (limited for performance)</div>`;
    }
    
    hostsList.innerHTML = hostsHtml;
    
    // Setup copy all button
    setupCopyAllHosts(firstL, lastL);
}

function setupCopyAllHosts(firstL, lastL) {
    const copyBtn = document.getElementById('copyAllHostsBtn');
    if (!copyBtn) return;
    
    copyBtn.addEventListener('click', () => {
        const totalHosts = (lastL - firstL) + 1;
        const maxCopy = Math.min(totalHosts, 10000);
        
        let allHosts = [];
        for (let i = 0; i < maxCopy; i++) {
            const hostL = (firstL + i) >>> 0;
            allHosts.push(long2ip(hostL));
        }
        
        navigator.clipboard.writeText(allHosts.join('\n'))
            .then(() => {
                copyBtn.textContent = '✅ Copied!';
                setTimeout(() => copyBtn.textContent = '📋 Copy All', 900);
            })
            .catch(() => {
                copyBtn.textContent = '❌ Failed';
                setTimeout(() => copyBtn.textContent = '📋 Copy All', 900);
            });
    });
}

// Run on page load
window.addEventListener('DOMContentLoaded', displayHosts);