# UpdatePanel 组件

更新面板组件，用于管理 yt-dlp 的版本检查和更新功能。

## 功能特性

- ✅ 显示当前 yt-dlp 版本
- ✅ 检查最新版本
- ✅ 一键更新到最新版本
- ✅ 实时显示更新进度
- ✅ 显示更新说明
- ✅ 错误处理和用户反馈
- ✅ 更新完成提示

## 组件结构

```
UpdatePanel/
├── UpdatePanel.tsx          # 主容器组件
├── VersionInfo.tsx          # 版本信息显示组件
├── UpdatePanel.test.tsx     # UpdatePanel 测试
├── VersionInfo.test.tsx     # VersionInfo 测试
├── UpdatePanel.example.tsx  # 使用示例
├── index.ts                 # 模块导出
└── README.md               # 文档
```

## 使用方法

### 基本使用

```tsx
import { UpdatePanel } from '@/components/UpdatePanel';

function App() {
  return (
    <div className="container mx-auto p-8">
      <UpdatePanel />
    </div>
  );
}
```

### 在应用中集成

```tsx
import { UpdatePanel } from '@/components/UpdatePanel';
import { DownloadForm } from '@/components/DownloadForm';
import { HistoryList } from '@/components/HistoryList';

function App() {
  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">视频下载工具</h1>
      
      {/* 下载表单 */}
      <DownloadForm />
      
      {/* 更新面板 */}
      <UpdatePanel />
      
      {/* 历史记录 */}
      <HistoryList />
    </div>
  );
}
```

## 组件说明

### UpdatePanel

主容器组件，管理整个更新流程。

**功能：**
- 自动获取当前版本
- 检查更新
- 执行更新
- 监听更新进度
- 错误处理

**状态管理：**
- `updateInfo`: 更新信息（当前版本、最新版本、是否有更新等）
- `isChecking`: 是否正在检查更新
- `isUpdating`: 是否正在更新
- `updateProgress`: 更新进度数据
- `error`: 错误信息
- `updateComplete`: 更新是否完成

### VersionInfo

版本信息显示组件。

**Props：**
```typescript
interface VersionInfoProps {
  currentVersion: string;      // 当前版本
  latestVersion?: string;       // 最新版本（可选）
  hasUpdate: boolean;           // 是否有更新
  releaseNotes?: string;        // 更新说明（可选）
}
```

**显示内容：**
- 当前版本号
- 最新版本号（如果有）
- 更新状态标记（有新版本/已是最新）
- 更新说明（如果有更新）

## 事件处理

### 检查更新

点击"检查更新"按钮时：
1. 调用 `tauriApi.update.checkYtdlpUpdate()`
2. 获取最新版本信息
3. 显示版本对比和更新状态

### 执行更新

点击"立即更新"按钮时：
1. 监听更新进度事件
2. 调用 `tauriApi.update.updateYtdlp()`
3. 实时显示下载进度
4. 更新完成后显示成功提示
5. 重新获取版本信息

## 错误处理

组件会捕获并显示以下错误：
- 网络连接失败
- 检查更新失败
- 下载失败
- 文件替换失败

错误信息会以红色提示框显示在界面上。

## 样式定制

组件使用 shadcn/ui 和 Tailwind CSS，可以通过以下方式定制样式：

```tsx
// 自定义容器样式
<div className="max-w-2xl mx-auto">
  <UpdatePanel />
</div>

// 修改 Card 样式
// 编辑 UpdatePanel.tsx 中的 Card 组件
```

## 依赖

- `@/components/ui/card` - Card 组件
- `@/components/ui/button` - Button 组件
- `@/components/ui/badge` - Badge 组件
- `@/services/tauriApi` - Tauri API 封装
- `@/types` - TypeScript 类型定义

## 测试

运行测试：
```bash
pnpm vitest run src/components/UpdatePanel
```

测试覆盖：
- ✅ 组件挂载和初始化
- ✅ 检查更新功能
- ✅ 更新执行功能
- ✅ 进度显示
- ✅ 错误处理
- ✅ 版本信息显示
- ✅ 更新说明显示

## 注意事项

1. **权限要求**：更新 yt-dlp 需要文件写入权限
2. **网络要求**：检查更新和下载需要网络连接
3. **更新时机**：建议在应用启动时自动检查更新
4. **用户体验**：更新过程中禁用相关按钮，防止重复操作

## 相关需求

实现以下需求：
- 6.1: 读取本地 yt-dlp 版本
- 6.2: 查询 GitHub 最新版本
- 6.3: 版本号比较
- 6.4: 显示更新提示
- 6.5: 下载新版本
- 6.6: 备份和替换文件
- 6.7: 处理更新错误

## 示例

查看 `UpdatePanel.example.tsx` 获取完整的使用示例。
