# 自动下载 yt-dlp 脚本
# 用于首次安装或更新 yt-dlp

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "yt-dlp 自动下载工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# yt-dlp 下载地址
$ytdlpUrl = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
$ytdlpPath = ".\yt-dlp.exe"

# 检查是否已存在
if (Test-Path $ytdlpPath) {
    Write-Host "检测到已存在 yt-dlp.exe" -ForegroundColor Yellow
    Write-Host ""
    
    # 获取当前版本
    $currentVersion = & $ytdlpPath --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "当前版本: $currentVersion" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "是否要下载最新版本？" -ForegroundColor Cyan
    Write-Host "1. 是，下载最新版本" -ForegroundColor White
    Write-Host "2. 否，保留当前版本" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "请输入数字 (1-2)"
    
    if ($choice -ne "1") {
        Write-Host ""
        Write-Host "已取消下载" -ForegroundColor Gray
        pause
        exit 0
    }
    
    # 备份旧版本
    $backupPath = ".\yt-dlp-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').exe"
    Write-Host ""
    Write-Host "正在备份当前版本到: $backupPath" -ForegroundColor Yellow
    Copy-Item $ytdlpPath $backupPath
}

Write-Host ""
Write-Host "正在下载 yt-dlp 最新版本..." -ForegroundColor Cyan
Write-Host "下载地址: $ytdlpUrl" -ForegroundColor Gray
Write-Host ""

try {
    # 下载文件
    Invoke-WebRequest -Uri $ytdlpUrl -OutFile $ytdlpPath -UseBasicParsing
    
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ 下载成功！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    # 验证下载
    if (Test-Path $ytdlpPath) {
        $fileSize = (Get-Item $ytdlpPath).Length / 1MB
        Write-Host "文件大小: $([math]::Round($fileSize, 2)) MB" -ForegroundColor White
        
        # 获取版本
        Write-Host "正在验证..." -ForegroundColor Cyan
        $version = & $ytdlpPath --version 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "版本: $version" -ForegroundColor White
            Write-Host ""
            Write-Host "yt-dlp 已准备就绪！" -ForegroundColor Green
        } else {
            Write-Host "警告: 无法验证版本，但文件已下载" -ForegroundColor Yellow
        }
    }
    
} catch {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "✗ 下载失败" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "错误信息: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "可能的原因：" -ForegroundColor Yellow
    Write-Host "1. 网络连接问题" -ForegroundColor White
    Write-Host "2. GitHub 访问受限" -ForegroundColor White
    Write-Host "3. 防火墙或代理设置" -ForegroundColor White
    Write-Host ""
    Write-Host "解决方法：" -ForegroundColor Cyan
    Write-Host "1. 检查网络连接" -ForegroundColor White
    Write-Host "2. 使用 VPN 或代理" -ForegroundColor White
    Write-Host "3. 手动下载：" -ForegroundColor White
    Write-Host "   访问: https://github.com/yt-dlp/yt-dlp/releases/latest" -ForegroundColor Gray
    Write-Host "   下载: yt-dlp.exe" -ForegroundColor Gray
    Write-Host "   放到当前目录: $PWD" -ForegroundColor Gray
}

Write-Host ""
pause
