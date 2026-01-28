/**
 * ProgressInfo 组件单元测试
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ProgressInfo } from './ProgressInfo';

describe('ProgressInfo', () => {
  afterEach(() => {
    cleanup();
  });
  const mockProgressData = {
    speed: '2.5MB/s',
    downloaded: '125MB',
    total: '280MB',
    eta: '00:02:30',
  };

  it('应该渲染进度信息', () => {
    render(<ProgressInfo {...mockProgressData} />);
    
    expect(screen.getByText('下载速度')).toBeInTheDocument();
    expect(screen.getByText('预计剩余时间')).toBeInTheDocument();
    expect(screen.getByText('下载大小')).toBeInTheDocument();
  });

  it('应该显示正确的下载速度', () => {
    render(<ProgressInfo {...mockProgressData} />);
    
    expect(screen.getByText('2.5MB/s')).toBeInTheDocument();
  });

  it('应该显示正确的预计剩余时间', () => {
    render(<ProgressInfo {...mockProgressData} />);
    
    expect(screen.getByText('00:02:30')).toBeInTheDocument();
  });

  it('应该显示正确的下载大小', () => {
    render(<ProgressInfo {...mockProgressData} />);
    
    expect(screen.getByText('125MB / 280MB')).toBeInTheDocument();
  });

  it('应该处理不同的数据格式', () => {
    const customData = {
      speed: '1.2GB/s',
      downloaded: '5.5GB',
      total: '10GB',
      eta: '01:30:00',
    };
    
    render(<ProgressInfo {...customData} />);
    
    expect(screen.getByText('1.2GB/s')).toBeInTheDocument();
    expect(screen.getByText('5.5GB / 10GB')).toBeInTheDocument();
    expect(screen.getByText('01:30:00')).toBeInTheDocument();
  });
});
