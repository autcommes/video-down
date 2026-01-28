# Git Hooks 设置脚本
# 用于设置 pre-commit hook，确保提交前运行测试

$ErrorActionPreference = "Stop"

Write-Host "🔧 设置 Git Hooks..." -ForegroundColor Cyan

# 确保 .git/hooks 目录存在
$hooksDir = ".git/hooks"
if (-not (Test-Path $hooksDir)) {
    New-Item -ItemType Directory -Path $hooksDir -Force | Out-Null
}

# 创建 PowerShell 版本的 pre-commit hook
$preCommitPsPath = Join-Path $hooksDir "pre-commit.ps1"
$preCommitPsContent = @'
#!/usr/bin/env pwsh

Write-Host "🔍 运行前端测试..." -ForegroundColor Cyan
pnpm test
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 前端测试失败，提交已取消" -ForegroundColor Red
    exit 1
}

Write-Host "🔍 运行前端 lint..." -ForegroundColor Cyan
pnpm lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 前端 lint 失败，提交已取消" -ForegroundColor Red
    exit 1
}

Write-Host "🦀 运行 Rust 测试..." -ForegroundColor Cyan
Set-Location src-tauri
cargo test
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Rust 测试失败，提交已取消" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "🦀 运行 Rust clippy..." -ForegroundColor Cyan
cargo clippy -- -D warnings
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Rust clippy 失败，提交已取消" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..
Write-Host "✅ 所有测试通过，允许提交" -ForegroundColor Green
exit 0
'@

Set-Content -Path $preCommitPsPath -Value $preCommitPsContent -Encoding UTF8

# 创建 shell 版本的 pre-commit hook（跨平台兼容）
$preCommitPath = Join-Path $hooksDir "pre-commit"
$preCommitContent = @'
#!/bin/sh

# 检测操作系统并调用相应的脚本
if command -v pwsh >/dev/null 2>&1; then
    # Windows 或安装了 PowerShell Core 的系统
    pwsh -NoProfile -ExecutionPolicy Bypass -File "$(dirname "$0")/pre-commit.ps1"
    exit $?
elif command -v powershell >/dev/null 2>&1; then
    # Windows PowerShell
    powershell -NoProfile -ExecutionPolicy Bypass -File "$(dirname "$0")/pre-commit.ps1"
    exit $?
else
    # Unix/Linux/Mac - 使用原来的 shell 脚本逻辑
    echo "🔍 运行前端测试..."
    pnpm test
    if [ $? -ne 0 ]; then
        echo "❌ 前端测试失败，提交已取消"
        exit 1
    fi

    echo "🔍 运行前端 lint..."
    pnpm lint
    if [ $? -ne 0 ]; then
        echo "❌ 前端 lint 失败，提交已取消"
        exit 1
    fi

    echo "🦀 运行 Rust 测试..."
    cd src-tauri
    cargo test
    if [ $? -ne 0 ]; then
        echo "❌ Rust 测试失败，提交已取消"
        exit 1
    fi

    echo "🦀 运行 Rust clippy..."
    cargo clippy -- -D warnings
    if [ $? -ne 0 ]; then
        echo "❌ Rust clippy 失败，提交已取消"
        exit 1
    fi

    echo "✅ 所有测试通过，允许提交"
    exit 0
fi
'@

Set-Content -Path $preCommitPath -Value $preCommitContent -Encoding UTF8

Write-Host "✅ Git Hooks 设置完成！" -ForegroundColor Green
Write-Host ""
Write-Host "现在每次提交前都会自动运行：" -ForegroundColor Yellow
Write-Host "  - 前端测试 (pnpm test)" -ForegroundColor Gray
Write-Host "  - 前端 lint (pnpm lint)" -ForegroundColor Gray
Write-Host "  - Rust 测试 (cargo test)" -ForegroundColor Gray
Write-Host "  - Rust clippy (cargo clippy)" -ForegroundColor Gray
Write-Host ""
Write-Host "如果需要跳过 hooks，可以使用：git commit --no-verify" -ForegroundColor Gray
