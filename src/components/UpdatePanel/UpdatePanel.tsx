/**
 * UpdatePanel 容器组件
 * 管理 yt-dlp 版本检查和更新功能
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VersionInfo } from './VersionInfo';
import { tauriApi } from '@/services/tauriApi';
import type { UpdateInfo, UpdateProgress } from '@/types';
import logger from '@/utils/logger';

export const UpdatePanel: React.FC = () => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<UpdateProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updateComplete, setUpdateComplete] = useState(false);

  // 检查更新
  const handleCheckUpdate = useCallback(async () => {
    try {
      setIsChecking(true);
      setError(null);
      setUpdateComplete(false);
      
      const info = await tauriApi.update.checkYtdlpUpdate();
      setUpdateInfo(info);
      logger.info('更新检查完成', { hasUpdate: info.hasUpdate, latestVersion: info.latestVersion });
    } catch (err) {
      const message = err instanceof Error ? err.message : '检查更新失败';
      setError(message);
      logger.error('更新检查失败', err instanceof Error ? err : undefined);
    } finally {
      setIsChecking(false);
    }
  }, []);

  // 执行更新
  const handleUpdate = useCallback(async () => {
    if (!updateInfo?.hasUpdate) {
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);
      setUpdateProgress(null);
      setUpdateComplete(false);

      // 监听更新进度
      const unlisten = await tauriApi.event.onUpdateProgress((progress) => {
        setUpdateProgress(progress);
      });

      try {
        await tauriApi.update.updateYtdlp();
        setUpdateComplete(true);
        logger.info('yt-dlp 更新完成');
        
        // 更新完成后重新获取版本信息
        const newInfo = await tauriApi.update.checkYtdlpUpdate();
        setUpdateInfo(newInfo);
      } finally {
        unlisten();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新失败';
      setError(message);
      logger.error('更新失败', err instanceof Error ? err : undefined);
    } finally {
      setIsUpdating(false);
      setUpdateProgress(null);
    }
  }, [updateInfo]);

  // 组件挂载时获取当前版本
  useEffect(() => {
    const loadVersion = async () => {
      try {
        const version = await tauriApi.update.getYtdlpVersion();
        setUpdateInfo({
          currentVersion: version,
          latestVersion: '',
          hasUpdate: false,
          downloadUrl: '',
          releaseNotes: '',
        });
        logger.info('yt-dlp 版本加载完成', { version });
      } catch (err) {
        logger.error('获取版本失败', err instanceof Error ? err : undefined);
      }
    };

    loadVersion();
  }, []);

  // 渲染更新进度
  const renderUpdateProgress = () => {
    if (!updateProgress) {
      return null;
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>下载进度</span>
          <span className="font-medium">{updateProgress.percent.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${updateProgress.percent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{updateProgress.downloaded}</span>
          <span>{updateProgress.total}</span>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>yt-dlp 版本管理</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 版本信息 */}
        {updateInfo && (
          <VersionInfo
            currentVersion={updateInfo.currentVersion}
            latestVersion={updateInfo.latestVersion || undefined}
            hasUpdate={updateInfo.hasUpdate}
            releaseNotes={updateInfo.releaseNotes || undefined}
          />
        )}

        {/* 错误提示 */}
        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* 更新完成提示 */}
        {updateComplete && (
          <div className="bg-green-500/10 text-green-700 dark:text-green-400 px-4 py-3 rounded-md text-sm">
            ✓ 更新完成！yt-dlp 已更新到最新版本
          </div>
        )}

        {/* 更新进度 */}
        {isUpdating && renderUpdateProgress()}

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleCheckUpdate}
            disabled={isChecking || isUpdating}
          >
            {isChecking ? '检查中...' : '检查更新'}
          </Button>

          {updateInfo?.hasUpdate && (
            <Button
              onClick={handleUpdate}
              disabled={isUpdating || isChecking}
            >
              {isUpdating ? '更新中...' : '立即更新'}
            </Button>
          )}
        </div>

        {/* 提示信息 */}
        <div className="text-xs text-muted-foreground">
          yt-dlp 是视频下载的核心工具，保持最新版本可以获得更好的兼容性和功能支持。
        </div>
      </CardContent>
    </Card>
  );
};

export default UpdatePanel;
