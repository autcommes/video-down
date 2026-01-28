import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { DownloadForm } from './DownloadForm';
import * as tauriApi from '@/services/tauriApi';
import type { VideoInfo } from '@/types';

// Mock Tauri API
vi.mock('@/services/tauriApi', () => ({
  videoApi: {
    getVideoInfo: vi.fn(),
    downloadVideo: vi.fn(),
  },
  configApi: {
    getConfig: vi.fn(),
    saveConfig: vi.fn(),
  },
  fileSystemApi: {
    selectFolder: vi.fn(),
  },
}));

describe('DownloadForm', () => {
  const mockVideoInfo: VideoInfo = {
    id: 'test-video-id',
    title: '测试视频标题',
    duration: 180,
    thumbnail: 'https://example.com/thumb.jpg',
    uploader: '测试上传者',
    formats: [
      {
        formatId: 'format-1080p',
        resolution: '1920x1080',
        ext: 'mp4',
        filesize: 100000000,
        fps: 30,
        vcodec: 'h264',
        acodec: 'aac',
      },
      {
        formatId: 'format-720p',
        resolution: '1280x720',
        ext: 'mp4',
        filesize: 50000000,
        fps: 30,
        vcodec: 'h264',
        acodec: 'aac',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock config API to return default config
    vi.mocked(tauriApi.configApi.getConfig).mockResolvedValue({
      savePath: '/default/path',
      defaultResolution: '1080p',
      autoCheckUpdate: true,
      concurrentDownloads: 3,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('应该渲染下载表单', () => {
    render(<DownloadForm />);
    
    expect(screen.getByText('视频下载')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/输入视频链接/)).toBeInTheDocument();
  });

  it('应该在提交 URL 后获取视频信息', async () => {
    vi.mocked(tauriApi.videoApi.getVideoInfo).mockResolvedValue(mockVideoInfo);
    
    render(<DownloadForm />);
    
    const input = screen.getByPlaceholderText(/输入视频链接/);
    const submitButton = screen.getByText('获取信息');
    
    fireEvent.change(input, { target: { value: 'https://youtube.com/watch?v=test' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(tauriApi.videoApi.getVideoInfo).toHaveBeenCalledWith('https://youtube.com/watch?v=test');
    });
    
    await waitFor(() => {
      expect(screen.getByText('测试视频标题')).toBeInTheDocument();
    });
  });

  it('应该在获取视频信息失败时显示错误', async () => {
    vi.mocked(tauriApi.videoApi.getVideoInfo).mockRejectedValue(
      new Error('该网站暂不支持')
    );
    
    render(<DownloadForm />);
    
    const input = screen.getByPlaceholderText(/输入视频链接/);
    
    fireEvent.change(input, { target: { value: 'https://unsupported.com/video' } });
    
    // 提交表单
    const form = input.closest('form');
    if (form) {
      fireEvent.submit(form);
    }
    
    await waitFor(() => {
      expect(screen.getByText(/该网站暂不支持/)).toBeInTheDocument();
    });
  });

  it('应该在选择分辨率和路径后启用下载按钮', async () => {
    vi.mocked(tauriApi.videoApi.getVideoInfo).mockResolvedValue(mockVideoInfo);
    
    render(<DownloadForm />);
    
    // 提交 URL
    const input = screen.getByPlaceholderText(/输入视频链接/);
    fireEvent.change(input, { target: { value: 'https://youtube.com/watch?v=test' } });
    
    // 提交表单
    const form = input.closest('form');
    if (form) {
      fireEvent.submit(form);
    }
    
    // 等待视频信息加载
    await waitFor(() => {
      expect(screen.getByText('测试视频标题')).toBeInTheDocument();
    });
    
    // 下载按钮应该存在
    const downloadButton = screen.getByText('开始下载');
    expect(downloadButton).toBeInTheDocument();
  });

  it('应该调用 downloadVideo API 开始下载', async () => {
    vi.mocked(tauriApi.videoApi.getVideoInfo).mockResolvedValue(mockVideoInfo);
    vi.mocked(tauriApi.videoApi.downloadVideo).mockResolvedValue('task-id-123');
    
    render(<DownloadForm />);
    
    // 提交 URL
    const input = screen.getByPlaceholderText(/输入视频链接/);
    fireEvent.change(input, { target: { value: 'https://youtube.com/watch?v=test' } });
    
    // 提交表单
    const form = input.closest('form');
    if (form) {
      fireEvent.submit(form);
    }
    
    // 等待视频信息加载
    await waitFor(() => {
      expect(screen.getByText('测试视频标题')).toBeInTheDocument();
    });
    
    // 点击下载按钮
    const downloadButton = screen.getByText('开始下载');
    fireEvent.click(downloadButton);
    
    await waitFor(() => {
      expect(tauriApi.videoApi.downloadVideo).toHaveBeenCalled();
    });
  });
});
