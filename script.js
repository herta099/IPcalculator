function ip2long(ip) {
    const p = ip.split('.');
    return (parseInt(p[0]) << 24) + (parseInt(p[1]) << 16) + (parseInt(p[2]) << 8) + parseInt(p[3]);
}

function long2ip(l) {
    return [(l >>> 24) & 255, (l >>> 16) & 255, (l >>> 8) & 255, l & 255].join('.');
}

function maskForPrefix(prefix) {
    return ((0xFFFFFFFF << (32 - prefix)) >>> 0);
}

const params = new URLSearchParams(window.location.search);
const ip = params.get('ip') || '';
const network = params.get('network') || '';
const mask = params.get('mask') || '255.255.255.0';
const nrHosts = parseInt(params.get('nr_hosts') || '0');

let netL, maskL, broadL;

if (network) {
    netL = ip2long(network);
    maskL = ip2long(mask);
} else if (ip) {
    const ipOnly = ip.split('/')[0];
    maskL = ip2long(mask);
    netL = ip2long(ipOnly) & maskL;
}

broadL = (netL | (~maskL >>> 0)) >>> 0;
const firstL = netL + 1;
const lastL = broadL - 1;
const total = (~maskL >>> 0) + 1;
const active = total - 2;

document.getElementById('netid').value = long2ip(netL);
document.getElementById('broadid').value = long2ip(broadL);
document.getElementById('firstip').value = long2ip(firstL);
document.getElementById('lastip').value = long2ip(lastL);
document.getElementById('hosttotal').value = total;
document.getElementById('hostaktiv').value = active;
document.getElementById('rangefirst').value = long2ip(firstL);
document.getElementById('rangelast').value = long2ip(lastL);

localStorage.setItem('hosts_data', JSON.stringify({
    firstL: firstL,
    lastL: lastL,
    total: total
}));

if (nrHosts > 0) {
    const bits = Math.ceil(Math.log2(nrHosts));
    const newPrefix = 32 - bits;
    const step = Math.pow(2, bits);
    
    let subnetHtml = '<div style="margin-top:30px"><h3>Subnetet:</h3>';
    
    for (let i = 0; i < nrHosts; i++) {
        const sNet = netL + (i * step);
        const sBroad = sNet + step - 1;
        const sFirst = sNet + 1;
        const sLast = sBroad - 1;
        
        subnetHtml += `
        <div style="background:#f0f0f0; padding:15px; margin:10px 0; border-radius:8px;">
            <strong>Subnet ${i + 1}</strong>
            <div class="row" style="margin-top:10px;">
                <div>Network: ${long2ip(sNet)}</div>
                <div>Broadcast: ${long2ip(sBroad)}</div>
            </div>
            <div class="row">
                <div>First IP: ${long2ip(sFirst)}</div>
                <div>Last IP: ${long2ip(sLast)}</div>
            </div>
        </div>`;
    }
    
    subnetHtml += '</div>';
    document.getElementById('subnets').innerHTML = subnetHtml;
}