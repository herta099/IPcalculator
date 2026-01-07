<?php
function ipToLong($ip) {
    return sprintf('%u', ip2long($ip));
}

function longToIp($long) {
    return long2ip($long);
}

$ip = $_POST['ip'] ?? '';
$maskInput = $_POST['mask'] ?? '';

$mask = str_replace('/', '', $maskInput);
$mask = intval($mask);

$ipLong = ipToLong($ip);
$maskLong = (-1 << (32 - $mask)) & 0xFFFFFFFF;

$network = $ipLong & $maskLong;
$broadcast = $network | (~$maskLong & 0xFFFFFFFF);
?>

<!DOCTYPE html>
<html lang="sq">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Results</title>
<link rel="stylesheet" href="style.css">
</head>
<body>

<video class="video-bg" autoplay muted loop>
    <source src="p1.mp4" type="video/mp4">
</video>

<div class="container">
    <div class="card">
        <h1>📊 Results</h1>

        <div class="input-group">
            <label>🌐 Network ID</label>
            <input readonly value="<?= longToIp($network) ?>">
        </div>

        <div class="input-group">
            <label>📡 Broadcast ID</label>
            <input readonly value="<?= longToIp($broadcast) ?>">
        </div>

        <button class="btn btn-secondary" onclick="window.location.href='index.php'">
            🔄 Back
        </button>
    </div>
</div>

</body>
</html>
