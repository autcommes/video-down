/**
 * 错误对话框组件
 * 用于显示详细的错误信息和提供操作选项
 * 需求：8.2, 8.3, 8.4
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface ErrorDialogProps {
  /** 是否显示对话框 */
  open: boolean;
  /** 关闭对话框回调 */
  onClose: () => void;
  /** 错误标题 */
  title?: string;
  /** 错误消息 */
  message: string;
  /** 错误详情 */
  details?: string;
  /** 重试回调 */
  onRetry?: () => void | Promise<void>;
  /** 是否显示重新加载按钮 */
  showReload?: boolean;
}

/**
 * 错误对话框组件
 */
export function ErrorDialog({
  open,
  onClose,
  title = '发生错误',
  message,
  details,
  onRetry,
  showReload = false,
}: ErrorDialogProps) {
  const handleRetry = async () => {
    if (onRetry) {
      await onRetry();
      onClose();
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <span className="text-destructive text-xl">⚠</span>
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-destructive">{title}</DialogTitle>
              <DialogDescription className="mt-2">
                {message}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {details && (
          <div className="mt-4">
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                查看详细信息
              </summary>
              <div className="mt-2 p-3 bg-muted rounded-md">
                <pre className="text-xs font-mono whitespace-pre-wrap break-all text-muted-foreground">
                  {details}
                </pre>
              </div>
            </details>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
          {onRetry && (
            <Button onClick={handleRetry}>
              重试
            </Button>
          )}
          {showReload && (
            <Button variant="secondary" onClick={handleReload}>
              重新加载应用
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
