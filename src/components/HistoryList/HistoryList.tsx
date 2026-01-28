/**
 * HistoryList 容器组件
 * 管理历史记录列表显示、加载、清空和虚拟滚动
 */

import React, { useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HistoryItem } from './HistoryItem';
import { useHistoryStore } from '@/store/historyStore';

// 虚拟滚动配置（暂时禁用）
// const ITEM_HEIGHT = 100; // 每项高度（像素）
// const VIRTUAL_SCROLL_THRESHOLD = 100; // 超过此数量启用虚拟滚动

interface HistoryListProps {
  /** 容器高度（用于虚拟滚动） */
  height?: number;
}

export const HistoryList: React.FC<HistoryListProps> = ({ height: _height = 600 }) => {
  const {
    items,
    isLoading,
    error,
    loadHistory,
    clearHistory,
    openHistoryFile,
    clearError,
  } = useHistoryStore();

  const [isClearing, setIsClearing] = React.useState(false);

  // 加载历史记录
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // 打开文件处理
  const handleOpenFile = useCallback(
    async (filePath: string) => {
      try {
        await openHistoryFile(filePath);
      } catch (error) {
        console.error('打开文件失败:', error);
        // 错误已经在 store 中处理
      }
    },
    [openHistoryFile]
  );

  // 清空历史记录处理
  const handleClearHistory = async () => {
    if (!confirm('确定要清空所有历史记录吗？已下载的文件不会被删除。')) {
      return;
    }

    try {
      setIsClearing(true);
      await clearHistory();
    } catch (error) {
      console.error('清空历史记录失败:', error);
    } finally {
      setIsClearing(false);
    }
  };

  // 渲染内容
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center text-muted-foreground py-8">
          加载中...
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={clearError}>
            关闭
          </Button>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          暂无下载历史
        </div>
      );
    }

    // 直接渲染所有项（暂时移除虚拟滚动以避免类型问题）
    return (
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {items.map((item) => (
          <HistoryItem key={item.id} item={item} onOpenFile={handleOpenFile} />
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>下载历史</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              共 {items.length} 条记录
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              disabled={isClearing || items.length === 0}
            >
              {isClearing ? '清空中...' : '清空列表'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
};

export default HistoryList;
