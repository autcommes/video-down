# 错误处理和用户反馈使用指南

本文档介绍如何在应用中使用错误处理和用户反馈功能。

## 功能概述

应用提供了以下错误处理和用户反馈机制：

1. **全局错误边界（Error Boundary）** - 捕获 React 组件树中的错误
2. **Toast 通知** - 显示简短的通知消息
3. **错误对话框** - 显示详细的错误信息
4. **重试机制** - 自动重试失败的操作
5. **日志记录** - 记录应用运行日志

## 使用方法

### 1. 使用 useErrorHandler Hook

`useErrorHandler` 提供了统一的错误处理接口：

```typescript
import { useErrorHandler } from '@/hooks/use-error-handler';

function MyComponent() {
  const { handleError, handleAsyncError, withRetry } = useErrorHandler();

  // 处理同步错误
  const handleClick = () => {
    try {
      // 可能抛出错误的代码
      throw new Error('操作失败');
    } catch (error) {
      handleError(error, {
        title: '操作失败',
        customMessage: '无法完成操作，请稍后重试',
      });
    }
  };

  // 处理异步错误
  const loadData = async () => {
    const data = await handleAsyncError(
      () => fetchData(),
      {
        title: '加载失败',
        customMessage: '无法加载数据',
      }
    );

    if (data) {
      // 处理数据
    }
  };

  // 使用重试机制
  const saveData = async () => {
    const result = await withRetry(
      () => saveToServer(data),
      {
        title: '保存失败',
        maxRetries: 3,
        retryDelay: 1000,
      }
    );

    if (result) {
      // 保存成功
    }
  };
}
```

### 2. 使用 ErrorDialog 组件

显示详细的错误信息对话框：

```typescript
import { useState } from 'react';
import { ErrorDialog } from '@/components/ErrorDialog';

function MyComponent() {
  const [errorDialog, setErrorDialog] = useState({
    open: false,
    message: '',
    details: '',
  });

  const handleError = (error: Error) => {
    setErrorDialog({
      open: true,
      message: error.message,
      details: error.stack || '',
    });
  };

  const handleRetry = async () => {
    // 重试逻辑
    await retryOperation();
  };

  return (
    <>
      {/* 你的组件内容 */}
      
      <ErrorDialog
        open={errorDialog.open}
        onClose={() => setErrorDialog({ ...errorDialog, open: false })}
        title="操作失败"
        message={errorDialog.message}
        details={errorDialog.details}
        onRetry={handleRetry}
        showReload={false}
      />
    </>
  );
}
```

### 3. 使用 Toast 通知

Toast 通知会自动通过 `useErrorHandler` 显示，也可以直接使用：

```typescript
import { useToast } from '@/hooks/use-toast';

function MyComponent() {
  const { toast } = useToast();

  const showSuccess = () => {
    toast({
      title: '操作成功',
      description: '数据已保存',
    });
  };

  const showError = () => {
    toast({
      variant: 'destructive',
      title: '操作失败',
      description: '无法保存数据',
    });
  };

  const showWithAction = () => {
    toast({
      title: '下载完成',
      description: '文件已保存到本地',
      action: {
        label: '打开',
        onClick: () => openFile(),
      },
    });
  };
}
```

### 4. 使用日志记录

使用全局 logger 记录应用日志：

```typescript
import logger from '@/utils/logger';

function MyComponent() {
  const handleOperation = async () => {
    logger.info('开始操作', { userId: '123' });

    try {
      const result = await performOperation();
      logger.info('操作成功', { result });
    } catch (error) {
      logger.error('操作失败', error as Error, { context: 'MyComponent' });
    }
  };

  // 导出日志
  const exportLogs = () => {
    logger.downloadLogs();
  };
}
```

## 错误处理选项

### ErrorHandlerOptions

```typescript
interface ErrorHandlerOptions {
  /** 是否显示 Toast 通知（默认: true） */
  showToast?: boolean;
  
  /** 自定义错误消息 */
  customMessage?: string;
  
  /** 错误标题（默认: "操作失败"） */
  title?: string;
  
  /** 是否记录到控制台（默认: true） */
  logToConsole?: boolean;
  
  /** 重试回调函数 */
  onRetry?: () => void | Promise<void>;
}
```

### 重试选项

```typescript
interface RetryOptions extends ErrorHandlerOptions {
  /** 最大重试次数（默认: 3） */
  maxRetries?: number;
  
  /** 重试延迟（毫秒，默认: 1000） */
  retryDelay?: number;
}
```

## 最佳实践

### 1. 选择合适的错误反馈方式

- **Toast 通知**：用于简短的、非关键的错误提示
- **错误对话框**：用于需要用户注意的重要错误
- **内联错误**：用于表单验证等局部错误

### 2. 提供有意义的错误消息

```typescript
// ❌ 不好的错误消息
handleError(error, {
  customMessage: '错误',
});

// ✅ 好的错误消息
handleError(error, {
  title: '下载失败',
  customMessage: '无法下载视频，请检查网络连接或稍后重试',
});
```

### 3. 合理使用重试机制

```typescript
// 适合重试的场景：网络请求、临时性错误
const data = await withRetry(
  () => fetchFromServer(),
  {
    maxRetries: 3,
    retryDelay: 1000,
  }
);

// 不适合重试的场景：验证错误、权限错误
// 这些应该直接显示错误，不需要重试
```

### 4. 记录详细的日志

```typescript
// 记录操作开始
logger.info('开始下载视频', { url, formatId });

try {
  const result = await downloadVideo(url, formatId);
  
  // 记录成功
  logger.info('视频下载完成', { 
    taskId: result.taskId,
    duration: result.duration 
  });
} catch (error) {
  // 记录错误（包含上下文信息）
  logger.error('视频下载失败', error as Error, {
    url,
    formatId,
    timestamp: Date.now(),
  });
}
```

### 5. 在全局错误边界中处理未捕获的错误

应用已经在 `App.tsx` 中配置了全局错误边界，它会：
- 捕获所有未处理的 React 错误
- 显示友好的错误界面
- 提供重试和重新加载选项
- 记录错误日志

## 需求映射

本错误处理系统满足以下需求：

- **需求 8.1**：结构化错误信息 - 通过 `TauriCommandError` 和统一的错误处理
- **需求 8.2**：用户友好的错误消息 - 通过 Toast 和 ErrorDialog
- **需求 8.3**：yt-dlp 错误提示 - 在 tauriApi 中处理
- **需求 8.4**：磁盘空间检测 - 可以在下载前检查
- **需求 8.5**：详细日志记录 - 通过 logger 工具

## 示例：完整的错误处理流程

```typescript
import { useErrorHandler } from '@/hooks/use-error-handler';
import { ErrorDialog } from '@/components/ErrorDialog';
import logger from '@/utils/logger';

function DownloadComponent() {
  const { withRetry } = useErrorHandler();
  const [errorDialog, setErrorDialog] = useState({ open: false, message: '' });

  const handleDownload = async (url: string) => {
    logger.info('开始下载', { url });

    // 使用重试机制下载
    const result = await withRetry(
      () => downloadVideo(url),
      {
        title: '下载失败',
        customMessage: '无法下载视频，正在重试...',
        maxRetries: 3,
        retryDelay: 2000,
      }
    );

    if (result) {
      logger.info('下载成功', { taskId: result.taskId });
      
      // 显示成功通知
      toast({
        title: '下载开始',
        description: '视频正在下载中',
      });
    } else {
      // 显示详细错误对话框
      setErrorDialog({
        open: true,
        message: '下载失败，请检查网络连接或稍后重试',
      });
    }
  };

  return (
    <>
      <Button onClick={() => handleDownload(url)}>
        下载视频
      </Button>

      <ErrorDialog
        open={errorDialog.open}
        onClose={() => setErrorDialog({ ...errorDialog, open: false })}
        message={errorDialog.message}
        onRetry={() => handleDownload(url)}
      />
    </>
  );
}
```

## 调试和监控

### 查看日志

```typescript
import logger from '@/utils/logger';

// 获取所有日志
const allLogs = logger.getLogs();

// 获取错误日志
const errorLogs = logger.getLogsByLevel(LogLevel.ERROR);

// 导出日志文件
logger.downloadLogs();

// 清空日志
logger.clearLogs();
```

### 日志格式

日志条目包含以下信息：
- `level`: 日志级别（DEBUG, INFO, WARN, ERROR）
- `timestamp`: 时间戳
- `message`: 日志消息
- `data`: 附加数据（可选）
- `error`: 错误对象（可选）

## 总结

通过使用这些错误处理和用户反馈工具，你可以：

1. ✅ 提供一致的错误处理体验
2. ✅ 给用户清晰的错误提示
3. ✅ 自动重试临时性错误
4. ✅ 记录详细的调试日志
5. ✅ 优雅地处理应用崩溃

记住：好的错误处理不仅仅是捕获错误，更重要的是给用户提供有用的信息和解决方案。
