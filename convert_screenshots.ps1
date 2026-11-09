Add-Type -AssemblyName System.Drawing

function Resize-Image($srcPath, $destPath, $width, $height) {
    $img = [System.Drawing.Image]::FromFile($srcPath)
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($img, 0, 0, $width, $height)
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    $img.Dispose()
}

$desktopImg = 'C:\Users\Zamzam Laptops\.gemini\antigravity-ide\brain\fb9ddcfa-5b9d-4972-8296-bd2c67e3cf03\smartrent_desktop_preview_1792273459210.jpg'
$mobileImg = 'C:\Users\Zamzam Laptops\.gemini\antigravity-ide\brain\fb9ddcfa-5b9d-4972-8296-bd2c67e3cf03\smartrent_mobile_preview_1792273483363.jpg'

Resize-Image $desktopImg 'c:\Users\Zamzam Laptops\Desktop\Smartrent\smartrent-frontend\public\screenshot-wide.png' 1280 720
Resize-Image $mobileImg 'c:\Users\Zamzam Laptops\Desktop\Smartrent\smartrent-frontend\public\screenshot-narrow.png' 720 1280
Write-Output "Successfully generated PWA screenshots!"
