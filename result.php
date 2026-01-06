<?php
function L($ip){ return ip2long($ip); }
function I($l){ return long2ip($l); }

$ip = $_POST['ip'] ?? '';
$network = $_POST['network'] ?? '';
$mask = $_POST['mask'] ?? '';
$nr = $_POST['nr_subnets'] ?? '';

$netID = $broadID = '';
$ip_first = $ip_last = '';
$hosts_total = $hosts_active = '';
$subnets = [];

/* a) IP + SUBNET MASK */
if ($ip && $mask) {
    $netL = L($ip) & L($mask);
    $broadL = $netL | (~L($mask));
    $netID = I($netL);
    $broadID = I($broadL);
}

/* b) VETËM NETWORK ID */
if ($network && !$nr) {
    $netL = L($network);
    $maskL = $mask ? L($mask) : -256; // default /24
    $broadL = $netL | (~$maskL);
    $hosts_total = (~$maskL) + 1;
    $hosts_active = $hosts_total - 2;
    $ip_first = I($netL + 1);
    $ip_last  = I($broadL - 1);
}

/* c) NETWORK ID + NR SUBNETEVE */
if ($network && $nr) {
    $netL = L($network);
    $bits = ceil(log($nr,2));
    $step = pow(2,$bits);
    $hosts_total = $step;
    $hosts_active = $step - 2;

    for($i=0;$i<$nr;$i++){
        $sNet = $netL + ($i*$step);
        $sBroad = $sNet + $step - 1;
        $subnets[] = [
            'Subnet ID'    => I($sNet),
            'Broadcast ID' => I($sBroad),
            'IP Parë'      => I($sNet + 1),
            'IP Fundit'    => I($sBroad - 1),
            'Host Total'   => $hosts_total,
            'Host Aktiv'   => $hosts_active
        ];
    }
}
?>

<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Rezultatet</title>
<style>
body{
    margin:0;
    font-family:Arial;
}
.bg{
    position:fixed;
    top:0; left:0;
    width:100%; height:100%;
    object-fit:cover;
    z-index:-1;
}
.box{
    background:rgba(255,255,255,0.85);
    width:460px;
    margin:30px auto;
    padding:20px;
    border-radius:15px;
}
input{
    width:100%;
    padding:6px;
    margin:4px 0;
}
button{
    width:100%;
    padding:8px;
    background:#6ec6ff;
    border:0;
    cursor:pointer;
}
</style>
</head>
<body>

<!-- VIDEO BACKGROUND -->
<video class="bg" autoplay muted loop>
  <source src="p2.mp4" type="video/mp4">
</video>

<div class="box">
<h2 align="center">Rezultatet</h2>

Network ID:
<input value="<?= $netID ?>">

Broadcast ID:
<input value="<?= $broadID ?>">

IP e Parë:
<input value="<?= $ip_first ?>">

IP e Fundit:
<input value="<?= $ip_last ?>">

Host Total:
<input value="<?= $hosts_total ?>">

Host Aktiv:
<input value="<?= $hosts_active ?>">

<?php if($subnets): ?>
<hr>
<?php foreach($subnets as $i=>$s): ?>
<b>Subnet <?= $i+1 ?></b>
<?php foreach($s as $v): ?>
<input value="<?= $v ?>">
<?php endforeach; ?>
<?php endforeach; ?>
<?php endif; ?>

<form action="index.php">
<button>Reset</button>
</form>

</div>

</body>
</html>
