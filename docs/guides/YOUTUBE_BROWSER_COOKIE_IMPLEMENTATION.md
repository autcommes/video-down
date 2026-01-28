# YouTube 浏览器 Cookie 功能实现方案

## 功能说明

允许用户选择使用哪个浏览器的 Cookie 来下载 YouTube 视频，无需手动导出 Cookie 文件。

## 实现方案

### 方案 A：简单实现（推荐）

**优点：**
- 实现简单
- 用户体验好
- 自动处理

**缺点：**
- 需要关闭浏览器才能读取 Cookie

**实现步骤：**

1. **添加配置选项**
   - 在设置中添加"YouTube Cookie 浏览器"下拉选择
   - 选项：无、Chrome、Edge、Firefox、Brave、Opera

2. **检测 YouTube URL**
   - 在下载前检测是否为 YouTube 链接
   - 如果是，且配置了浏览器，添加 `--cookies-from-browser` 参数

3. **错误处理**
   - 如果浏览器正在运行，提示用户关闭浏览器
   - 提供友好的错误信息和解决方案

### 方案 B：高级实现（复杂）

**优点：**
- 无需关闭浏览器
- 用户体验最佳

**缺点：**
- 实现复杂
- 需要处理浏览器锁定问题

**实现方式：**
- 使用 Windows API 复制被锁定的数据库文件
- 需要额外的依赖和权限处理

## 推荐实现：方案 A

### 1. 前端：添加浏览器选择器

在设置页面或下载表单中添加：

```typescript
// src/components/DownloadForm/BrowserSelector.tsx
export const BrowserSelector = () => {
  const { config, updateConfig } = useConfigStore();
  
  return (
    <Select
      value={config.youtubeCookieBrowser}
      onValueChange={(value) => updateConfig({ youtubeCookieBrowser: value })}
    >
      <SelectTrigger>
        <SelectValue placeholder="选择浏览器" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">不使用（Bilibili 等）</SelectItem>
        <SelectItem value="chrome">Chrome</SelectItem>
        <SelectItem value="edge">Edge（推荐）</SelectItem>
        <SelectItem value="firefox">Firefox</SelectItem>
        <SelectItem value="brave">Brave</SelectItem>
        <SelectItem value="opera">Opera</SelectItem>
      </SelectContent>
    </Select>
  );
};
```

### 2. 后端：修改下载逻辑

```rust
// src-tauri/src/services/ytdlp_service.rs

impl YtdlpService {
    /// 下载视频（支持浏览器 Cookie）
    pub async fn download_video(
        &self,
        task_id: String,
        url: String,
        format_id: String,
        save_path: String,
        browser: Option<String>, // 新增参数
        progress_callback: impl Fn(ProgressData) + Send + 'static,
    ) -> Result<String, AppError> {
        let mut command = TokioCommand::new(&self.ytdlp_path);
        
        // 基本参数
        command
            .arg(&url)
            .arg("-f").arg(&format_id)
            .arg("-o").arg(&output_template)
            .arg("--newline")
            .arg("--no-part")
            .arg("--force-overwrites")
            .arg("--restrict-filenames")
            .arg("--trim-filenames").arg("200");
        
        // 如果是 YouTube 且配置了浏览器，添加 Cookie 参数
        if url.contains("youtube.com") || url.contains("youtu.be") {
            if let Some(browser_name) = browser {
                if browser_name != "none" {
                    eprintln!("[download_video] 使用浏览器 Cookie: {}", browser_name);
                    command.arg("--cookies-from-browser").arg(&browser_name);
                }
            }
        }
        
        // 执行下载...
    }
}
```

### 3. 错误处理和用户提示

当浏览器正在运行时，yt-dlp 会返回错误：
```
ERROR: Could not copy Chrome cookie database
```

我们需要捕获这个错误并给出友好提示：

```rust
// 检测 Cookie 数据库锁定错误
if error_msg.contains("Could not copy") && error_msg.contains("cookie database") {
    return Err(AppError::BrowserCookieLocked(
        "浏览器正在运行，无法读取 Cookie。\n\n解决方法：\n1. 关闭浏览器后重试\n2. 或使用其他浏览器的 Cookie\n3. 或手动导出 Cookie 文件".to_string()
    ));
}
```

### 4. 用户界面提示

在下载表单中添加提示信息：

```typescript
{config.youtubeCookieBrowser !== 'none' && (
  <Alert>
    <AlertDescription>
      <p className="font-semibold">使用浏览器 Cookie 下载 YouTube</p>
      <p className="text-sm mt-1">
        ⚠️ 下载前请先关闭 {config.youtubeCookieBrowser} 浏览器
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        这是因为浏览器运行时会锁定 Cookie 数据库
      </p>
    </AlertDescription>
  </Alert>
)}
```

## 用户使用流程

### 首次配置

1. 打开应用设置
2. 找到"YouTube 下载设置"
3. 选择"使用浏览器 Cookie"：Edge（或 Chrome）
4. 保存设置

### 下载 YouTube 视频

1. 在浏览器中登录 YouTube（正常使用）
2. 复制视频链接
3. **关闭浏览器**（重要！）
4. 在下载工具中粘贴链接
5. 点击"获取视频信息"
6. 选择分辨率
7. 开始下载

### 下载其他网站（Bilibili 等）

1. 将"使用浏览器 Cookie"设置为"无"
2. 或者保持设置不变（程序会自动判断）
3. 直接下载，无需关闭浏览器

## 优化建议

### 自动检测浏览器状态

可以添加一个检测功能，在下载前检查浏览器是否正在运行：

```rust
// Windows 平台检测进程
fn is_browser_running(browser: &str) -> bool {
    let process_name = match browser {
        "chrome" => "chrome.exe",
        "edge" => "msedge.exe",
        "firefox" => "firefox.exe",
        _ => return false,
    };
    
    // 使用 tasklist 命令检测
    let output = Command::new("tasklist")
        .arg("/FI")
        .arg(format!("IMAGENAME eq {}", process_name))
        .output();
    
    if let Ok(out) = output {
        let stdout = String::from_utf8_lossy(&out.stdout);
        stdout.contains(process_name)
    } else {
        false
    }
}
```

然后在下载前提示：

```rust
if is_browser_running(&browser_name) {
    return Err(AppError::BrowserRunning(format!(
        "{} 浏览器正在运行，请先关闭浏览器再下载 YouTube 视频",
        browser_name
    )));
}
```

### 智能默认值

- Windows 11：默认使用 Edge
- 其他系统：默认使用 Chrome
- 自动检测已安装的浏览器

## 测试计划

### 测试用例

1. **Bilibili 下载（无 Cookie）**
   - 设置：无
   - 预期：正常下载

2. **YouTube 下载（Edge Cookie，浏览器已关闭）**
   - 设置：Edge
   - 预期：正常下载

3. **YouTube 下载（Edge Cookie，浏览器运行中）**
   - 设置：Edge
   - 预期：显示错误提示，要求关闭浏览器

4. **YouTube 下载（无 Cookie）**
   - 设置：无
   - 预期：显示"需要登录"错误

5. **切换浏览器**
   - 从 Chrome 切换到 Edge
   - 预期：使用新的浏览器 Cookie

## 文档更新

需要更新以下文档：

1. **使用说明.txt**
   - 添加浏览器 Cookie 配置说明
   - 强调需要关闭浏览器

2. **YouTube下载说明.txt**
   - 更新为浏览器 Cookie 方案
   - 移除手动导出 Cookie 的复杂步骤

3. **故障排除.txt**
   - 添加"浏览器正在运行"错误的解决方法

## 总结

这个方案比手动导出 Cookie 文件简单很多：

**手动导出方案：**
1. 安装浏览器扩展
2. 登录 YouTube
3. 导出 Cookie 文件
4. 重命名文件
5. 放到指定目录

**浏览器 Cookie 方案：**
1. 在设置中选择浏览器（一次性）
2. 下载前关闭浏览器
3. 开始下载

用户体验提升明显！
