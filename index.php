<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Calculator</title>
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
    width:420px;
    margin:50px auto;
    padding:20px;
    border-radius:15px;
}
input,button{
    width:100%;
    padding:8px;
    margin:6px 0;
}
button{
    background:#6ec6ff;
    border:0;
    cursor:pointer;
}
</style>
</head>
<body>

<!-- VIDEO BACKGROUND -->
<video class="bg" autoplay muted loop>
  <source src="p1.mp4" type="video/mp4">
</video>

<div class="box">
<h2 align="center">Calculator</h2>

<form action="result.php" method="post">
IP:
<input name="ip" placeholder="192.168.1.10">

Network ID:
<input name="network" placeholder="192.168.1.0">

Subnet Mask:
<input name="mask" placeholder="255.255.255.0">

Nr Subneteve:
<input name="nr_subnets" placeholder="4">

<button>Calculate</button>
</form>
</div>

</body>
</html>
