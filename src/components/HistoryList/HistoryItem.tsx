/**
 * HistoryItem 组件
 * 显示单条历史记录
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { HistoryItem as HistoryItemType } from '@/types';

interface HistoryItemProps {
  /** 历史记录项 */
  item: HistoryItemType;
  /** 打开文件回调 */
  onOpenFile: (filePath: string) => void;
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`;
}

/**
 * 格式化时间戳
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // 小于 1 天显示相对时间
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    if (hours < 1) {
      const minutes = Math.floor(diff / (60 * 1000));
      return minutes < 1 ? '刚刚' : `${minutes} 分钟前`;
    }
    return `${hours} 小时前`;
  }
  
  // 否则显示完整日期
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const HistoryItem: React.FC<HistoryItemProps> = ({ item, onOpenFile }) => {
  const handleOpenFile = () => {
    onOpenFile(item.filePath);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* 左侧信息 */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate mb-1" title={item.title}>
              {item.title}
            </h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>{item.resolution}</span>
              <span>{formatFileSize(item.fileSize)}</span>
              <span>{formatTimestamp(item.downloadedAt)}</span>
            </div>
            {!item.fileExists && (
              <div className="mt-2 text-xs text-destructive">
                ⚠️ 文件不存在
              </div>
            )}
          </div>

          {/* 右侧操作按钮 */}
          <div className="flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenFile}
              disabled={!item.fileExists}
              title={item.fileExists ? '打开文件' : '文件不存在'}
            >
              打开
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HistoryItem;
