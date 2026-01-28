# GitHub Actions 工作流说明

本项目包含两个 GitHub Actions 工作流，用于自动化构建和测试。

## 📋 工作流列表

### 1. Build and Release (`build-release.yml`)

**触发条件：**
- 推送版本标签（如 `v1.0.0`）
- 手动触发

**功能：**
- 自动构建所有平台的应用程序
- 创建绿色版便携包
- 自动创建 GitHub Release
- 上传所有构建产物

**支持的平台：**
- ✅ Windows (x86_64)
  - MSI 安装包
  - NSIS 安装包
  - 绿色版便携包 (ZIP)
  
- ✅ macOS (Intel)
  - DMG 安装包
  - 绿色版便携包 (ZIP)
  
- ✅ macOS (Apple Silicon)
  - DMG 安装包
  - 绿色版便携包 (ZIP)
  
- ✅ Linux (x86_64)
  - DEB 安装包
  - AppImage
  - 绿色版便携包 (tar.gz)

### 2. Build Test (`build-test.yml`)

**触发条件：**
- 推送到 main/master/develop 分支
- Pull Request 到 main/master/develop 分支

**功能：**
- 运行前端测试
- 运行前端 Linter
- 运行 Rust 测试
- 运行 Rust Clippy
- 检查 Rust 代码格式

**测试平台：**
- Ubuntu Latest
- Windows Latest
- macOS Latest

## 🚀 使用方法

### 方法 1：创建 Release（推荐）

1. **更新版本号**
   
   编辑 `src-tauri/Cargo.toml`：
   ```toml
   [package]
   version = "1.0.0"  # 更新版本号
   ```
   
   编辑 `src-tauri/tauri.conf.json`：
   ```json
   {
     "package": {
       "version": "1.0.0"  // 更新版本号
     }
   }
   ```

2. **提交更改**
   ```bash
   git add .
   git commit -m "chore: bump version to 1.0.0"
   git push
   ```

3. **创建并推送标签**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

4. **等待构建完成**
   - 访问 GitHub Actions 页面查看构建进度
   - 构建完成后，会自动创建 Release
   - 所有平台的安装包和便携包会自动上传

### 方法 2：手动触发

1. 访问 GitHub 仓库的 Actions 页面
2. 选择 "Build and Release" 工作流
3. 点击 "Run workflow" 按钮
4. 选择分支并运行

## 📦 构建产物说明

### Windows

| 文件名 | 类型 | 说明 |
|--------|------|------|
| `video-downloader-windows-x86_64.msi` | 安装包 | Windows Installer 安装包 |
| `video-downloader-windows-x86_64-setup.exe` | 安装包 | NSIS 安装程序 |
| `video-downloader-windows-x86_64-portable.zip` | 便携包 | 绿色版，解压即用 |

**便携包内容：**
- `video-downloader.exe` - 主程序
- `yt-dlp.exe` - 下载引擎
- `使用说明.txt` - 使用说明
- `故障排除.txt` - 故障排除指南
- `测试链接.txt` - 测试视频链接

### macOS

| 文件名 | 类型 | 说明 |
|--------|------|------|
| `video-downloader-macos-x86_64.dmg` | 安装包 | Intel Mac 安装包 |
| `video-downloader-macos-aarch64.dmg` | 安装包 | Apple Silicon 安装包 |
| `video-downloader-macos-*.zip` | 便携包 | 绿色版 |

### Linux

| 文件名 | 类型 | 说明 |
|--------|------|------|
| `video-downloader-linux-x86_64.deb` | 安装包 | Debian/Ubuntu 安装包 |
| `video-downloader-linux-x86_64.AppImage` | 便携包 | AppImage 格式 |
| `video-downloader-linux-x86_64-portable.tar.gz` | 便携包 | 压缩包格式 |

## 🔧 工作流配置

### 环境变量

工作流会自动下载最新版本的 yt-dlp，无需手动配置。

### 缓存

工作流使用缓存来加速构建：
- pnpm store 缓存
- Rust 编译缓存（通过 Cargo）

### 构建时间

预计构建时间（所有平台）：
- 首次构建：约 30-40 分钟
- 后续构建（有缓存）：约 15-20 分钟

## 🐛 故障排除

### 构建失败

1. **检查版本号**
   - 确保 `Cargo.toml` 和 `tauri.conf.json` 中的版本号一致

2. **检查依赖**
   - 确保 `pnpm-lock.yaml` 已提交
   - 确保 `Cargo.lock` 已提交

3. **查看日志**
   - 在 GitHub Actions 页面查看详细的构建日志
   - 检查具体是哪个步骤失败

### yt-dlp 下载失败

如果 yt-dlp 下载失败，可以：
1. 检查 GitHub API 限制
2. 使用镜像地址
3. 手动上传 yt-dlp 到仓库

### 平台特定问题

**Windows:**
- 确保 Visual Studio Build Tools 已安装（GitHub Actions 已预装）

**macOS:**
- 确保 Xcode Command Line Tools 已安装（GitHub Actions 已预装）

**Linux:**
- 确保所有依赖库已安装（工作流会自动安装）

## 📝 本地测试

在推送到 GitHub 之前，可以本地测试构建：

```bash
# 安装依赖
pnpm install

# 下载 yt-dlp
# Windows
Invoke-WebRequest -Uri "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" -OutFile "src-tauri/resources/yt-dlp.exe"

# macOS/Linux
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o src-tauri/resources/yt-dlp
chmod +x src-tauri/resources/yt-dlp

# 构建
pnpm tauri build
```

## 🔐 权限说明

工作流需要以下权限：
- `contents: write` - 创建 Release
- `GITHUB_TOKEN` - 自动提供，无需配置

## 📚 相关文档

- [Tauri 构建指南](https://tauri.app/v1/guides/building/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [pnpm 文档](https://pnpm.io/)

## 💡 最佳实践

1. **版本管理**
   - 使用语义化版本号（Semantic Versioning）
   - 主版本号.次版本号.修订号（如 1.0.0）

2. **发布流程**
   - 在 develop 分支开发
   - 合并到 master 分支
   - 创建标签触发发布

3. **测试**
   - 每次 PR 都会自动运行测试
   - 确保所有测试通过后再合并

4. **文档**
   - 每次发布都更新 CHANGELOG
   - 在 Release Notes 中说明变更内容

## 🎯 下一步

1. 添加自动化测试覆盖率报告
2. 添加代码签名（Windows 和 macOS）
3. 添加自动更新功能
4. 添加性能测试
