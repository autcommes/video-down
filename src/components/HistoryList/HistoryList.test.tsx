/**
 * HistoryList 组件单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { HistoryList } from './HistoryList';
import { useHistoryStore } from '@/store/historyStore';
import type { HistoryItem } from '@/types';

// Mock store
vi.mock('@/store/historyStore');

describe('HistoryList', () => {
  const mockItems: HistoryItem[] = [
    {
      id: 'test-1',
      title: '视频 1',
      url: 'https://youtube.com/watch?v=1',
      resolution: '1080p',
      filePath: '/path/to/video1.mp4',
      fileSize: 104857600,
      downloadedAt: Math.floor(Date.now() / 1000),
      fileExists: true,
    },
    {
      id: 'test-2',
      title: '视频 2',
      url: 'https://youtube.com/watch?v=2',
      resolution: '720p',
      filePath: '/path/to/video2.mp4',
      fileSize: 52428800,
      downloadedAt: Math.floor(Date.now() / 1000) - 3600,
      fileExists: false,
    },
  ];

  const mockLoadHistory = vi.fn();
  const mockClearHistory = vi.fn();
  const mockOpenHistoryFile = vi.fn();
  const mockClearError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 默认 mock 实现
    vi.mocked(useHistoryStore).mockReturnValue({
      items: mockItems,
      isLoading: false,
      error: null,
      loadHistory: mockLoadHistory,
      clearHistory: mockClearHistory,
      openHistoryFile: mockOpenHistoryFile,
      clearError: mockClearError,
      addHistoryItem: vi.fn(),
      updateFileExists: vi.fn(),
      refreshFileExistence: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('应该在挂载时加载历史记录', () => {
    render(<HistoryList />);
    expect(mockLoadHistory).toHaveBeenCalled();
  });

  it('应该正确渲染历史记录列表', () => {
    render(<HistoryList />);
    
    expect(screen.getByText('视频 1')).toBeInTheDocument();
    expect(screen.getByText('视频 2')).toBeInTheDocument();
    expect(screen.getByText('共 2 条记录')).toBeInTheDocument();
  });

  it('应该在加载时显示加载状态', () => {
    vi.mocked(useHistoryStore).mockReturnValue({
      items: [],
      isLoading: true,
      error: null,
      loadHistory: mockLoadHistory,
      clearHistory: mockClearHistory,
      openHistoryFile: mockOpenHistoryFile,
      clearError: mockClearError,
      addHistoryItem: vi.fn(),
      updateFileExists: vi.fn(),
      refreshFileExistence: vi.fn(),
    });

    render(<HistoryList />);
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('应该在出错时显示错误信息', () => {
    vi.mocked(useHistoryStore).mockReturnValue({
      items: [],
      isLoading: false,
      error: '加载失败',
      loadHistory: mockLoadHistory,
      clearHistory: mockClearHistory,
      openHistoryFile: mockOpenHistoryFile,
      clearError: mockClearError,
      addHistoryItem: vi.fn(),
      updateFileExists: vi.fn(),
      refreshFileExistence: vi.fn(),
    });

    render(<HistoryList />);
    expect(screen.getByText('加载失败')).toBeInTheDocument();
  });

  it('应该在列表为空时显示空状态', () => {
    vi.mocked(useHistoryStore).mockReturnValue({
      items: [],
      isLoading: false,
      error: null,
      loadHistory: mockLoadHistory,
      clearHistory: mockClearHistory,
      openHistoryFile: mockOpenHistoryFile,
      clearError: mockClearError,
      addHistoryItem: vi.fn(),
      updateFileExists: vi.fn(),
      refreshFileExistence: vi.fn(),
    });

    render(<HistoryList />);
    expect(screen.getByText('暂无下载历史')).toBeInTheDocument();
  });

  it('应该在点击清空按钮时弹出确认对话框', async () => {
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockClearHistory.mockResolvedValue(undefined);

    render(<HistoryList />);
    
    const clearButton = screen.getByRole('button', { name: /清空列表/ });
    fireEvent.click(clearButton);

    expect(confirmSpy).toHaveBeenCalledWith(
      '确定要清空所有历史记录吗？已下载的文件不会被删除。'
    );
    
    await waitFor(() => {
      expect(mockClearHistory).toHaveBeenCalled();
    });

    confirmSpy.mockRestore();
  });

  it('应该在取消确认时不清空历史记录', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<HistoryList />);
    
    const clearButton = screen.getByRole('button', { name: /清空列表/ });
    fireEvent.click(clearButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockClearHistory).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('应该在列表为空时禁用清空按钮', () => {
    vi.mocked(useHistoryStore).mockReturnValue({
      items: [],
      isLoading: false,
      error: null,
      loadHistory: mockLoadHistory,
      clearHistory: mockClearHistory,
      openHistoryFile: mockOpenHistoryFile,
      clearError: mockClearError,
      addHistoryItem: vi.fn(),
      updateFileExists: vi.fn(),
      refreshFileExistence: vi.fn(),
    });

    render(<HistoryList />);
    
    const clearButton = screen.getByRole('button', { name: /清空列表/ });
    expect(clearButton).toBeDisabled();
  });
});
