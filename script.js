function ip2long(ip) {
    const parts = ip.split('.');
    return ((parseInt(parts[0]) << 24) >>> 0) + 
           ((parseInt(parts[1]) << 16) >>> 0) + 
           ((parseInt(parts[2]) << 8) >>> 0) + 
           (parseInt(parts[3]) >>> 0);
}

function long2ip(long) {
    return [
        (long >>> 24) & 0xFF,
        (long >>> 16) & 0xFF,
        (long >>> 8) & 0xFF,
        long & 0xFF
    ].join('.');
}

function long2binary(long) {
    let binary = '';
    for (let i = 0; i < 4; i++) {
        const octet = (long >>> (24 - i * 8)) & 0xFF;
        binary += octet.toString(2).padStart(8, '0');
        if (i < 3) binary += '.';
    }
    return binary;
}

function getIPClass(ip) {
    const firstOctet = parseInt(ip.split('.')[0]);
    if (firstOctet >= 1 && firstOctet <= 126) return 'Class A';
    if (firstOctet >= 128 && firstOctet <= 191) return 'Class B';
    if (firstOctet >= 192 && firstOctet <= 223) return 'Class C';
    if (firstOctet >= 224 && firstOctet <= 239) return 'Class D (Multicast)';
    if (firstOctet >= 240 && firstOctet <= 255) return 'Class E (Reserved)';
    return 'Unknown';
}

function parseMask(maskStr) {
    if (!maskStr) return null;
    maskStr = maskStr.trim();
    
    if (maskStr.startsWith('/')) {
        const prefix = parseInt(maskStr.slice(1), 10);
        if (prefix >= 0 && prefix <= 32) {
            const maskLong = (0xFFFFFFFF << (32 - prefix)) >>> 0;
            return { prefix: prefix, maskLong: maskLong };
        }
    }
    
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(maskStr)) {
        const maskLong = ip2long(maskStr);
        let prefix = 0;
        for (let i = 31; i >= 0; i--) {
            if ((maskLong >>> i) & 1) prefix++;
            else break;
        }
        return { prefix: prefix, maskLong: maskLong };
    }
    
    return null;
}

const params = new URLSearchParams(window.location.search);
const ipInput = params.get('ip') || '';
const networkInput = params.get('network') || '';
const maskInput = params.get('mask') || '';
const nrSubnets = parseInt(params.get('nr_subnets') || '0');

let netL, maskL, basePrefix = 24;
let originalIP = '';

const maskInfo = parseMask(maskInput);
if (maskInfo) {
    maskL = maskInfo.maskLong;
    basePrefix = maskInfo.prefix;
} else {
    maskL = (0xFFFFFFFF << 8) >>> 0;
    basePrefix = 24;
}

if (networkInput) {
    netL = ip2long(networkInput) & maskL;
    originalIP = networkInput;
} else if (ipInput) {
    const ipOnly = ipInput.split('/')[0];
    netL = ip2long(ipOnly) & maskL;
    originalIP = ipOnly;
} else {
    alert('Ju lutem vendosni një IP ose Network ID!');
}

const broadL = (netL | (~maskL >>> 0)) >>> 0;
const firstL = netL + 1;
const lastL = broadL - 1;
const hostsTotal = ((~maskL >>> 0) + 1) >>> 0;
const hostsActive = hostsTotal >= 2 ? hostsTotal - 2 : 0;

// Shfaq rezultatet
document.getElementById('ipclass').value = getIPClass(originalIP);
document.getElementById('subnetmask').value = long2ip(maskL);
document.getElementById('binarymask').value = long2binary(maskL);
document.getElementById('netid').value = long2ip(netL);
document.getElementById('broadid').value = long2ip(broadL);
document.getElementById('firstip').value = long2ip(firstL);
document.getElementById('lastip').value = long2ip(lastL);
document.getElementById('hosttotal').value = hostsTotal;
document.getElementById('hostaktiv').value = hostsActive;
document.getElementById('rangefirst').value = long2ip(firstL);
document.getElementById('rangelast').value = long2ip(lastL);

if (nrSubnets > 0) {
    const bitsNeeded = Math.ceil(Math.log2(nrSubnets));
    const newPrefix = basePrefix + bitsNeeded;
    
    if (newPrefix > 32) {
        alert('Nuk ka mjaftueshëm hapësirë për këto subnete!');
    } else {
        const newMaskL = (0xFFFFFFFF << (32 - newPrefix)) >>> 0;
        const subnetSize = Math.pow(2, 32 - newPrefix);
        
        let subnetHtml = '<div class="subnet-section"><h3 style="text-align:center; margin-bottom:20px;">Subnetet (' + nrSubnets + ')</h3>';
        
        for (let i = 0; i < nrSubnets; i++) {
            const subnetNet = (netL + (i * subnetSize)) >>> 0;
            const subnetBroad = (subnetNet + subnetSize - 1) >>> 0;
            const subnetFirst = subnetNet + 1;
            const subnetLast = subnetBroad - 1;
            const subnetHostsTotal = subnetSize;
            const subnetHostsActive = subnetSize >= 2 ? subnetSize - 2 : 0;
            
            subnetHtml += `
            <div class="subnet-card">
                <h3>Subnet #${i + 1} - /${newPrefix}</h3>
                <div class="row">
                    <div>
                        <label>Subnet ID:</label>
                        <input readonly value="${long2ip(subnetNet)}">
                    </div>
                    <div>
                        <label>Broadcast ID:</label>
                        <input readonly value="${long2ip(subnetBroad)}">
                    </div>
                </div>
                <div class="row">
                    <div>
                        <label>IP E Parë:</label>
                        <input readonly value="${long2ip(subnetFirst)}">
                    </div>
                    <div>
                        <label>IP E Fundit:</label>
                        <input readonly value="${long2ip(subnetLast)}">
                    </div>
                </div>
                <div class="row">
                    <div>
                        <label>Host Total:</label>
                        <input readonly value="${subnetHostsTotal}">
                    </div>
                    <div>
                        <label>Host Aktiv:</label>
                        <input readonly value="${subnetHostsActive}">
                    </div>
                </div>
            </div>`;
        }
        
        subnetHtml += '</div>';
        document.getElementById('subnets').innerHTML = subnetHtml;
    }
}