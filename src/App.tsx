/**
 * App 主应用组件
 * 
 * 功能：
 * - 集成所有子组件（DownloadForm、ProgressPanel、HistoryList、UpdatePanel）
 * - 实现应用布局（使用 Tailwind CSS）
 * - 实现全局错误处理（React Error Boundary）
 * - 实现应用初始化逻辑
 * 
 * 需求：所有需求
 */

import { useEffect, useState, Component, ErrorInfo, ReactNode } from 'react';
import { DownloadForm } from '@/components/DownloadForm';
import { ProgressPanel } from '@/components/ProgressPanel';
import { HistoryList } from '@/components/HistoryList';
import { UpdatePanel } from '@/components/UpdatePanel';
import { Toaster } from '@/components/ui/toaster';
import { useDownloadStore } from '@/store/downloadStore';
import { useConfigStore } from '@/store/configStore';
import { TaskStatus, type HistoryItem } from '@/types';
import logger from '@/utils/logger';

/**
 * 全局错误边界组件
 * 需求 8.1, 8.2：捕获并显示应用错误
 */
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误到日志系统（需求 8.5）
    logger.error('应用错误', error, {
      componentStack: errorInfo.componentStack,
    });
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-2xl w-full bg-card border border-destructive rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <span className="text-destructive text-xl">⚠</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-destructive mb-2">
                  应用发生错误
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  抱歉，应用遇到了一个意外错误。您可以尝试重新加载应用。
                </p>
                
                {this.state.error && (
                  <div className="bg-muted p-3 rounded-md mb-4">
                    <p className="text-sm font-mono text-destructive break-all">
                      {this.state.error.toString()}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={this.handleReset}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    重试
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                  >
                    重新加载应用
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 主应用组件
 */
function App() {
  const { tasks, updateProgress, updateTaskStatus } = useDownloadStore();
  const { loadConfig: loadAppConfig } = useConfigStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  /**
   * 应用初始化逻辑
   * 需求 9.3：应用启动时加载配置
   */
  useEffect(() => {
    const initializeApp = async () => {
      try {
        logger.info('应用初始化开始...');

        // 加载应用配置
        await loadAppConfig();
        logger.info('配置加载完成');

        setIsInitialized(true);
        logger.info('应用初始化完成');
      } catch (error) {
        const message = error instanceof Error ? error.message : '初始化失败';
        setInitError(message);
        logger.error('应用初始化失败', error instanceof Error ? error : undefined, { message });
      }
    };

    initializeApp();
  }, [loadAppConfig]);

  /**
   * 设置下载事件监听器
   * 需求 3.2, 3.3, 3.4：监听下载进度、完成和错误事件
   */
  useEffect(() => {
    if (!isInitialized) return;

    logger.info('设置下载事件监听器...');

    // 导入事件 API
    import('@/services/tauriApi').then(({ eventApi }) => {
      // 监听下载进度
      const setupProgressListener = async () => {
        const unlisten = await eventApi.onDownloadProgress((progress) => {
          logger.info('收到进度更新', { progress });
          
          // 更新进度数据（后端已经使用 camelCase）
          updateProgress(progress);
          
          // 如果进度大于 0，更新状态为下载中
          if (progress.percent > 0) {
            updateTaskStatus(progress.taskId, TaskStatus.Downloading);
          }
        });
        return unlisten;
      };

      // 监听下载完成
      const setupCompleteListener = async () => {
        const unlisten = await eventApi.onDownloadComplete(async (data) => {
          logger.info('下载完成', { taskId: data.taskId, filePath: data.filePath });
          updateTaskStatus(data.taskId, TaskStatus.Completed);
          
          // 保存到历史记录
          try {
            // 从 store 中获取最新的任务信息
            const currentTasks = useDownloadStore.getState().tasks;
            const task = currentTasks.find(t => t.id === data.taskId);
            
            if (task) {
              const { historyApi } = await import('@/services/tauriApi');
              const { useHistoryStore } = await import('@/store/historyStore');
              
              // 构造历史记录项
              const historyItem: HistoryItem = {
                id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: task.title,
                url: task.url,
                resolution: task.formatId,
                filePath: data.filePath,
                fileSize: data.fileSize,
                downloadedAt: Date.now(),
                fileExists: true,
              };
              
              // 保存到后端
              await historyApi.addHistory(historyItem);
              
              // 同时更新前端 store 以立即显示
              useHistoryStore.getState().addHistoryItem(historyItem);
              
              logger.info('历史记录已保存', { historyItem });
            } else {
              logger.warn('未找到任务信息，无法保存历史记录', { taskId: data.taskId });
            }
          } catch (error) {
            logger.error('保存历史记录失败', error instanceof Error ? error : undefined, { 
              taskId: data.taskId,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        });
        return unlisten;
      };

      // 监听下载错误
      const setupErrorListener = async () => {
        const unlisten = await eventApi.onDownloadError((data) => {
          logger.error('下载失败', undefined, { taskId: data.taskId, error: data.error });
          updateTaskStatus(data.taskId, TaskStatus.Failed);
        });
        return unlisten;
      };

      // 设置所有监听器
      Promise.all([
        setupProgressListener(),
        setupCompleteListener(),
        setupErrorListener(),
      ]).then((unlisteners) => {
        logger.info('下载事件监听器已设置');
        
        // 清理函数
        return () => {
          logger.info('清理下载事件监听器...');
          unlisteners.forEach((unlisten) => unlisten());
        };
      });
    });
  }, [isInitialized, updateProgress, updateTaskStatus]);

  /**
   * 获取正在进行的下载任务
   */
  const activeDownloadTasks = tasks.filter(
    (task) =>
      task.status === TaskStatus.Pending ||
      task.status === TaskStatus.Downloading
  );

  /**
   * 渲染初始化错误
   */
  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card border border-destructive rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-destructive">初始化失败</h2>
          <p className="text-sm text-muted-foreground">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  /**
   * 渲染加载状态
   */
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">正在初始化应用...</p>
        </div>
      </div>
    );
  }

  /**
   * 主应用布局
   */
  return (
    <div className="min-h-screen bg-background">
      {/* 头部 */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">视频下载工具</h1>
              <p className="text-sm text-muted-foreground">
                支持 YouTube、Bilibili、Twitter 等 1000+ 视频网站
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              {activeDownloadTasks.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  {activeDownloadTasks.length} 个任务进行中
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：下载表单和进度面板 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 下载表单 */}
            <DownloadForm />

            {/* 活动下载任务进度 */}
            {activeDownloadTasks.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">下载进度</h2>
                {activeDownloadTasks.map((task) => (
                  <ProgressPanel
                    key={task.id}
                    taskId={task.id}
                    title={task.title}
                  />
                ))}
              </div>
            )}

            {/* 下载历史 */}
            <HistoryList height={500} />
          </div>

          {/* 右侧：更新面板 */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <UpdatePanel />
            </div>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="border-t mt-12 py-6 bg-card/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>基于 Tauri + React 构建 | 使用 yt-dlp 作为下载引擎</p>
        </div>
      </footer>

      {/* Toast 通知容器 */}
      <Toaster />
    </div>
  );
}

/**
 * 导出包装了错误边界的应用组件
 */
export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
