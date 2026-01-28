# 设置 Git Hooks
Write-Host "🔧 设置 Git Hooks..." -ForegroundColor Cyan

$gitHooksDir = ".git/hooks"
$preCommitHook = "$gitHooksDir/pre-commit"

# 创建 pre-commit hook
$hookContent = @'
#!/bin/sh

echo "🧪 运行前端测试..."
pnpm test
if [ $? -ne 0 ]; then
    echo "❌ 前端测试失败，提交已取消"
    exit 1
fi

echo "🧪 运行前端 lint..."
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
'@

# 写入 hook 文件
Set-Content -Path $preCommitHook -Value $hookContent -Encoding UTF8

# 在 Windows 上，Git Bash 会自动处理执行权限
Write-Host "✅ Git Hooks 设置完成！" -ForegroundColor Green
Write-Host ""
Write-Host "现在每次提交前都会自动运行测试。" -ForegroundColor Yellow
Write-Host "如果需要跳过测试提交，使用: git commit --no-verify" -ForegroundColor Yellow
