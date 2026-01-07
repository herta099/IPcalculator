<!DOCTYPE html>
<html lang="sq">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Subnet Calculator</title>
<link rel="stylesheet" href="style.css">
</head>
<body>

<video class="video-bg" autoplay muted loop>
    <source src="p1.mp4" type="video/mp4">
</video>

<div class="container">
    <div class="card">
        <h1>🌐 Subnet Calculator</h1>
        <p class="subtitle">Calculate network subnets</p>

        <form action="results.php" method="post">
            <div class="input-group">
                <label>IP Address</label>
                <input type="text" name="ip" placeholder="192.168.1.10" required>
            </div>

            <div class="input-group">
                <label>Subnet Mask</label>
                <input type="text" name="mask" placeholder="/24" required>
            </div>

            <button type="submit" class="btn">Calculate</button>
        </form>
    </div>
</div>

</body>
</html>
