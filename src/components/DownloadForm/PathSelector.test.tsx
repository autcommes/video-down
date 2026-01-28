import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PathSelector } from './PathSelector';
import { fileSystemApi } from '@/services/tauriApi';
import { useConfigStore } from '@/store/configStore';

// Mock Tauri API
vi.mock('@/services/tauriApi', () => ({
  fileSystemApi: {
    selectFolder: vi.fn(),
  },
}));

// Mock config store
vi.mock('@/store/configStore', () => ({
  useConfigStore: vi.fn(),
}));

describe('PathSelector', () => {
  const mockOnChange = vi.fn();
  const mockUpdateSavePath = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useConfigStore as any).mockReturnValue({
      updateSavePath: mockUpdateSavePath,
    });
  });

  it('应该渲染路径输入框和浏览按钮', () => {
    render(<PathSelector onChange={mockOnChange} />);

    expect(screen.getByLabelText('保存路径')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /浏览/ })).toBeInTheDocument();
  });

  it('应该显示当前路径值', () => {
    const testPath = 'C:\\Users\\Test\\Downloads';
    render(<PathSelector value={testPath} onChange={mockOnChange} />);

    const input = screen.getByLabelText('保存路径') as HTMLInputElement;
    expect(input.value).toBe(testPath);
  });

  it('应该在点击浏览按钮时打开文件夹选择对话框', async () => {
    const selectedPath = 'C:\\Users\\Test\\Videos';
    (fileSystemApi.selectFolder as any).mockResolvedValue(selectedPath);

    render(<PathSelector onChange={mockOnChange} />);

    const browseButton = screen.getByRole('button', { name: /浏览/ });
    fireEvent.click(browseButton);

    await waitFor(() => {
      expect(fileSystemApi.selectFolder).toHaveBeenCalled();
    });
  });

  it('应该在选择文件夹后调用 onChange', async () => {
    const selectedPath = 'C:\\Users\\Test\\Videos';
    (fileSystemApi.selectFolder as any).mockResolvedValue(selectedPath);

    render(<PathSelector onChange={mockOnChange} />);

    const browseButton = screen.getByRole('button', { name: /浏览/ });
    fireEvent.click(browseButton);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(selectedPath);
    });
  });

  it('应该在选择文件夹后保存到配置', async () => {
    const selectedPath = 'C:\\Users\\Test\\Videos';
    (fileSystemApi.selectFolder as any).mockResolvedValue(selectedPath);

    render(<PathSelector onChange={mockOnChange} />);

    const browseButton = screen.getByRole('button', { name: /浏览/ });
    fireEvent.click(browseButton);

    await waitFor(() => {
      expect(mockUpdateSavePath).toHaveBeenCalledWith(selectedPath);
    });
  });

  it('应该在用户取消选择时不调用 onChange', async () => {
    (fileSystemApi.selectFolder as any).mockResolvedValue(null);

    render(<PathSelector onChange={mockOnChange} />);

    const browseButton = screen.getByRole('button', { name: /浏览/ });
    fireEvent.click(browseButton);

    await waitFor(() => {
      expect(fileSystemApi.selectFolder).toHaveBeenCalled();
    });

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('应该在选择文件夹失败时显示错误信息', async () => {
    const errorMessage = '无法访问文件系统';
    (fileSystemApi.selectFolder as any).mockRejectedValue(
      new Error(errorMessage)
    );

    render(<PathSelector onChange={mockOnChange} />);

    const browseButton = screen.getByRole('button', { name: /浏览/ });
    fireEvent.click(browseButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('应该在手动输入路径时调用 onChange', () => {
    render(<PathSelector onChange={mockOnChange} />);

    const input = screen.getByLabelText('保存路径');
    const testPath = 'C:\\Users\\Test\\Downloads';
    
    fireEvent.change(input, { target: { value: testPath } });

    expect(mockOnChange).toHaveBeenCalledWith(testPath);
  });

  it('应该验证 Windows 路径格式', () => {
    render(<PathSelector value="C:\\Users\\Test" onChange={mockOnChange} />);
    
    expect(screen.getByText('视频将保存到此位置')).toBeInTheDocument();
  });

  it('应该验证 Unix 路径格式', () => {
    render(<PathSelector value="/home/user/videos" onChange={mockOnChange} />);
    
    expect(screen.getByText('视频将保存到此位置')).toBeInTheDocument();
  });

  it('应该在路径格式不正确时显示警告', () => {
    render(<PathSelector value="invalid-path" onChange={mockOnChange} />);
    
    expect(screen.getByText('路径格式可能不正确，请确认')).toBeInTheDocument();
  });

  it('应该在禁用时禁用输入框和按钮', () => {
    render(<PathSelector onChange={mockOnChange} disabled={true} />);

    const input = screen.getByLabelText('保存路径');
    const button = screen.getByRole('button', { name: /浏览/ });

    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });

  it('应该在选择文件夹时显示加载状态', async () => {
    let resolveSelect: (value: string) => void;
    const selectPromise = new Promise<string>((resolve) => {
      resolveSelect = resolve;
    });
    (fileSystemApi.selectFolder as any).mockReturnValue(selectPromise);

    render(<PathSelector onChange={mockOnChange} />);

    const browseButton = screen.getByRole('button', { name: /浏览/ });
    fireEvent.click(browseButton);

    // 应该显示加载状态
    await waitFor(() => {
      expect(screen.getByText('选择中...')).toBeInTheDocument();
    });

    // 完成选择
    resolveSelect!('C:\\Users\\Test\\Videos');

    await waitFor(() => {
      expect(screen.getByText('浏览')).toBeInTheDocument();
    });
  });
});
