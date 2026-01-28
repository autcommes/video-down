# 视频下载工具

基于 Tauri + React + shadcn/ui 的桌面视频下载应用。

## 技术栈

### 前端
- React 18+
- TypeScript
- Vite
- shadcn/ui + Tailwind CSS
- Zustand (状态管理)

### 后端
- Rust
- Tauri 1.5+
- tokio (异步运行时)
- serde (序列化)

## 开发

### 前置要求
- Node.js 18+
- Rust 1.70+
- pnpm (推荐) / npm / yarn

> **注意**: 本项目使用 pnpm 作为包管理器，建议使用 pnpm 以确保依赖版本一致性。

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm run tauri:dev
```

### 构建

```bash
pnpm run tauri:build
```

### 代码检查

```bash
# 前端 ESLint
pnpm run lint

# 前端格式化
pnpm run format

# Rust Clippy
cd src-tauri && cargo clippy

# Rust 格式化
cd src-tauri && cargo fmt
```

### 测试

```bash
# 前端测试
pnpm run test

# Rust 测试
cd src-tauri && cargo test
```

## 项目结构

```
.
├── src/                    # 前端源码
│   ├── components/         # React 组件
│   │   └── ui/            # shadcn/ui 组件
│   ├── store/             # Zustand 状态管理
│   ├── services/          # API 服务层
│   ├── utils/             # 工具函数
│   └── lib/               # 库函数
├── src-tauri/             # Tauri 后端
│   ├── src/
│   │   ├── commands/      # Tauri 命令
│   │   ├── services/      # 业务逻辑
│   │   ├── models/        # 数据模型
│   │   ├── utils/         # 工具函数
│   │   └── error.rs       # 错误定义
│   └── resources/         # 资源文件 (yt-dlp)
└── .kiro/specs/           # 项目规范文档
```

## 功能特性

- ✅ 支持 YouTube 及 1000+ 视频网站
- ✅ 多分辨率选择
- ✅ 实时下载进度
- ✅ 下载历史记录
- ✅ yt-dlp 自动更新
- ✅ 跨平台支持 (Windows, macOS, Linux)

## License

MIT
