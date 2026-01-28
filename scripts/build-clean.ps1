# 清除 Kiro IDE 的环境变量干扰并构建
# 这些环境变量会导致 Tauri 构建失败

Write-Host "清除 Kiro IDE 环境变量..." -ForegroundColor Yellow

# 清除 TARGET 相关环境变量
$env:TARGET = $null
$env:TARGET_DIR = $null

Write-Host "环境变量已清除" -ForegroundColor Green
Write-Host ""
Write-Host "开始构建..." -ForegroundColor Cyan

# 构建应用
pnpm tauri build $args
