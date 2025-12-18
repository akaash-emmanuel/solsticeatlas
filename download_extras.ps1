$baseUrl = "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/"
$targetDir = "c:\Users\rayip\Documents\GitHub\solsticeatlas\src\assets\textures"

# Earth Clouds
Invoke-WebRequest -Uri "$baseUrl/earth_clouds_1024.png" -OutFile "$targetDir\earth_clouds.png"
Write-Host "Downloaded Earth Clouds"

# Earth Normal (Optional but good)
Invoke-WebRequest -Uri "$baseUrl/earth_normal_2048.jpg" -OutFile "$targetDir\earth_normal.jpg"
Write-Host "Downloaded Earth Normal"

# Earth Specular (Water reflection)
Invoke-WebRequest -Uri "$baseUrl/earth_specular_2048.jpg" -OutFile "$targetDir\earth_specular.jpg"
Write-Host "Downloaded Earth Specular"
