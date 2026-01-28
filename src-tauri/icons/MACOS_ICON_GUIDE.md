# macOS 图标生成指南

## 当前状态

✅ Windows 图标：`icon.ico` (已完成)
✅ Linux 图标：`32x32.png`, `128x128.png`, `128x128@2x.png`, `icon.png` (已完成)
⚠️ macOS 图标：`icon.icns` (需要生成)

## 为什么需要 .icns 文件？

macOS 应用程序使用 `.icns` 格式的图标文件，这是一个包含多个尺寸图标的容器格式。

## 生成 icon.icns 的方法

### 方法 1：使用在线工具（推荐，最简单）

1. 访问：https://cloudconvert.com/png-to-icns
2. 上传 `icon.png` (512x512)
3. 点击 "Convert"
4. 下载生成的 `icon.icns`
5. 将文件放到 `src-tauri/icons/` 目录

### 方法 2：使用 iconutil（需要 macOS 系统）

如果你有 macOS 系统，可以使用命令行工具：

```bash
# 1. 创建 iconset 目录
mkdir icon.iconset

# 2. 生成所需尺寸（使用 sips 命令）
sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png

# 3. 生成 .icns 文件
iconutil -c icns icon.iconset

# 4. 清理
rm -rf icon.iconset
```

### 方法 3：使用 ImageMagick（跨平台）

如果安装了 ImageMagick：

```bash
# Windows (使用 Chocolatey 安装)
choco install imagemagick

# 然后运行
magick convert icon.png -define icon:auto-resize=16,32,48,64,128,256,512,1024 icon.icns
```

## 临时解决方案

如果暂时无法生成 .icns 文件，Tauri 可以使用 PNG 图标作为后备方案。当前配置已经包含了 PNG 图标，可以先进行构建测试。

但是为了获得最佳的 macOS 用户体验，建议尽快添加 .icns 文件。

## 更新配置

生成 `icon.icns` 后，需要更新 `tauri.conf.json`：

```json
"icon": [
  "icons/32x32.png",
  "icons/128x128.png",
  "icons/128x128@2x.png",
  "icons/icon.png",
  "icons/icon.ico",
  "icons/icon.icns"  // 添加这一行
]
```

## 验证

生成后可以在 macOS 上验证：

```bash
# 查看 .icns 文件信息
iconutil -c iconset icon.icns -o test.iconset
ls -la test.iconset/
```
