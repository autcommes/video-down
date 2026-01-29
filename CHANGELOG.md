# 更新日志

所有重要的变更都会记录在这个文件中。


## [4.0.5](https://github.com/autcommes/video-down/compare/v4.0.2...v4.0.5) (2026-01-29)

### 🐛 Bug 修复

* 避免 release 提交触发重复的构建工作流 ([4af1131](https://github.com/autcommes/video-down/commit/4af1131a397f06f5aa888d750cc7d293f1e6e0a5))
* 使用 paths-ignore 彻底避免 release 提交触发 Build 工作流 ([b8b98fc](https://github.com/autcommes/video-down/commit/b8b98fcdd79b807a6b99c0036a7f72b87494c679))
* 修复 Release 工作流中绿色版 zip 文件名变量问题 ([2ac7a60](https://github.com/autcommes/video-down/commit/2ac7a60d3eb9e94b19caea2b15a80e21fbdc4d0a))

### ♻️ 代码重构

* 重构 CI/CD 工作流，遵循最佳实践 ([e05e83a](https://github.com/autcommes/video-down/commit/e05e83abdc487f5ce2a127e700b9a83083eea869))

### 🔧 其他

* 删除旧的 build-release.yml 工作流文件 ([6e95da4](https://github.com/autcommes/video-down/commit/6e95da4bd091266966c55f00473d8dd0bf281485))
* release v4.0.3 ([1b636c1](https://github.com/autcommes/video-down/commit/1b636c1c2dc9cfeeccffb5dafcaff796b0f4b4f2))
* release v4.0.4 ([8f8e03e](https://github.com/autcommes/video-down/commit/8f8e03e4c1ef143cea25633c7c62c206b3daaded))

## [4.0.4](https://github.com/autcommes/video-down/compare/v4.0.2...v4.0.4) (2026-01-29)

### 🐛 Bug 修复

* 避免 release 提交触发重复的构建工作流 ([4af1131](https://github.com/autcommes/video-down/commit/4af1131a397f06f5aa888d750cc7d293f1e6e0a5))
* 使用 paths-ignore 彻底避免 release 提交触发 Build 工作流 ([b8b98fc](https://github.com/autcommes/video-down/commit/b8b98fcdd79b807a6b99c0036a7f72b87494c679))

### ♻️ 代码重构

* 重构 CI/CD 工作流，遵循最佳实践 ([e05e83a](https://github.com/autcommes/video-down/commit/e05e83abdc487f5ce2a127e700b9a83083eea869))

### 🔧 其他

* release v4.0.3 ([1b636c1](https://github.com/autcommes/video-down/commit/1b636c1c2dc9cfeeccffb5dafcaff796b0f4b4f2))

## [4.0.3](https://github.com/autcommes/video-down/compare/v4.0.2...v4.0.3) (2026-01-29)

### 🐛 Bug 修复

* 避免 release 提交触发重复的构建工作流 ([4af1131](https://github.com/autcommes/video-down/commit/4af1131a397f06f5aa888d750cc7d293f1e6e0a5))

### ♻️ 代码重构

* 重构 CI/CD 工作流，遵循最佳实践 ([e05e83a](https://github.com/autcommes/video-down/commit/e05e83abdc487f5ce2a127e700b9a83083eea869))

## [4.0.2](https://github.com/autcommes/video-down/compare/v4.0.0...v4.0.2) (2026-01-29)

### 🐛 Bug 修复

* 修复绿色版打包问题 ([aa709c8](https://github.com/autcommes/video-down/commit/aa709c8bc9586cafcb55b6eed91381c9a653e45d))

## [4.0.1](https://github.com/autcommes/video-down/compare/v4.0.0...v4.0.1) (2026-01-29)

## [4.0.0](https://github.com/autcommes/video-down/compare/v3.0.0...v4.0.0) (2026-01-29)

### ✨ 新功能

* 添加 Windows 绿色免安装版支持 ([1b607ae](https://github.com/autcommes/video-down/commit/1b607aee87da7ee49f4e4e4d972f83a7f9c3c32c))

### 🐛 Bug 修复

* 优化工作流触发条件，避免重复构建 ([aee812d](https://github.com/autcommes/video-down/commit/aee812d92ee91c07e85281369024bc09d4b863f3))

## 3.0.0 (2026-01-29)

### ✨ 新功能

* 添加 CI 构建和发布工作流 ([b704f67](https://github.com/autcommes/video-down/commit/b704f67f8fefd23d9220845cd2a4b6dabeb4c04d))
* 添加 Git pre-commit hooks 设置脚本 ([1e119c9](https://github.com/autcommes/video-down/commit/1e119c9260d71a083b31e67b1225bea4cfd13a30))
* 添加 GitHub Actions 工作流 ([ce8ae7a](https://github.com/autcommes/video-down/commit/ce8ae7a4460aa9b2064c8ed1a0fa0fb9f7c135de))
* 完善自动化发布流程 ([c03bcbb](https://github.com/autcommes/video-down/commit/c03bcbb85bcb3ec8fcbd220ce4eaf69efed49da8))

### 🐛 Bug 修复

* 禁用 release-it 的 GitHub Release 创建,由 CI 工作流处理 ([e0e0efa](https://github.com/autcommes/video-down/commit/e0e0efa03b1fe1aa44b32cae32845f9caeac6395))
* 修复 GitHub Actions 工作流的 Ubuntu 依赖问题 ([192bf40](https://github.com/autcommes/video-down/commit/192bf409742a2f157d5c0e709199814197900849))
* 修复 Rust 编译错误和警告 ([701e1ef](https://github.com/autcommes/video-down/commit/701e1ef8097edbb04fa8b6e797b26da9359d6298))
* 修复 Rust 测试中缺少 youtube_cookie_browser 字段 ([0b68f04](https://github.com/autcommes/video-down/commit/0b68f04e76a47a75c586119aaffdc5f7da2d8e42))
* 修复属性测试中的 format_id 重复问题 ([206beed](https://github.com/autcommes/video-down/commit/206beed9bd9d9db3d3d2397dab9fad51a071c9da))
* 修复所有 Rust clippy 警告 ([a5cbd46](https://github.com/autcommes/video-down/commit/a5cbd46430092fbc1306addbaa64492a612f6d12))
* 修复所有 TypeScript 和 ESLint 错误 ([1e916d8](https://github.com/autcommes/video-down/commit/1e916d88caa390700acaa1b53dc8115fb20ae23e))
* 移除不存在的 generate-release-notes.js 引用 ([176d966](https://github.com/autcommes/video-down/commit/176d96633bc0fe1063706ebee8b801e1e88c396d))
* 移除发布前的测试和 lint 检查 ([21d75c9](https://github.com/autcommes/video-down/commit/21d75c9972c3a61582e761d46c28870f9ad26a05))
* 优化 CI/CD 工作流配置 ([60ed9f3](https://github.com/autcommes/video-down/commit/60ed9f3a4a0cd96b4fa97cdaa6af06bacd24363f))
* 增加 Rust 编译超时时间，暂时只测试 Windows ([1687d58](https://github.com/autcommes/video-down/commit/1687d5873525dbf9a0ae687159edf33fef23cac9))

### ✅ 测试

* 修复所有测试文件的 DOM 清理问题 ([8ef3b7f](https://github.com/autcommes/video-down/commit/8ef3b7f25eb6e513522122a25c1ea3af3452d89b))

### 👷 CI/CD

* 禁用 Windows 上的 Rust 缓存以避免解压超时 ([9fe5c60](https://github.com/autcommes/video-down/commit/9fe5c600564f5aadc9c0c9039f53ea23079886d4))
* 使用 tauri-action 简化构建流程 ([2a07f93](https://github.com/autcommes/video-down/commit/2a07f935fe27978c6a82b09307234113ad6cdb10))
* 修复 pnpm lockfile 版本不兼容问题 ([9276c20](https://github.com/autcommes/video-down/commit/9276c20f26509d6e1384de2d01cc91f6e89ffad1))
* 增加 Rust 缓存超时时间以避免取消 ([ccca2be](https://github.com/autcommes/video-down/commit/ccca2be699ecaf68649c59793e93dc00766e95d9))

### 🔧 其他

* 配置 Git hooks 和修复代码质量问题 ([1562c28](https://github.com/autcommes/video-down/commit/1562c28a08b8a419aa815ad1ca6a07bf8c113a5e))
* 配置 Git hooks 和修复类型错误 ([147e130](https://github.com/autcommes/video-down/commit/147e1300ca503f6cf779fb2541da4e2dc7c4dd12))
* 配置自动化版本发布工具 ([55c7bc2](https://github.com/autcommes/video-down/commit/55c7bc26cb189251123be7fdb62105d9b3774a51))
* **ci:** 简化 CI 工作流，移除测试步骤 ([8762091](https://github.com/autcommes/video-down/commit/8762091dedc006f7cdf5b8e7bcefb074754e83ea))
* release v2.0.0 ([bbe909f](https://github.com/autcommes/video-down/commit/bbe909f5f3dcb050ec0df4b83053eae20d94ccb2))

## 2.0.0 (2026-01-29)

### ✨ 新功能

* 添加 CI 构建和发布工作流 ([b704f67](https://github.com/autcommes/video-down/commit/b704f67f8fefd23d9220845cd2a4b6dabeb4c04d))
* 添加 Git pre-commit hooks 设置脚本 ([1e119c9](https://github.com/autcommes/video-down/commit/1e119c9260d71a083b31e67b1225bea4cfd13a30))
* 添加 GitHub Actions 工作流 ([ce8ae7a](https://github.com/autcommes/video-down/commit/ce8ae7a4460aa9b2064c8ed1a0fa0fb9f7c135de))
* 完善自动化发布流程 ([c03bcbb](https://github.com/autcommes/video-down/commit/c03bcbb85bcb3ec8fcbd220ce4eaf69efed49da8))

### 🐛 Bug 修复

* 修复 GitHub Actions 工作流的 Ubuntu 依赖问题 ([192bf40](https://github.com/autcommes/video-down/commit/192bf409742a2f157d5c0e709199814197900849))
* 修复 Rust 编译错误和警告 ([701e1ef](https://github.com/autcommes/video-down/commit/701e1ef8097edbb04fa8b6e797b26da9359d6298))
* 修复 Rust 测试中缺少 youtube_cookie_browser 字段 ([0b68f04](https://github.com/autcommes/video-down/commit/0b68f04e76a47a75c586119aaffdc5f7da2d8e42))
* 修复所有 Rust clippy 警告 ([a5cbd46](https://github.com/autcommes/video-down/commit/a5cbd46430092fbc1306addbaa64492a612f6d12))
* 修复所有 TypeScript 和 ESLint 错误 ([1e916d8](https://github.com/autcommes/video-down/commit/1e916d88caa390700acaa1b53dc8115fb20ae23e))
* 移除不存在的 generate-release-notes.js 引用 ([176d966](https://github.com/autcommes/video-down/commit/176d96633bc0fe1063706ebee8b801e1e88c396d))
* 移除发布前的测试和 lint 检查 ([21d75c9](https://github.com/autcommes/video-down/commit/21d75c9972c3a61582e761d46c28870f9ad26a05))
* 优化 CI/CD 工作流配置 ([60ed9f3](https://github.com/autcommes/video-down/commit/60ed9f3a4a0cd96b4fa97cdaa6af06bacd24363f))
* 增加 Rust 编译超时时间，暂时只测试 Windows ([1687d58](https://github.com/autcommes/video-down/commit/1687d5873525dbf9a0ae687159edf33fef23cac9))

### ✅ 测试

* 修复所有测试文件的 DOM 清理问题 ([8ef3b7f](https://github.com/autcommes/video-down/commit/8ef3b7f25eb6e513522122a25c1ea3af3452d89b))

### 👷 CI/CD

* 禁用 Windows 上的 Rust 缓存以避免解压超时 ([9fe5c60](https://github.com/autcommes/video-down/commit/9fe5c600564f5aadc9c0c9039f53ea23079886d4))
* 使用 tauri-action 简化构建流程 ([2a07f93](https://github.com/autcommes/video-down/commit/2a07f935fe27978c6a82b09307234113ad6cdb10))
* 修复 pnpm lockfile 版本不兼容问题 ([9276c20](https://github.com/autcommes/video-down/commit/9276c20f26509d6e1384de2d01cc91f6e89ffad1))
* 增加 Rust 缓存超时时间以避免取消 ([ccca2be](https://github.com/autcommes/video-down/commit/ccca2be699ecaf68649c59793e93dc00766e95d9))

### 🔧 其他

* 配置 Git hooks 和修复代码质量问题 ([1562c28](https://github.com/autcommes/video-down/commit/1562c28a08b8a419aa815ad1ca6a07bf8c113a5e))
* 配置 Git hooks 和修复类型错误 ([147e130](https://github.com/autcommes/video-down/commit/147e1300ca503f6cf779fb2541da4e2dc7c4dd12))
* 配置自动化版本发布工具 ([55c7bc2](https://github.com/autcommes/video-down/commit/55c7bc26cb189251123be7fdb62105d9b3774a51))
* **ci:** 简化 CI 工作流，移除测试步骤 ([8762091](https://github.com/autcommes/video-down/commit/8762091dedc006f7cdf5b8e7bcefb074754e83ea))

## 1.0.0 (2026-01-29)

### ✨ 新功能

* 添加 CI 构建和发布工作流 ([b704f67](https://github.com/autcommes/video-down/commit/b704f67f8fefd23d9220845cd2a4b6dabeb4c04d))
* 添加 Git pre-commit hooks 设置脚本 ([1e119c9](https://github.com/autcommes/video-down/commit/1e119c9260d71a083b31e67b1225bea4cfd13a30))
* 添加 GitHub Actions 工作流 ([ce8ae7a](https://github.com/autcommes/video-down/commit/ce8ae7a4460aa9b2064c8ed1a0fa0fb9f7c135de))
* 完善自动化发布流程 ([c03bcbb](https://github.com/autcommes/video-down/commit/c03bcbb85bcb3ec8fcbd220ce4eaf69efed49da8))

### 🐛 Bug 修复

* 修复 GitHub Actions 工作流的 Ubuntu 依赖问题 ([192bf40](https://github.com/autcommes/video-down/commit/192bf409742a2f157d5c0e709199814197900849))
* 修复 Rust 编译错误和警告 ([701e1ef](https://github.com/autcommes/video-down/commit/701e1ef8097edbb04fa8b6e797b26da9359d6298))
* 修复 Rust 测试中缺少 youtube_cookie_browser 字段 ([0b68f04](https://github.com/autcommes/video-down/commit/0b68f04e76a47a75c586119aaffdc5f7da2d8e42))
* 修复所有 Rust clippy 警告 ([a5cbd46](https://github.com/autcommes/video-down/commit/a5cbd46430092fbc1306addbaa64492a612f6d12))
* 修复所有 TypeScript 和 ESLint 错误 ([1e916d8](https://github.com/autcommes/video-down/commit/1e916d88caa390700acaa1b53dc8115fb20ae23e))
* 移除发布前的测试和 lint 检查 ([21d75c9](https://github.com/autcommes/video-down/commit/21d75c9972c3a61582e761d46c28870f9ad26a05))
* 优化 CI/CD 工作流配置 ([60ed9f3](https://github.com/autcommes/video-down/commit/60ed9f3a4a0cd96b4fa97cdaa6af06bacd24363f))
* 增加 Rust 编译超时时间，暂时只测试 Windows ([1687d58](https://github.com/autcommes/video-down/commit/1687d5873525dbf9a0ae687159edf33fef23cac9))

### ✅ 测试

* 修复所有测试文件的 DOM 清理问题 ([8ef3b7f](https://github.com/autcommes/video-down/commit/8ef3b7f25eb6e513522122a25c1ea3af3452d89b))

### 👷 CI/CD

* 禁用 Windows 上的 Rust 缓存以避免解压超时 ([9fe5c60](https://github.com/autcommes/video-down/commit/9fe5c600564f5aadc9c0c9039f53ea23079886d4))
* 使用 tauri-action 简化构建流程 ([2a07f93](https://github.com/autcommes/video-down/commit/2a07f935fe27978c6a82b09307234113ad6cdb10))
* 修复 pnpm lockfile 版本不兼容问题 ([9276c20](https://github.com/autcommes/video-down/commit/9276c20f26509d6e1384de2d01cc91f6e89ffad1))
* 增加 Rust 缓存超时时间以避免取消 ([ccca2be](https://github.com/autcommes/video-down/commit/ccca2be699ecaf68649c59793e93dc00766e95d9))

### 🔧 其他

* 配置 Git hooks 和修复代码质量问题 ([1562c28](https://github.com/autcommes/video-down/commit/1562c28a08b8a419aa815ad1ca6a07bf8c113a5e))
* 配置 Git hooks 和修复类型错误 ([147e130](https://github.com/autcommes/video-down/commit/147e1300ca503f6cf779fb2541da4e2dc7c4dd12))
* 配置自动化版本发布工具 ([55c7bc2](https://github.com/autcommes/video-down/commit/55c7bc26cb189251123be7fdb62105d9b3774a51))
* **ci:** 简化 CI 工作流，移除测试步骤 ([8762091](https://github.com/autcommes/video-down/commit/8762091dedc006f7cdf5b8e7bcefb074754e83ea))
