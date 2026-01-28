/**
 * UpdatePanel 组件单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UpdatePanel } from './UpdatePanel';
import { tauriApi } from '@/services/tauriApi';
import type { UpdateInfo } from '@/types';

// Mock Tauri API
vi.mock('@/services/tauriApi', () => ({
  tauriApi: {
    update: {
      checkYtdlpUpdate: vi.fn(),
      updateYtdlp: vi.fn(),
      getYtdlpVersion: vi.fn(),
    },
    event: {
      onUpdateProgress: vi.fn(),
    },
  },
}));

describe('UpdatePanel', () => {
  const mockUpdateInfo: UpdateInfo = {
    currentVersion: '2024.01.10',
    latestVersion: '2024.01.15',
    hasUpdate: true,
    downloadUrl: 'https://github.com/yt-dlp/yt-dlp/releases/download/2024.01.15/yt-dlp.exe',
    releaseNotes: '修复了一些 bug\n添加了新功能',
  };

  const mockNoUpdateInfo: UpdateInfo = {
    currentVersion: '2024.01.15',
    latestVersion: '2024.01.15',
    hasUpdate: false,
    downloadUrl: '',
    releaseNotes: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 默认返回当前版本
    vi.mocked(tauriApi.update.getYtdlpVersion).mockResolvedValue('2024.01.10');
  });

  it('应该在挂载时获取当前版本', async () => {
    render(<UpdatePanel />);
    
    await waitFor(() => {
      expect(tauriApi.update.getYtdlpVersion).toHaveBeenCalled();
    });
    
    expect(screen.getByText('2024.01.10')).toBeInTheDocument();
  });

  it('应该在点击检查更新按钮时检查更新', async () => {
    vi.mocked(tauriApi.update.checkYtdlpUpdate).mockResolvedValue(mockUpdateInfo);
    
    render(<UpdatePanel />);
    
    const checkButton = screen.getByRole('button', { name: /检查更新/ });
    fireEvent.click(checkButton);
    
    await waitFor(() => {
      expect(tauriApi.update.checkYtdlpUpdate).toHaveBeenCalled();
    });
    
    expect(screen.getByText('2024.01.15')).toBeInTheDocument();
    expect(screen.getByText('有新版本')).toBeInTheDocument();
  });

  it('应该在有更新时显示更新按钮', async () => {
    vi.mocked(tauriApi.update.checkYtdlpUpdate).mockResolvedValue(mockUpdateInfo);
    
    render(<UpdatePanel />);
    
    const checkButton = screen.getByRole('button', { name: /检查更新/ });
    fireEvent.click(checkButton);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /立即更新/ })).toBeInTheDocument();
    });
  });

  it('应该在没有更新时显示已是最新', async () => {
    vi.mocked(tauriApi.update.checkYtdlpUpdate).mockResolvedValue(mockNoUpdateInfo);
    
    render(<UpdatePanel />);
    
    const checkButton = screen.getByRole('button', { name: /检查更新/ });
    fireEvent.click(checkButton);
    
    await waitFor(() => {
      expect(screen.getByText('已是最新')).toBeInTheDocument();
    });
    
    expect(screen.queryByRole('button', { name: /立即更新/ })).not.toBeInTheDocument();
  });

  it('应该在检查更新时显示加载状态', async () => {
    vi.mocked(tauriApi.update.checkYtdlpUpdate).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockUpdateInfo), 100))
    );
    
    render(<UpdatePanel />);
    
    const checkButton = screen.getByRole('button', { name: /检查更新/ });
    fireEvent.click(checkButton);
    
    expect(screen.getByRole('button', { name: /检查中.../ })).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /检查更新/ })).toBeInTheDocument();
    });
  });

  it('应该在检查更新失败时显示错误信息', async () => {
    vi.mocked(tauriApi.update.checkYtdlpUpdate).mockRejectedValue(
      new Error('网络连接失败')
    );
    
    render(<UpdatePanel />);
    
    const checkButton = screen.getByRole('button', { name: /检查更新/ });
    fireEvent.click(checkButton);
    
    await waitFor(() => {
      expect(screen.getByText(/网络连接失败/)).toBeInTheDocument();
    });
  });

  it('应该在点击更新按钮时执行更新', async () => {
    vi.mocked(tauriApi.update.checkYtdlpUpdate).mockResolvedValue(mockUpdateInfo);
    vi.mocked(tauriApi.update.updateYtdlp).mockResolvedValue(undefined);
    vi.mocked(tauriApi.event.onUpdateProgress).mockResolvedValue(() => {});
    
    render(<UpdatePanel />);
    
    // 先检查更新
    const checkButton = screen.getByRole('button', { name: /检查更新/ });
    fireEvent.click(checkButton);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /立即更新/ })).toBeInTheDocument();
    });
    
    // 点击更新
    const updateButton = screen.getByRole('button', { name: /立即更新/ });
    fireEvent.click(updateButton);
    
    await waitFor(() => {
      expect(tauriApi.update.updateYtdlp).toHaveBeenCalled();
    });
  });

  it('应该在更新完成时显示成功提示', async () => {
    vi.mocked(tauriApi.update.checkYtdlpUpdate)
      .mockResolvedValueOnce(mockUpdateInfo)
      .mockResolvedValueOnce(mockNoUpdateInfo);
    vi.mocked(tauriApi.update.updateYtdlp).mockResolvedValue(undefined);
    vi.mocked(tauriApi.event.onUpdateProgress).mockResolvedValue(() => {});
    
    render(<UpdatePanel />);
    
    // 先检查更新
    const checkButton = screen.getByRole('button', { name: /检查更新/ });
    fireEvent.click(checkButton);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /立即更新/ })).toBeInTheDocument();
    });
    
    // 点击更新
    const updateButton = screen.getByRole('button', { name: /立即更新/ });
    fireEvent.click(updateButton);
    
    await waitFor(() => {
      expect(screen.getByText(/更新完成/)).toBeInTheDocument();
    });
  });

  it('应该在更新失败时显示错误信息', async () => {
    vi.mocked(tauriApi.update.checkYtdlpUpdate).mockResolvedValue(mockUpdateInfo);
    vi.mocked(tauriApi.update.updateYtdlp).mockRejectedValue(
      new Error('下载失败')
    );
    vi.mocked(tauriApi.event.onUpdateProgress).mockResolvedValue(() => {});
    
    render(<UpdatePanel />);
    
    // 先检查更新
    const checkButton = screen.getByRole('button', { name: /检查更新/ });
    fireEvent.click(checkButton);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /立即更新/ })).toBeInTheDocument();
    });
    
    // 点击更新
    const updateButton = screen.getByRole('button', { name: /立即更新/ });
    fireEvent.click(updateButton);
    
    await waitFor(() => {
      expect(screen.getByText(/下载失败/)).toBeInTheDocument();
    });
  });

  it('应该在更新时显示进度', async () => {
    vi.mocked(tauriApi.update.checkYtdlpUpdate).mockResolvedValue(mockUpdateInfo);
    vi.mocked(tauriApi.update.updateYtdlp).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );
    
    type UpdateProgressCallback = (progress: { percent: number; downloaded: string; total: string }) => void;
    let progressCallback: UpdateProgressCallback | null = null;
    
    vi.mocked(tauriApi.event.onUpdateProgress).mockImplementation((callback: UpdateProgressCallback) => {
      progressCallback = callback;
      return Promise.resolve(() => {});
    });
    
    render(<UpdatePanel />);
    
    // 先检查更新
    const checkButton = screen.getByRole('button', { name: /检查更新/ });
    fireEvent.click(checkButton);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /立即更新/ })).toBeInTheDocument();
    });
    
    // 点击更新
    const updateButton = screen.getByRole('button', { name: /立即更新/ });
    fireEvent.click(updateButton);
    
    // 模拟进度更新
    await waitFor(() => {
      expect(progressCallback).not.toBeNull();
    });
    
    // 使用类型断言确保 TypeScript 知道 progressCallback 不是 null
    expect(progressCallback).toBeDefined();
    progressCallback!({
      percent: 50,
      downloaded: '5MB',
      total: '10MB',
    });
    
    await waitFor(() => {
      expect(screen.getByText('50.0%')).toBeInTheDocument();
      expect(screen.getByText('5MB')).toBeInTheDocument();
      expect(screen.getByText('10MB')).toBeInTheDocument();
    });
  });
});
