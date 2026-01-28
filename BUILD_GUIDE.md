# 跨平台构建指南

本文档说明如何为不同平台构建视频下载工具。

## 前置要求

### 所有平台

- Node.js 16+ 和 pnpm
- Rust 1.70+
- Tauri CLI

安装 Tauri CLI：
```bash
cargo install tauri-cli
```

### Windows

- Visual Studio 2019+ 或 Build Tools for Visual Studio
- WebView2 (Windows 10/11 已内置)

### macOS

- Xcode Command Line Tools
```bash
xcode-select --install
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
```

## 构建步骤

### 1. 安装依赖

```bash
pnpm install
```

### 2. 开发模式

```bash
pnpm tauri dev
```

### 3. 生产构建

#### Windows

构建 MSI 和 NSIS 安装程序：

```bash
pnpm tauri build
```

输出文件位置：
- `src-tauri/target/release/bundle/msi/视频下载工具_0.1.0_x64_zh-CN.msi`
- `src-tauri/target/release/bundle/nsis/视频下载工具_0.1.0_x64-setup.exe`

#### macOS

构建 DMG 镜像：

```bash
pnpm tauri build
```

输出文件位置：
- `src-tauri/target/release/bundle/dmg/视频下载工具_0.1.0_x64.dmg`

**注意**：
- 需要 `icon.icns` 文件（参见 `src-tauri/icons/MACOS_ICON_GUIDE.md`）
- 发布到 App Store 需要开发者证书和代码签名

#### Linux

构建 DEB 和 AppImage：

```bash
pnpm tauri build
```

输出文件位置：
- `src-tauri/target/release/bundle/deb/video-downloader_0.1.0_amd64.deb`
- `src-tauri/target/release/bundle/appimage/video-downloader_0.1.0_amd64.AppImage`

### 4. 指定构建目标

只构建特定格式：

```bash
# 只构建 MSI
pnpm tauri build --bundles msi

# 只构建 DMG
pnpm tauri build --bundles dmg

# 只构建 DEB
pnpm tauri build --bundles deb

# 只构建 AppImage
pnpm tauri build --bundles appimage
```

## 跨平台构建

### 在 Windows 上构建 Linux 版本

需要使用 Docker 或 WSL2：

```bash
# 使用 WSL2
wsl
cd /mnt/e/AI/youtob-down
pnpm tauri build
```

### 在 macOS 上构建 Windows 版本

不支持直接交叉编译，需要使用虚拟机或 CI/CD。

### 使用 GitHub Actions

推荐使用 GitHub Actions 进行多平台构建：

```yaml
name: Release
on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    strategy:
      matrix:
        platform: [macos-latest, ubuntu-20.04, windows-latest]
    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      - uses: dtolnay/rust-toolchain@stable
      - run: pnpm install
      - run: pnpm tauri build
      - uses: softprops/action-gh-release@v1
        with:
          files: src-tauri/target/release/bundle/**/*
```

## 构建配置

### tauri.conf.json 关键配置

```json
{
  "bundle": {
    "active": true,
    "targets": ["msi", "nsis", "deb", "appimage", "dmg"],
    "identifier": "com.youtube.downloader",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.png",
      "icons/icon.ico"
    ],
    "resources": ["resources/*"]
  }
}
```

### 构建优化

#### 减小文件大小

在 `Cargo.toml` 中添加：

```toml
[profile.release]
opt-level = "z"     # 优化文件大小
lto = true          # 链接时优化
codegen-units = 1   # 更好的优化
strip = true        # 移除调试符号
```

#### 加快构建速度

开发时使用：

```bash
pnpm tauri build --debug
```

## 发布清单

### Windows

- [ ] 测试 MSI 安装程序
- [ ] 测试 NSIS 安装程序
- [ ] 验证 yt-dlp.exe 正确打包
- [ ] 测试应用图标显示
- [ ] 测试卸载功能

### macOS

- [ ] 生成 icon.icns 文件
- [ ] 测试 DMG 镜像
- [ ] 验证 yt-dlp-macos 正确打包
- [ ] 测试应用图标显示
- [ ] （可选）代码签名和公证

### Linux

- [ ] 测试 DEB 包安装
- [ ] 测试 AppImage 运行
- [ ] 验证 yt-dlp-linux 正确打包
- [ ] 测试应用图标显示
- [ ] 测试桌面快捷方式

## 常见问题

### 1. 构建失败：找不到 WebView2

**Windows**: 安装 WebView2 Runtime
https://developer.microsoft.com/en-us/microsoft-edge/webview2/

### 2. 构建失败：Rust 编译错误

更新 Rust 工具链：
```bash
rustup update stable
```

### 3. 图标不显示

确保所有图标文件都在 `src-tauri/icons/` 目录中，并且在 `tauri.conf.json` 中正确配置。

### 4. yt-dlp 无法执行

- Windows: 确保 `yt-dlp.exe` 在 resources 目录
- macOS/Linux: 确保二进制文件有执行权限

### 5. 构建体积过大

- 启用 release 优化（参见上面的 Cargo.toml 配置）
- 使用 `strip` 移除调试符号
- 考虑使用 UPX 压缩（可能影响启动速度）

## 测试

构建后务必测试：

1. **安装测试**：在干净的系统上安装
2. **功能测试**：测试所有核心功能
3. **更新测试**：测试 yt-dlp 更新功能
4. **卸载测试**：确保完全卸载

## 发布

### GitHub Releases

1. 创建 Git tag：`git tag v0.1.0`
2. 推送 tag：`git push origin v0.1.0`
3. 在 GitHub 上创建 Release
4. 上传构建产物

### 自动化发布

使用 GitHub Actions 自动构建和发布（参见上面的 workflow 示例）。

## 资源

- [Tauri 官方文档](https://tauri.app/)
- [Tauri 构建指南](https://tauri.app/v1/guides/building/)
- [跨平台构建](https://tauri.app/v1/guides/building/cross-platform)
