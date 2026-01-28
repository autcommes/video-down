# YouTube 视频下载完整指南

## 问题说明

YouTube 从 2024 年开始加强了反爬虫机制，直接下载会提示"Sign in to confirm you're not a bot"。需要使用登录后的 Cookie 才能下载。

## 解决方案

### 方法 1：使用浏览器扩展导出 Cookie（推荐）

这是最简单可靠的方法。

#### 步骤 1：安装浏览器扩展

**Chrome/Edge 用户：**
1. 打开 Chrome 网上应用店
2. 搜索 "Get cookies.txt LOCALLY"
3. 安装扩展：https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc

**Firefox 用户：**
1. 打开 Firefox 附加组件商店
2. 搜索 "cookies.txt"
3. 安装扩展：https://addons.mozilla.org/zh-CN/firefox/addon/cookies-txt/

#### 步骤 2：登录 YouTube

1. 在浏览器中打开 https://www.youtube.com
2. 登录你的 Google 账号
3. 确保可以正常观看视频

#### 步骤 3：导出 Cookie

1. 在 YouTube 页面上，点击浏览器工具栏中的扩展图标
2. 点击 "Get cookies.txt LOCALLY" 或 "cookies.txt"
3. 会自动下载一个 `youtube.com_cookies.txt` 文件
4. 将这个文件重命名为 `cookies.txt`
5. 放到你的下载工具目录（例如：`E:\AI\youtob-down\cookies.txt`）

#### 步骤 4：使用 Cookie 下载

```powershell
# 测试是否可以获取视频信息
.\yt-dlp.exe --cookies cookies.txt --skip-download --print "%(title)s" "视频URL"

# 下载视频
.\yt-dlp.exe --cookies cookies.txt "视频URL"
```

### 方法 2：使用浏览器开发者工具手动导出（高级）

如果不想安装扩展，可以手动导出 Cookie。

#### 步骤 1：获取 Cookie 字符串

1. 在浏览器中打开 https://www.youtube.com 并登录
2. 按 F12 打开开发者工具
3. 切换到 "Console"（控制台）标签
4. 粘贴以下代码并回车：

```javascript
copy(document.cookie)
```

5. Cookie 已复制到剪贴板

#### 步骤 2：创建 Cookie 文件

1. 创建一个文本文件 `cookies.txt`
2. 使用 Netscape Cookie 格式（需要转换工具）
3. 或者使用 `--add-header "Cookie: 你的cookie字符串"` 参数

### 方法 3：使用代理或 VPN（不推荐）

某些地区的 IP 可能被 YouTube 限制较少，但这不是长期解决方案。

```powershell
.\yt-dlp.exe --proxy socks5://127.0.0.1:1080 "视频URL"
```

## 在你的下载工具中使用

### 修改后端代码

需要在 `src-tauri/src/services/ytdlp_service.rs` 中添加 Cookie 支持：

```rust
// 添加 Cookie 文件路径参数
if let Ok(cookie_path) = std::env::current_exe()
    .and_then(|exe| Ok(exe.parent().unwrap().join("cookies.txt")))
{
    if cookie_path.exists() {
        command.arg("--cookies").arg(cookie_path);
    }
}
```

### 用户操作流程

1. 用户使用浏览器扩展导出 `cookies.txt`
2. 将 `cookies.txt` 放到程序目录（和 `视频下载工具.exe` 同一目录）
3. 程序自动检测并使用 Cookie 文件
4. 可以正常下载 YouTube 视频

## Cookie 有效期

- Cookie 通常有效期为几周到几个月
- 如果下载失败，提示需要登录，说明 Cookie 过期了
- 重新导出新的 Cookie 文件即可

## 安全提示

⚠️ **重要：Cookie 文件包含你的登录信息，请妥善保管！**

- 不要分享给他人
- 不要上传到公共网站
- 定期更新 Cookie
- 使用完毕后可以删除

## 测试命令

### 测试 Cookie 是否有效

```powershell
# 获取视频标题（不下载）
.\yt-dlp.exe --cookies cookies.txt --skip-download --print "%(title)s" "https://www.youtube.com/watch?v=jNQXAC9IVRw"
```

### 列出可用格式

```powershell
.\yt-dlp.exe --cookies cookies.txt -F "https://www.youtube.com/watch?v=jNQXAC9IVRw"
```

### 下载最高质量视频

```powershell
.\yt-dlp.exe --cookies cookies.txt -f "bestvideo+bestaudio" --merge-output-format mp4 "https://www.youtube.com/watch?v=jNQXAC9IVRw"
```

## 常见问题

### Q: 提示 "Sign in to confirm you're not a bot"
A: Cookie 无效或过期，需要重新导出

### Q: 提示 "Video unavailable"
A: 视频可能有地区限制，尝试使用 VPN

### Q: 下载速度很慢
A: YouTube 可能限速，可以尝试：
- 使用代理
- 更换网络
- 分时段下载

### Q: Cookie 文件格式错误
A: 确保使用 Netscape Cookie 格式，使用浏览器扩展导出最可靠

## 替代方案

如果 YouTube 下载太麻烦，可以考虑：

1. **专注于 Bilibili**：国内平台，下载更稳定
2. **使用在线服务**：如 y2mate.com（但有广告和限制）
3. **使用专业工具**：如 4K Video Downloader（付费）

## 总结

YouTube 下载的核心是：**需要有效的登录 Cookie**

最简单的流程：
1. 安装浏览器扩展 "Get cookies.txt LOCALLY"
2. 在 YouTube 登录
3. 导出 cookies.txt
4. 放到程序目录
5. 开始下载

Cookie 有效期内可以一直使用，过期后重新导出即可。
