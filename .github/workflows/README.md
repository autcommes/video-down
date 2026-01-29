# GitHub Actions 工作流说明

本项目采用简洁的 CI/CD 流程设计，遵循最佳实践。

## 工作流架构

```
开发流程：
本地开发 → Git Hooks (测试) → Push → Build (构建验证) → 通过
                                                    ↓
发布流程：                                          
pnpm release → 创建 Tag → Release (完整构建+发布) → GitHub Release
```

## 工作流列表

### 1. build.yml - 构建验证

**触发条件：**
- Push 到 master/main 分支
- 排除 tag 推送
- 排除 release 提交（通过提交消息判断）

**职责：**
- 验证代码在 CI 环境能成功构建
- 不运行测试（本地 Git hooks 已覆盖）
- 上传临时 artifacts（保留 7 天）

**目的：**
- 快速反馈构建问题
- 提供临时下载链接

**运行时间：** ~30-40 分钟

---

### 2. release.yml - 正式发布

**触发条件：**
- Push tag (v*)
- 手动触发

**职责：**
- 完整构建 Tauri 应用
- 打包 MSI 安装包
- 打包 NSIS 安装包
- 打包绿色免安装版（zip）
- 创建 GitHub Release
- 上传所有安装包到 Release

**目的：**
- 正式版本发布
- 提供永久下载链接

**运行时间：** ~30-40 分钟

## 设计原则

### 1. 职责单一
每个工作流只做一件事，避免职责重叠。

### 2. 避免重复
- Build 工作流：只在开发时运行
- Release 工作流：只在发布时运行
- 不会同时触发多个构建

### 3. 本地优先
- 本地 Git hooks 运行所有测试
- CI 只验证构建，不重复测试
- 节省 CI 资源和时间

### 4. 清晰的触发条件
- 使用 `tags-ignore` 排除 tag
- 使用提交消息判断排除 release 提交
- 避免复杂的条件判断

## 发布流程

### 开发者操作

```bash
# 1. 本地开发和测试（Git hooks 自动运行测试）
git add .
git commit -m "feat: 新功能"

# 2. 推送到 GitHub
git push

# 3. 触发 Build 工作流（自动）
# - 验证构建成功
# - 可以从 Actions 下载临时 artifacts

# 4. 准备发布
pnpm release:patch  # 或 minor/major

# 5. 触发 Release 工作流（自动）
# - 完整构建
# - 创建 GitHub Release
# - 上传所有安装包
```

### 用户下载

用户可以从以下位置下载：

1. **GitHub Releases**（推荐）
   - 访问：https://github.com/autcommes/video-down/releases
   - 下载：MSI、NSIS、绿色版 zip
   - 永久保存

2. **Actions Artifacts**（临时）
   - 访问：https://github.com/autcommes/video-down/actions
   - 下载：临时构建产物
   - 保留 7 天

## 工作流优化

### 缓存策略
- pnpm store 缓存（加速依赖安装）
- Rust cargo 缓存（加速 Rust 编译）
- 使用 `hashFiles` 确保缓存有效性

### 超时设置
- 整体超时：60 分钟
- 依赖安装：15 分钟
- Tauri 构建：30 分钟

### 错误处理
- 使用 `if-no-files-found: warn` 避免构建失败
- 使用 `|| true` 处理可选步骤
- 清晰的错误日志输出

## 常见问题

### Q: 为什么 CI 不运行测试？
A: 本地 Git hooks 已经运行了所有测试，CI 重复运行会浪费时间和资源。

### Q: 为什么有时会看到多个工作流运行？
A: 如果看到多个工作流，说明触发条件有问题。正常情况下：
- 普通提交：只触发 Build
- 发布提交：不触发 Build（被排除）
- Tag 推送：只触发 Release

### Q: 如何手动触发工作流？
A: 在 GitHub Actions 页面，选择工作流，点击 "Run workflow"。

### Q: 构建失败怎么办？
A: 
1. 检查 Actions 日志
2. 本地运行 `pnpm tauri build` 复现问题
3. 修复后重新推送

## 维护指南

### 添加新平台支持

如果需要支持 macOS 或 Linux：

1. 在 `release.yml` 中添加 matrix 策略
2. 为每个平台配置不同的构建步骤
3. 更新绿色版打包逻辑

### 修改触发条件

如果需要修改触发条件：

1. 编辑 `on:` 部分
2. 确保不会与其他工作流冲突
3. 测试新的触发逻辑

### 优化构建时间

如果构建时间过长：

1. 检查缓存是否生效
2. 考虑使用更快的 runner
3. 优化依赖安装步骤

## 参考资料

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Tauri CI/CD 指南](https://tauri.app/v1/guides/building/cross-platform)
- [pnpm CI 配置](https://pnpm.io/continuous-integration)
