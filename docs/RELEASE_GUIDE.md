# 发布指南

本文档说明如何使用自动化工具发布新版本。

## 🚀 快速发布

### 1. Patch 版本 (0.4.0 → 0.4.1)
修复 bug 或小改动:
```bash
pnpm release:patch
```

### 2. Minor 版本 (0.4.0 → 0.5.0)
新功能或较大改动:
```bash
pnpm release:minor
```

### 3. Major 版本 (0.4.0 → 1.0.0)
重大更新或破坏性变更:
```bash
pnpm release:major
```

### 4. 自定义版本
手动指定版本号:
```bash
pnpm release
# 然后按提示输入版本号
```

## 📋 发布流程

运行 `pnpm release:*` 命令后,会自动执行以下步骤:

1. **运行测试** - 执行 `pnpm test:all` 确保代码质量
2. **更新版本号** - 自动更新:
   - `package.json`
   - `src-tauri/tauri.conf.json`
3. **生成 CHANGELOG** - 基于 Git 提交历史自动生成
4. **创建提交** - 提交信息: `chore: release v{version}`
5. **创建标签** - 标签名: `v{version}`
6. **推送到 GitHub** - 推送提交和标签
7. **创建 GitHub Release** - 自动创建 Release (包含 CHANGELOG)
8. **触发 CI 构建** - GitHub Actions 自动构建并上传安装包

## 🔄 完整示例

```bash
# 1. 确保在 master 分支
git checkout master
git pull origin master

# 2. 发布新版本 (例如 patch)
pnpm release:patch

# 3. 等待 CI 构建完成 (约 10-15 分钟)
# 访问: https://github.com/autcommes/video-down/actions

# 4. 检查 Release
# 访问: https://github.com/autcommes/video-down/releases
```

## 📦 构建产物

发布完成后,GitHub Release 会自动包含:

- **MSI 安装包** - Windows Installer 格式
- **NSIS 安装包** - 另一种 Windows 安装程序
- **CHANGELOG** - 自动生成的更新日志

## 🔍 提交信息规范

为了自动生成有意义的 CHANGELOG,请遵循以下提交信息格式:

```
<type>: <subject>

<body>
```

### Type 类型

- `feat`: ✨ 新功能
- `fix`: 🐛 Bug 修复
- `perf`: ⚡ 性能优化
- `refactor`: ♻️ 代码重构
- `docs`: 📝 文档更新
- `style`: 💄 代码格式
- `test`: ✅ 测试相关
- `build`: 📦 构建系统
- `ci`: 👷 CI/CD 配置
- `chore`: 🔧 其他杂项

### 示例

```bash
# 新功能
git commit -m "feat: 添加视频下载进度显示"

# Bug 修复
git commit -m "fix: 修复下载失败时的错误提示"

# 性能优化
git commit -m "perf: 优化大文件下载性能"
```

## 🧪 测试发布 (Dry Run)

在正式发布前,可以先测试一下:

```bash
pnpm release:dry
```

这会模拟整个发布流程,但不会实际提交、推送或创建 Release。

## ⚠️ 注意事项

1. **确保测试通过** - 发布前会自动运行 `pnpm test:all`
2. **保持工作区干净** - 建议提交所有更改后再发布
3. **检查分支** - 只能从 `master` 分支发布
4. **网络连接** - 需要能够访问 GitHub
5. **权限要求** - 需要有仓库的推送权限

## 🔧 手动发布 (备用方案)

如果自动发布失败,可以手动操作:

```bash
# 1. 手动更新版本号
# 编辑 package.json 和 src-tauri/tauri.conf.json

# 2. 提交更改
git add .
git commit -m "chore: release v0.4.1"

# 3. 创建标签
git tag v0.4.1

# 4. 推送
git push origin master --tags

# 5. 等待 CI 自动构建并创建 Release
```

## 📚 相关文档

- [release-it 文档](https://github.com/release-it/release-it)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Actions 工作流](.github/workflows/release.yml)
