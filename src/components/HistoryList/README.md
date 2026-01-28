# HistoryList 组件

历史记录组件，用于显示和管理视频下载历史记录。

## 功能特性

- ✅ 显示下载历史记录列表
- ✅ 加载历史记录
- ✅ 打开已下载的文件
- ✅ 清空历史记录列表
- ✅ 虚拟滚动（超过 100 条记录时自动启用）
- ✅ 文件存在性检查
- ✅ 错误处理和用户反馈

## 组件结构

```
HistoryList/
├── HistoryList.tsx          # 容器组件
├── HistoryItem.tsx          # 单条记录组件
├── index.ts                 # 导出文件
├── HistoryList.test.tsx     # 容器组件测试
├── HistoryItem.test.tsx     # 单条记录测试
├── HistoryList.example.tsx  # 使用示例
└── README.md                # 文档
```

## 使用方法

### 基本使用

```tsx
import { HistoryList } from '@/components/HistoryList';

function App() {
  return (
    <div className="container mx-auto p-4">
      <HistoryList />
    </div>
  );
}
```

### 自定义高度

```tsx
import { HistoryList } from '@/components/HistoryList';

function App() {
  return (
    <div className="container mx-auto p-4">
      {/* 设置虚拟滚动容器高度为 400px */}
      <HistoryList height={400} />
    </div>
  );
}
```

## Props

### HistoryList

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| height | number | 600 | 虚拟滚动容器高度（像素） |

### HistoryItem

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| item | HistoryItem | 是 | 历史记录项数据 |
| onOpenFile | (filePath: string) => void | 是 | 打开文件回调 |

## 数据模型

```typescript
interface HistoryItem {
  id: string;              // 记录 ID
  title: string;           // 视频标题
  url: string;             // 视频 URL
  resolution: string;      // 下载的分辨率
  filePath: string;        // 文件路径
  fileSize: number;        // 文件大小（字节）
  downloadedAt: number;    // 下载时间戳（秒）
  fileExists: boolean;     // 文件是否存在
}
```

## 功能说明

### 1. 历史记录加载

组件挂载时自动从后端加载历史记录：

```typescript
useEffect(() => {
  loadHistory();
}, [loadHistory]);
```

### 2. 打开文件

点击"打开"按钮时，使用系统默认程序打开文件：

```typescript
const handleOpenFile = async (filePath: string) => {
  try {
    await openHistoryFile(filePath);
  } catch (error) {
    // 错误处理
  }
};
```

### 3. 清空历史记录

点击"清空列表"按钮时，弹出确认对话框，确认后清空所有历史记录（不删除文件）：

```typescript
const handleClearHistory = async () => {
  if (!confirm('确定要清空所有历史记录吗？已下载的文件不会被删除。')) {
    return;
  }
  await clearHistory();
};
```

### 4. 虚拟滚动

当历史记录超过 100 条时，自动启用虚拟滚动以提升性能：

```typescript
const VIRTUAL_SCROLL_THRESHOLD = 100;

if (items.length > VIRTUAL_SCROLL_THRESHOLD) {
  return <List ... />;
}
```

### 5. 文件存在性检查

历史记录项会显示文件是否存在：

- ✅ 文件存在：显示"打开"按钮
- ⚠️ 文件不存在：显示警告，禁用"打开"按钮

## 状态管理

组件使用 Zustand store 管理状态：

```typescript
const {
  items,           // 历史记录列表
  isLoading,       // 加载状态
  error,           // 错误信息
  loadHistory,     // 加载历史记录
  clearHistory,    // 清空历史记录
  openHistoryFile, // 打开文件
  clearError,      // 清除错误
} = useHistoryStore();
```

## 样式

组件使用 shadcn/ui 和 Tailwind CSS：

- Card 组件：容器和单条记录
- Button 组件：操作按钮
- 响应式布局
- 文本截断和 tooltip

## 测试

运行测试：

```bash
pnpm test src/components/HistoryList
```

测试覆盖：

- ✅ 组件渲染
- ✅ 历史记录加载
- ✅ 打开文件功能
- ✅ 清空历史记录
- ✅ 加载状态显示
- ✅ 错误状态显示
- ✅ 空状态显示
- ✅ 文件大小格式化
- ✅ 时间戳格式化
- ✅ 文件不存在状态

## 性能优化

1. **虚拟滚动**：超过 100 条记录时自动启用
2. **防抖更新**：避免频繁重渲染
3. **懒加载**：按需加载历史记录
4. **Memo 优化**：使用 React.memo 避免不必要的重渲染

## 需求映射

该组件实现了以下需求：

- **需求 5.1**：历史记录保存和加载
- **需求 5.2**：历史记录显示
- **需求 5.3**：打开文件功能
- **需求 5.4**：清空列表功能
- **需求 7.5**：虚拟滚动性能优化

## 相关文件

- Store: `src/store/historyStore.ts`
- API: `src/services/tauriApi.ts`
- Types: `src/types/models.ts`
