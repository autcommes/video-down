import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { ResolutionSelect } from './ResolutionSelect';
import { Format } from '@/types';

describe('ResolutionSelect', () => {
  afterEach(() => {
    cleanup();
  });
  const mockFormats: Format[] = [
    {
      formatId: '137',
      resolution: '1920x1080',
      ext: 'mp4',
      filesize: 104857600, // 100 MB
      fps: 30,
      vcodec: 'avc1',
      acodec: 'none',
    },
    {
      formatId: '136',
      resolution: '1280x720',
      ext: 'mp4',
      filesize: 52428800, // 50 MB
      fps: 30,
      vcodec: 'avc1',
      acodec: 'mp4a',
    },
    {
      formatId: '135',
      resolution: '854x480',
      ext: 'mp4',
      filesize: 26214400, // 25 MB
      fps: 30,
      vcodec: 'avc1',
      acodec: 'mp4a',
    },
    {
      formatId: '134',
      resolution: '640x360',
      ext: 'mp4',
      filesize: 13107200, // 12.5 MB
      fps: 30,
      vcodec: 'avc1',
      acodec: 'mp4a',
    },
  ];

  it('应该渲染分辨率选择器', () => {
    const onChange = vi.fn();
    render(
      <ResolutionSelect
        formats={mockFormats}
        value=""
        onChange={onChange}
      />
    );

    expect(screen.getByLabelText('选择分辨率')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('应该自动选择 1080p 作为默认分辨率', async () => {
    const onChange = vi.fn();
    
    render(
      <ResolutionSelect
        formats={mockFormats}
        value=""
        onChange={onChange}
      />
    );

    // 等待自动选择
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('137'); // 1080p 的 formatId
    });
  });

  it('当没有 1080p 时应该选择最接近的分辨率', async () => {
    const formatsWithout1080p: Format[] = [
      {
        formatId: '136',
        resolution: '1280x720',
        ext: 'mp4',
        filesize: 52428800,
        fps: 30,
        vcodec: 'avc1',
        acodec: 'mp4a',
      },
      {
        formatId: '135',
        resolution: '854x480',
        ext: 'mp4',
        filesize: 26214400,
        fps: 30,
        vcodec: 'avc1',
        acodec: 'mp4a',
      },
    ];

    const onChange = vi.fn();
    
    render(
      <ResolutionSelect
        formats={formatsWithout1080p}
        value=""
        onChange={onChange}
      />
    );

    // 应该选择 720p（最接近 1080p）
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('136');
    });
  });

  it('当格式列表为空时应该显示提示信息', () => {
    const onChange = vi.fn();
    
    render(
      <ResolutionSelect
        formats={[]}
        value=""
        onChange={onChange}
      />
    );

    expect(screen.getByText('暂无可用的分辨率选项')).toBeInTheDocument();
  });

  it('应该在禁用状态下不可交互', () => {
    const onChange = vi.fn();
    
    render(
      <ResolutionSelect
        formats={mockFormats}
        value="137"
        onChange={onChange}
        disabled={true}
      />
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDisabled();
  });

  it('应该在有选中值时显示对应的分辨率', () => {
    const onChange = vi.fn();
    
    render(
      <ResolutionSelect
        formats={mockFormats}
        value="137"
        onChange={onChange}
      />
    );

    // 选中的值应该显示在触发器中
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveTextContent('1080p');
  });

  it('应该正确处理onChange回调', () => {
    const onChange = vi.fn();
    
    const { rerender } = render(
      <ResolutionSelect
        formats={mockFormats}
        value=""
        onChange={onChange}
      />
    );

    // 验证自动选择调用了onChange
    expect(onChange).toHaveBeenCalled();
    
    // 清除之前的调用
    onChange.mockClear();
    
    // 模拟用户手动更改选择
    rerender(
      <ResolutionSelect
        formats={mockFormats}
        value="136"
        onChange={onChange}
      />
    );
    
    // 当value改变时，不应该再次调用onChange（因为已经有值了）
    expect(onChange).not.toHaveBeenCalled();
  });
});
