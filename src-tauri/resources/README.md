# 应用资源文件

本目录包含应用程序运行时需要的外部资源文件。

## 当前资源

### yt-dlp 可执行文件

- **Windows**: `yt-dlp.exe` ✅ (已包含)
- **macOS**: `yt-dlp-macos` ⚠️ (需要添加)
- **Linux**: `yt-dlp-linux` ⚠️ (需要添加)

## 跨平台资源配置

### 获取 yt-dlp 二进制文件

从 GitHub releases 下载对应平台的 yt-dlp：
https://github.com/yt-dlp/yt-dlp/releases/latest

#### Windows
- 文件名：`yt-dlp.exe`
- 已包含 ✅

#### macOS
- 文件名：`yt-dlp` (重命名为 `yt-dlp-macos`)
- 下载后需要添加执行权限：`chmod +x yt-dlp-macos`

#### Linux
- 文件名：`yt-dlp` (重命名为 `yt-dlp-linux`)
- 下载后需要添加执行权限：`chmod +x yt-dlp-linux`

## 资源打包配置

在 `tauri.conf.json` 中已配置：

```json
"resources": ["resources/*"]
```

这会将 resources 目录下的所有文件打包到应用程序中。

## 运行时访问

在 Rust 代码中，使用 Tauri 的资源 API 访问这些文件：

```rust
use tauri::api::path::resource_dir;

// 获取资源目录
let resource_dir = resource_dir(&app.package_info(), &app.env())
    .expect("failed to get resource dir");

// 构建 yt-dlp 路径
let ytdlp_path = if cfg!(target_os = "windows") {
    resource_dir.join("yt-dlp.exe")
} else if cfg!(target_os = "macos") {
    resource_dir.join("yt-dlp-macos")
} else {
    resource_dir.join("yt-dlp-linux")
};
```

## 文件大小

- `yt-dlp.exe`: ~18 MB
- `yt-dlp-macos`: ~20 MB (预估)
- `yt-dlp-linux`: ~20 MB (预估)

总计约 58 MB 的额外资源文件。

## 注意事项

1. **权限问题**：macOS 和 Linux 版本需要确保可执行权限
2. **代码签名**：macOS 发布时可能需要对二进制文件进行签名
3. **更新机制**：应用内的更新功能会下载新版本到应用数据目录
4. **安全扫描**：某些杀毒软件可能会标记 yt-dlp 为可疑文件

## 构建时的平台特定配置

可以在 `tauri.conf.json` 中为不同平台配置不同的资源：

```json
"bundle": {
  "resources": {
    "windows": ["resources/yt-dlp.exe"],
    "macos": ["resources/yt-dlp-macos"],
    "linux": ["resources/yt-dlp-linux"]
  }
}
```

但当前使用通配符 `resources/*` 会包含所有文件，这样可以简化配置。
