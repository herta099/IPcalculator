function ip2long(ip) {
    const p = ip.split('.');
    return (parseInt(p[0]) << 24) + (parseInt(p[1]) << 16) + (parseInt(p[2]) << 8) + parseInt(p[3]);
}

function long2ip(l) {
    return [(l >>> 24) & 255, (l >>> 16) & 255, (l >>> 8) & 255, l & 255].join('.');
}

const params = new URLSearchParams(window.location.search);
const ip = params.get('ip') || '';
const network = params.get('network') || '';
const mask = params.get('mask') || '255.255.255.0';

let netL, maskL, broadL;

if (network) {
    netL = ip2long(network);
    maskL = ip2long(mask);
} else if (ip) {
    const ipOnly = ip.split('/')[0];
    maskL = ip2long(mask);
    netL = ip2long(ipOnly) & maskL;
}

broadL = netL | (~maskL >>> 0);
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
document.getElementById('hostfirst').value = long2ip(firstL);
document.getElementById('hostlast').value = long2ip(lastL);