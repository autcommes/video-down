# 直接测试 yt-dlp 获取视频信息
$url = "https://www.bilibili.com/video/BV1xx411c7mD"

Write-Host "测试 yt-dlp 获取视频信息..." -ForegroundColor Cyan
Write-Host "URL: $url" -ForegroundColor Yellow
Write-Host ""

# 检查 yt-dlp 是否存在
if (Test-Path ".\yt-dlp.exe") {
    Write-Host "✓ 找到 yt-dlp.exe" -ForegroundColor Green
} else {
    Write-Host "✗ 未找到 yt-dlp.exe" -ForegroundColor Red
    exit 1
}

# 测试版本
Write-Host ""
Write-Host "yt-dlp 版本:" -ForegroundColor Cyan
.\yt-dlp.exe --version

# 测试获取视频信息
Write-Host ""
Write-Host "获取视频信息 (--dump-json)..." -ForegroundColor Cyan
Write-Host "命令: .\yt-dlp.exe --dump-json --no-playlist $url" -ForegroundColor Gray
Write-Host ""

$startTime = Get-Date
.\yt-dlp.exe --dump-json --no-playlist $url 2>&1 | Tee-Object -Variable output
$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds

Write-Host ""
Write-Host "执行时间: $duration 秒" -ForegroundColor Yellow

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ 成功获取视频信息" -ForegroundColor Green
} else {
    Write-Host "✗ 获取视频信息失败 (退出码: $LASTEXITCODE)" -ForegroundColor Red
}
