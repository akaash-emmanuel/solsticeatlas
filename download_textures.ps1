
$targetDir = "src/assets/textures"
New-Item -ItemType Directory -Force -Path $targetDir

$sources = @(
    "https://raw.githubusercontent.com/favia96/Solar-System_OpenGL/master/img",
    "https://raw.githubusercontent.com/mwrona/Three.js-Solar-System/master/img",
    "https://raw.githubusercontent.com/glebj/solar-system/master/img"
)

$files = @(
    "sun.jpg",
    "mercury.jpg",
    "venus.jpg",
    "earth.jpg",
    "mars.jpg",
    "jupiter.jpg",
    "saturn.jpg",
    "saturn_ring.png",
    "uranus.jpg",
    "neptune.jpg"
)

foreach ($file in $files) {
    $downloaded = $false
    foreach ($base in $sources) {
        if ($downloaded) { continue }
        $url = "$base/$file"
        $output = "$targetDir/$file"
        try {
            Invoke-WebRequest -Uri $url -OutFile $output -ErrorAction Stop
            Write-Host "Success: $file from $base"
            $downloaded = $true
        } catch {
            # Silent fail, try next source
        }
    }
    if (-not $downloaded) {
        Write-Host "ERROR: Could not download $file from any source."
        # Create a dummy file to prevent build error? No, better to know.
    }
}
