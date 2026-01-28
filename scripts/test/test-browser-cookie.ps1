# 测试浏览器 Cookie 方案
# 用于验证 --cookies-from-browser 参数是否可用

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "浏览器 Cookie 测试工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 测试视频
$testUrl = "https://www.youtube.com/watch?v=jNQXAC9IVRw"

# 检测浏览器进程
function Test-BrowserRunning {
    param([string]$BrowserName)
    
    $processName = switch ($BrowserName) {
        "chrome" { "chrome" }
        "edge" { "msedge" }
        "firefox" { "firefox" }
        default { "" }
    }
    
    if ($processName) {
        $process = Get-Process -Name $processName -ErrorAction SilentlyContinue
        return $null -ne $process
    }
    return $false
}

# 测试浏览器列表
$browsers = @("edge", "chrome", "firefox")

Write-Host "正在检测已安装的浏览器..." -ForegroundColor Cyan
Write-Host ""

foreach ($browser in $browsers) {
    $isRunning = Test-BrowserRunning -BrowserName $browser
    $status = if ($isRunning) { "运行中 ⚠️" } else { "已关闭 ✓" }
    $color = if ($isRunning) { "Yellow" } else { "Green" }
    
    Write-Host "$browser : $status" -ForegroundColor $color
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 选择浏览器
Write-Host "请选择要测试的浏览器：" -ForegroundColor Cyan
Write-Host "1. Edge (推荐)" -ForegroundColor White
Write-Host "2. Chrome" -ForegroundColor White
Write-Host "3. Firefox" -ForegroundColor White
Write-Host ""

$choice = Read-Host "请输入数字 (1-3)"

$selectedBrowser = switch ($choice) {
    "1" { "edge" }
    "2" { "chrome" }
    "3" { "firefox" }
    default { "edge" }
}

Write-Host ""
Write-Host "已选择: $selectedBrowser" -ForegroundColor Green
Write-Host ""

# 检查浏览器是否正在运行
if (Test-BrowserRunning -BrowserName $selectedBrowser) {
    Write-Host "⚠️  警告: $selectedBrowser 浏览器正在运行！" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "这会导致 Cookie 数据库被锁定，无法读取。" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "请选择：" -ForegroundColor Cyan
    Write-Host "1. 关闭浏览器后继续" -ForegroundColor White
    Write-Host "2. 强制尝试（可能失败）" -ForegroundColor White
    Write-Host "3. 取消测试" -ForegroundColor White
    Write-Host ""
    
    $action = Read-Host "请输入数字 (1-3)"
    
    if ($action -eq "1") {
        Write-Host ""
        Write-Host "请关闭 $selectedBrowser 浏览器，然后按任意键继续..." -ForegroundColor Yellow
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        Write-Host ""
    } elseif ($action -eq "3") {
        Write-Host ""
        Write-Host "测试已取消" -ForegroundColor Gray
        pause
        exit 0
    }
}

Write-Host "正在测试 $selectedBrowser Cookie..." -ForegroundColor Cyan
Write-Host ""
Write-Host "执行命令:" -ForegroundColor Gray
Write-Host "  yt-dlp.exe --cookies-from-browser $selectedBrowser --skip-download --print `"%(title)s`" $testUrl" -ForegroundColor Gray
Write-Host ""

# 执行测试
$output = & .\yt-dlp.exe --cookies-from-browser $selectedBrowser --skip-download --print "%(title)s" $testUrl 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ 测试成功！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "视频标题: $output" -ForegroundColor White
    Write-Host ""
    Write-Host "你可以使用 $selectedBrowser 的 Cookie 下载 YouTube 视频了！" -ForegroundColor Green
    Write-Host ""
    Write-Host "使用方法：" -ForegroundColor Cyan
    Write-Host "1. 在应用设置中选择 '$selectedBrowser' 作为 Cookie 来源" -ForegroundColor White
    Write-Host "2. 下载 YouTube 视频前，先关闭 $selectedBrowser 浏览器" -ForegroundColor White
    Write-Host "3. 开始下载" -ForegroundColor White
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "✗ 测试失败" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "错误信息:" -ForegroundColor Yellow
    Write-Host $output -ForegroundColor Red
    Write-Host ""
    
    # 分析错误原因
    if ($output -match "Could not copy.*cookie database") {
        Write-Host "原因: 浏览器正在运行，Cookie 数据库被锁定" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "解决方法：" -ForegroundColor Cyan
        Write-Host "1. 完全关闭 $selectedBrowser 浏览器（包括后台进程）" -ForegroundColor White
        Write-Host "2. 重新运行此测试脚本" -ForegroundColor White
        Write-Host ""
        Write-Host "如何完全关闭浏览器：" -ForegroundColor Cyan
        Write-Host "- 方法 1: 右键任务栏图标 -> 退出" -ForegroundColor White
        Write-Host "- 方法 2: 任务管理器 -> 结束所有浏览器进程" -ForegroundColor White
    } elseif ($output -match "could not find.*cookies database") {
        Write-Host "原因: 未找到 $selectedBrowser 的 Cookie 数据库" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "可能的原因：" -ForegroundColor Cyan
        Write-Host "1. $selectedBrowser 未安装" -ForegroundColor White
        Write-Host "2. 从未在 $selectedBrowser 中登录过 YouTube" -ForegroundColor White
        Write-Host ""
        Write-Host "解决方法：" -ForegroundColor Cyan
        Write-Host "1. 安装 $selectedBrowser 浏览器" -ForegroundColor White
        Write-Host "2. 在浏览器中登录 YouTube" -ForegroundColor White
        Write-Host "3. 重新运行此测试" -ForegroundColor White
    } elseif ($output -match "Sign in to confirm") {
        Write-Host "原因: Cookie 无效或未登录" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "解决方法：" -ForegroundColor Cyan
        Write-Host "1. 在 $selectedBrowser 中登录 YouTube" -ForegroundColor White
        Write-Host "2. 访问几个 YouTube 视频确保登录成功" -ForegroundColor White
        Write-Host "3. 关闭浏览器" -ForegroundColor White
        Write-Host "4. 重新运行此测试" -ForegroundColor White
    } else {
        Write-Host "未知错误，请查看上面的错误信息" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "详细说明请查看: YOUTUBE_BROWSER_COOKIE_IMPLEMENTATION.md" -ForegroundColor Cyan
Write-Host ""
pause
