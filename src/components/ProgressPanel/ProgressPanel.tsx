/**
 * ProgressPanel 容器组件
 * 管理进度显示、事件监听和取消下载功能
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressBar } from './ProgressBar';
import { ProgressInfo } from './ProgressInfo';
import { useDownloadStore } from '@/store/downloadStore';
import { eventApi, videoApi } from '@/services/tauriApi';
import { TaskStatus } from '@/types';
import type { ProgressData } from '@/types';

interface ProgressPanelProps {
  /** 任务 ID */
  taskId: string;
  /** 视频标题 */
  title: string;
  /** 取消下载回调 */
  onCancel?: () => void;
}

export const ProgressPanel: React.FC<ProgressPanelProps> = ({
  taskId,
  title,
  onCancel,
}) => {
  const { updateProgress, updateTaskStatus, getProgress } = useDownloadStore();
  const [isCancelling, setIsCancelling] = React.useState(false);
  
  // 使用 ref 存储最新的进度数据，用于防抖
  const latestProgressRef = useRef<ProgressData | null>(null);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 获取当前进度
  const progress = getProgress(taskId);

  // 防抖更新函数 (500ms)
  const debouncedUpdate = useCallback((progressData: ProgressData) => {
    latestProgressRef.current = progressData;

    // 清除之前的定时器
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
    }

    // 设置新的定时器
    updateTimerRef.current = setTimeout(() => {
      if (latestProgressRef.current) {
        updateProgress(latestProgressRef.current);
        latestProgressRef.current = null;
      }
    }, 500);
  }, [updateProgress]);

  // 取消下载处理
  const handleCancel = async () => {
    try {
      setIsCancelling(true);
      await videoApi.cancelDownload(taskId);
      updateTaskStatus(taskId, TaskStatus.Cancelled);
      onCancel?.();
    } catch (error) {
      console.error('取消下载失败:', error);
      alert(`取消下载失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsCancelling(false);
    }
  };

  // 监听进度事件
  useEffect(() => {
    let unlistenProgress: (() => void) | null = null;
    let unlistenComplete: (() => void) | null = null;
    let unlistenError: (() => void) | null = null;

    const setupListeners = async () => {
      // 监听进度更新
      unlistenProgress = await eventApi.onDownloadProgress((progressData) => {
        if (progressData.taskId === taskId) {
          debouncedUpdate(progressData);
        }
      });

      // 监听下载完成
      unlistenComplete = await eventApi.onDownloadComplete((data) => {
        if (data.taskId === taskId) {
          // 立即更新最后的进度
          if (latestProgressRef.current) {
            updateProgress(latestProgressRef.current);
          }
          updateTaskStatus(taskId, TaskStatus.Completed);
        }
      });

      // 监听下载错误
      unlistenError = await eventApi.onDownloadError((data) => {
        if (data.taskId === taskId) {
          updateTaskStatus(taskId, TaskStatus.Failed);
          alert(`下载失败: ${data.error}`);
        }
      });
    };

    setupListeners();

    // 清理函数
    return () => {
      // 清理定时器
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
      
      // 如果有待更新的进度，立即更新
      if (latestProgressRef.current) {
        updateProgress(latestProgressRef.current);
      }

      // 取消事件监听
      unlistenProgress?.();
      unlistenComplete?.();
      unlistenError?.();
    };
  }, [taskId, debouncedUpdate, updateProgress, updateTaskStatus]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {progress ? (
          <>
            <ProgressBar percent={progress.percent} />
            <ProgressInfo
              speed={progress.speed}
              downloaded={progress.downloaded}
              total={progress.total}
              eta={progress.eta}
            />
            <div className="flex justify-end">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancel}
                disabled={isCancelling}
              >
                {isCancelling ? '取消中...' : '取消下载'}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500 py-4">
            等待下载开始...
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgressPanel;
