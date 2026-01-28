/**
 * HistoryItem 组件单元测试
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { HistoryItem } from './HistoryItem';
import type { HistoryItem as HistoryItemType } from '@/types';

describe('HistoryItem', () => {
  afterEach(() => {
    cleanup();
  });
  const mockItem: HistoryItemType = {
    id: 'test-id-1',
    title: '测试视频标题',
    url: 'https://youtube.com/watch?v=test',
    resolution: '1080p',
    filePath: '/path/to/video.mp4',
    fileSize: 104857600, // 100 MB
    downloadedAt: Math.floor(Date.now() / 1000) - 3600, // 1 小时前
    fileExists: true,
  };

  it('应该正确渲染历史记录项', () => {
    const onOpenFile = vi.fn();
    render(<HistoryItem item={mockItem} onOpenFile={onOpenFile} />);

    expect(screen.getByText('测试视频标题')).toBeInTheDocument();
    expect(screen.getByText('1080p')).toBeInTheDocument();
    expect(screen.getByText('100.00 MB')).toBeInTheDocument();
  });

  it('应该在点击打开按钮时调用回调', () => {
    const onOpenFile = vi.fn();
    render(<HistoryItem item={mockItem} onOpenFile={onOpenFile} />);

    const openButton = screen.getByRole('button', { name: /打开/ });
    fireEvent.click(openButton);

    expect(onOpenFile).toHaveBeenCalledWith('/path/to/video.mp4');
  });

  it('应该在文件不存在时禁用打开按钮', () => {
    const onOpenFile = vi.fn();
    const itemWithMissingFile = { ...mockItem, fileExists: false };
    render(<HistoryItem item={itemWithMissingFile} onOpenFile={onOpenFile} />);

    const openButton = screen.getByRole('button', { name: /打开/ });
    expect(openButton).toBeDisabled();
    expect(screen.getByText('⚠️ 文件不存在')).toBeInTheDocument();
  });

  it('应该正确格式化文件大小', () => {
    const onOpenFile = vi.fn();
    const testCases = [
      { fileSize: 0, expected: '0 B' },
      { fileSize: 1024, expected: '1.00 KB' },
      { fileSize: 1048576, expected: '1.00 MB' },
      { fileSize: 1073741824, expected: '1.00 GB' },
    ];

    testCases.forEach(({ fileSize, expected }) => {
      const { unmount } = render(
        <HistoryItem item={{ ...mockItem, fileSize }} onOpenFile={onOpenFile} />
      );
      expect(screen.getByText(expected)).toBeInTheDocument();
      unmount();
    });
  });

  it('应该显示相对时间（小于 1 天）', () => {
    const onOpenFile = vi.fn();
    const now = Math.floor(Date.now() / 1000);
    
    // 1 小时前
    const { unmount: unmount1 } = render(
      <HistoryItem
        item={{ ...mockItem, downloadedAt: now - 3600 }}
        onOpenFile={onOpenFile}
      />
    );
    expect(screen.getByText(/小时前/)).toBeInTheDocument();
    unmount1();

    // 30 分钟前
    const { unmount: unmount2 } = render(
      <HistoryItem
        item={{ ...mockItem, downloadedAt: now - 1800 }}
        onOpenFile={onOpenFile}
      />
    );
    expect(screen.getByText(/分钟前/)).toBeInTheDocument();
    unmount2();
  });
});
