# YouTube Cookie 测试脚本
# 用于测试 cookies.txt 是否有效

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "YouTube Cookie 测试工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 yt-dlp.exe 是否存在
if (-not (Test-Path ".\yt-dlp.exe")) {
    Write-Host "错误: 找不到 yt-dlp.exe" -ForegroundColor Red
    Write-Host "请确保在正确的目录运行此脚本" -ForegroundColor Yellow
    pause
    exit 1
}

# 检查 cookies.txt 是否存在
if (-not (Test-Path ".\cookies.txt")) {
    Write-Host "错误: 找不到 cookies.txt 文件" -ForegroundColor Red
    Write-Host ""
    Write-Host "请按照以下步骤操作：" -ForegroundColor Yellow
    Write-Host "1. 安装浏览器扩展 'Get cookies.txt LOCALLY'" -ForegroundColor White
    Write-Host "   Chrome: https://chrome.google.com/webstore/detail/cclelndahbckbenkjhflpdbgdldlbecc" -ForegroundColor White
    Write-Host "2. 在浏览器中登录 YouTube" -ForegroundColor White
    Write-Host "3. 点击扩展图标导出 Cookie" -ForegroundColor White
    Write-Host "4. 将导出的文件重命名为 cookies.txt" -ForegroundColor White
    Write-Host "5. 放到当前目录: $PWD" -ForegroundColor White
    Write-Host ""
    pause
    exit 1
}

Write-Host "✓ 找到 yt-dlp.exe" -ForegroundColor Green
Write-Host "✓ 找到 cookies.txt" -ForegroundColor Green
Write-Host ""

# 测试视频 URL（YouTube 官方测试视频）
$testUrl = "https://www.youtube.com/watch?v=jNQXAC9IVRw"

Write-Host "正在测试 Cookie 有效性..." -ForegroundColor Cyan
Write-Host "测试视频: $testUrl" -ForegroundColor Gray
Write-Host ""

# 尝试获取视频信息
Write-Host "执行命令: yt-dlp.exe --cookies cookies.txt --skip-download --print `"%(title)s`" $testUrl" -ForegroundColor Gray
Write-Host ""

$output = & .\yt-dlp.exe --cookies cookies.txt --skip-download --print "%(title)s" $testUrl 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ Cookie 有效！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "视频标题: $output" -ForegroundColor White
    Write-Host ""
    Write-Host "你现在可以使用此 Cookie 下载 YouTube 视频了！" -ForegroundColor Green
    Write-Host ""
    Write-Host "下载命令示例：" -ForegroundColor Cyan
    Write-Host "  .\yt-dlp.exe --cookies cookies.txt `"视频URL`"" -ForegroundColor White
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "✗ Cookie 无效或已过期" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "错误信息:" -ForegroundColor Yellow
    Write-Host $output -ForegroundColor Red
    Write-Host ""
    Write-Host "可能的原因：" -ForegroundColor Yellow
    Write-Host "1. Cookie 文件格式不正确" -ForegroundColor White
    Write-Host "2. Cookie 已过期，需要重新导出" -ForegroundColor White
    Write-Host "3. YouTube 账号未登录" -ForegroundColor White
    Write-Host ""
    Write-Host "解决方法：" -ForegroundColor Yellow
    Write-Host "1. 确保在浏览器中已登录 YouTube" -ForegroundColor White
    Write-Host "2. 重新使用浏览器扩展导出 Cookie" -ForegroundColor White
    Write-Host "3. 确保导出的是 Netscape 格式的 Cookie 文件" -ForegroundColor White
}

Write-Host ""
Write-Host "详细说明请查看: YOUTUBE_DOWNLOAD_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
pause
