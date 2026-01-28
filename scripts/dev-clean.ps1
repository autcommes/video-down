# 清除 Kiro IDE 的环境变量干扰
# 这些环境变量会导致 Tauri 构建失败

Write-Host "清除 Kiro IDE 环境变量..." -ForegroundColor Yellow

# 清除 TARGET 相关环境变量
$env:TARGET = $null
$env:TARGET_DIR = $null

Write-Host "环境变量已清除" -ForegroundColor Green
Write-Host ""
Write-Host "启动开发服务器..." -ForegroundColor Cyan

# 运行开发服务器
pnpm tauri dev
