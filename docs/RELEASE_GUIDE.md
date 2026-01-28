# 版本发布指南

本项目使用 `release-it` 自动化版本发布流程。

## 🚀 快速开始

### 自动发布（推荐）

根据 Git 提交历史自动确定版本号：

```bash
pnpm release
```

这个命令会：
1. 运行测试和 Linter
2. 根据提交记录自动确定版本号（遵循语义化版本）
3. 更新 `package.json` 和 `Cargo.toml` 中的版本号
4. 生成 `CHANGELOG.md`
5. 创建 Git 提交和标签
6. 推送到 GitHub
7. 触发 GitHub Actions 自动构建

### 手动指定版本类型

如果你想手动指定版本类型：

```bash
# 补丁版本（Bug 修复）：0.1.0 -> 0.1.1
pnpm release:patch

# 次版本（新功能）：0.1.0 -> 0.2.0
pnpm release:minor

# 主版本（破坏性变更）：0.1.0 -> 1.0.0
pnpm release:major
```

### 预览发布（不实际执行）

```bash
pnpm release:dry
```

## 📝 提交规范

为了让 `release-it` 正确生成 CHANGELOG，请遵循以下提交规范：

### 提交格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 提交类型

| 类型 | 说明 | 版本影响 | CHANGELOG 分类 |
|------|------|----------|----------------|
| `feat` | 新功能 | 次版本 | ✨ 新功能 |
| `fix` | Bug 修复 | 补丁版本 | 🐛 Bug 修复 |
| `perf` | 性能优化 | 补丁版本 | ⚡ 性能优化 |
| `refactor` | 代码重构 | - | ♻️ 代码重构 |
| `docs` | 文档更新 | - | 📝 文档 |
| `style` | 代码格式 | - | 💄 样式 |
| `test` | 测试相关 | - | ✅ 测试 |
| `build` | 构建系统 | - | 📦 构建 |
| `ci` | CI/CD | - | 👷 CI/CD |
| `chore` | 其他杂项 | - | 🔧 其他 |

### 破坏性变更

如果有破坏性变更，在提交信息的 footer 中添加 `BREAKING CHANGE:`：

```bash
git commit -m "feat: 重构下载 API

BREAKING CHANGE: 下载 API 的参数结构已更改"
```

这会触发主版本号升级。

### 提交示例

```bash
# 新功能
git commit -m "feat: 添加 YouTube Cookie 支持"
git commit -m "feat(download): 支持批量下载"

# Bug 修复
git commit -m "fix: 修复下载进度显示错误"
git commit -m "fix(history): 修复历史记录为空的问题"

# 性能优化
git commit -m "perf: 优化大文件下载性能"

# 代码重构
git commit -m "refactor: 重构下载服务代码"

# 文档
git commit -m "docs: 更新 README"

# 其他
git commit -m "chore: 更新依赖"
git commit -m "ci: 添加 GitHub Actions 工作流"
```

## 🔄 完整发布流程

### 1. 开发和提交

```bash
# 开发功能
git add .
git commit -m "feat: 添加新功能"

# 修复 Bug
git add .
git commit -m "fix: 修复某个问题"

# 推送到远程
git push
```

### 2. 发布新版本

```bash
# 运行发布命令
pnpm release

# 或者预览一下
pnpm release:dry
```

### 3. 发布过程

`release-it` 会交互式地询问你：

```
? Select increment (next version): (Use arrow keys)
❯ patch (0.1.1)
  minor (0.2.0)
  major (1.0.0)
  prepatch (0.1.1-0)
  preminor (0.2.0-0)
  premajor (1.0.0-0)
  prerelease (0.1.1-0)
```

选择版本类型后，会显示：

```
✔ Running tests...
✔ Running linter...
✔ Bumping version in package.json
✔ Bumping version in src-tauri/Cargo.toml
✔ Generating CHANGELOG.md
✔ Creating commit
✔ Creating tag v0.2.0
✔ Pushing to remote
```

### 4. 自动构建

推送标签后，GitHub Actions 会自动：
1. 构建所有平台的安装包
2. 创建 GitHub Release
3. 上传构建产物

## 📦 版本号规则

遵循语义化版本（Semantic Versioning）：

```
主版本号.次版本号.补丁版本号
MAJOR.MINOR.PATCH
```

- **主版本号（MAJOR）**：不兼容的 API 变更
- **次版本号（MINOR）**：向后兼容的新功能
- **补丁版本号（PATCH）**：向后兼容的 Bug 修复

### 示例

```
0.1.0 -> 0.1.1  (补丁：修复 Bug)
0.1.1 -> 0.2.0  (次版本：新功能)
0.2.0 -> 1.0.0  (主版本：破坏性变更)
```

## 🔧 配置说明

### `.release-it.json`

```json
{
  "git": {
    "commitMessage": "chore: release v${version}",
    "tagName": "v${version}",
    "requireBranch": "master"
  },
  "hooks": {
    "before:init": ["pnpm test", "pnpm lint"]
  }
}
```

### 钩子说明

- `before:init`：发布前运行测试和 Linter
- 如果测试或 Linter 失败，发布会中止

## 🐛 故障排除

### 测试失败

如果发布时测试失败：

```bash
# 先运行测试
pnpm test

# 修复失败的测试
# ...

# 再次发布
pnpm release
```

### 跳过测试（不推荐）

如果确实需要跳过测试：

```bash
release-it --no-git.requireCleanWorkingDir
```

### 版本号冲突

如果版本号已存在：

```bash
# 删除本地标签
git tag -d v0.1.0

# 删除远程标签
git push origin :refs/tags/v0.1.0

# 重新发布
pnpm release
```

### 回滚发布

如果发布出错，可以回滚：

```bash
# 删除标签
git tag -d v0.1.0
git push origin :refs/tags/v0.1.0

# 回退提交
git reset --hard HEAD~1
git push -f origin master
```

## 📚 相关资源

- [release-it 文档](https://github.com/release-it/release-it)
- [语义化版本规范](https://semver.org/lang/zh-CN/)
- [约定式提交规范](https://www.conventionalcommits.org/zh-hans/)

## 💡 最佳实践

1. **频繁发布小版本**：不要积累太多变更
2. **遵循提交规范**：让 CHANGELOG 自动生成
3. **先预览再发布**：使用 `pnpm release:dry` 预览
4. **保持测试通过**：发布前确保所有测试通过
5. **更新文档**：重要变更要更新文档

## 🎯 示例工作流

```bash
# 1. 开发新功能
git checkout -b feature/new-feature
# ... 开发 ...
git add .
git commit -m "feat: 添加新功能"
git push origin feature/new-feature

# 2. 创建 PR 并合并到 master

# 3. 切换到 master 分支
git checkout master
git pull

# 4. 发布新版本
pnpm release

# 5. 等待 GitHub Actions 构建完成
# 访问 https://github.com/autcommes/video-down/releases
```
