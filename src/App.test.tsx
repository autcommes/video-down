/**
 * App 主应用组件测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import * as downloadStore from './store/downloadStore';
import * as configStore from './store/configStore';
import { TaskStatus } from './types';

// Mock stores
vi.mock('./store/downloadStore');
vi.mock('./store/configStore');

// Mock Tauri API
vi.mock('./services/tauriApi', () => ({
  tauriApi: {
    download: {
      startDownload: vi.fn(),
      cancelDownload: vi.fn(),
    },
    event: {
      onDownloadProgress: vi.fn(() => Promise.resolve(() => {})),
      onDownloadComplete: vi.fn(() => Promise.resolve(() => {})),
      onDownloadError: vi.fn(() => Promise.resolve(() => {})),
    },
  },
  eventApi: {
    onDownloadProgress: vi.fn(() => Promise.resolve(() => {})),
    onDownloadComplete: vi.fn(() => Promise.resolve(() => {})),
    onDownloadError: vi.fn(() => Promise.resolve(() => {})),
  },
}));

// Mock components
vi.mock('./components/DownloadForm', () => ({
  DownloadForm: () => <div data-testid="download-form">DownloadForm</div>,
}));

vi.mock('./components/ProgressPanel', () => ({
  ProgressPanel: ({ taskId, title }: { taskId: string; title: string }) => (
    <div data-testid={`progress-panel-${taskId}`}>
      ProgressPanel: {title}
    </div>
  ),
}));

vi.mock('./components/HistoryList', () => ({
  HistoryList: () => <div data-testid="history-list">HistoryList</div>,
}));

vi.mock('./components/UpdatePanel', () => ({
  UpdatePanel: () => <div data-testid="update-panel">UpdatePanel</div>,
}));

describe('App', () => {
  const mockLoadConfig = vi.fn();
  const mockUseDownloadStore = vi.fn();
  const mockUseConfigStore = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // 默认 mock 返回值
    mockLoadConfig.mockResolvedValue(undefined);

    mockUseDownloadStore.mockReturnValue({
      tasks: [],
    });

    mockUseConfigStore.mockReturnValue({
      loadConfig: mockLoadConfig,
    });

    // 使用类型断言而不是 any
    vi.mocked(downloadStore.useDownloadStore).mockImplementation(
      mockUseDownloadStore as typeof downloadStore.useDownloadStore
    );
    vi.mocked(configStore.useConfigStore).mockImplementation(
      mockUseConfigStore as typeof configStore.useConfigStore
    );
  });

  it('应该在初始化时显示加载状态', () => {
    render(<App />);

    expect(screen.getByText('正在初始化应用...')).toBeInTheDocument();
  });

  it('应该在初始化完成后显示主界面', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('视频下载工具')).toBeInTheDocument();
    });

    expect(screen.getByTestId('download-form')).toBeInTheDocument();
    expect(screen.getByTestId('history-list')).toBeInTheDocument();
    expect(screen.getByTestId('update-panel')).toBeInTheDocument();
  });

  it('应该调用配置加载函数', async () => {
    render(<App />);

    await waitFor(() => {
      expect(mockLoadConfig).toHaveBeenCalledTimes(1);
    });
  });

  it('应该在初始化失败时显示错误信息', async () => {
    const errorMessage = '配置加载失败';
    mockLoadConfig.mockRejectedValue(new Error(errorMessage));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('初始化失败')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('应该显示活动下载任务的进度面板', async () => {
    mockUseDownloadStore.mockReturnValue({
      tasks: [
        {
          id: 'task-1',
          title: '测试视频 1',
          status: TaskStatus.Downloading,
          url: 'https://example.com/video1',
          formatId: 'format-1',
          savePath: '/path/to/save',
          createdAt: Date.now(),
        },
        {
          id: 'task-2',
          title: '测试视频 2',
          status: TaskStatus.Pending,
          url: 'https://example.com/video2',
          formatId: 'format-2',
          savePath: '/path/to/save',
          createdAt: Date.now(),
        },
      ],
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('视频下载工具')).toBeInTheDocument();
    });

    // 应该显示两个进度面板
    expect(screen.getByTestId('progress-panel-task-1')).toBeInTheDocument();
    expect(screen.getByTestId('progress-panel-task-2')).toBeInTheDocument();

    // 应该显示任务计数
    expect(screen.getByText('2 个任务进行中')).toBeInTheDocument();
  });

  it('应该不显示已完成任务的进度面板', async () => {
    mockUseDownloadStore.mockReturnValue({
      tasks: [
        {
          id: 'task-1',
          title: '测试视频 1',
          status: TaskStatus.Completed,
          url: 'https://example.com/video1',
          formatId: 'format-1',
          savePath: '/path/to/save',
          createdAt: Date.now(),
        },
      ],
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('视频下载工具')).toBeInTheDocument();
    });

    // 不应该显示进度面板
    expect(screen.queryByTestId('progress-panel-task-1')).not.toBeInTheDocument();
    
    // 不应该显示任务计数
    expect(screen.queryByText(/个任务进行中/)).not.toBeInTheDocument();
  });

  it('应该包含页脚信息', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('视频下载工具')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/基于 Tauri \+ React 构建/)
    ).toBeInTheDocument();
  });
});

/**
 * ErrorBoundary 基本测试
 */
describe('ErrorBoundary', () => {
  it('应该正常渲染包装的应用', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('视频下载工具')).toBeInTheDocument();
    });

    // 应用正常渲染，说明 ErrorBoundary 正常工作
    expect(screen.getByTestId('download-form')).toBeInTheDocument();
  });
});
