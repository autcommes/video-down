/**
 * ProgressBar 组件单元测试
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  afterEach(() => {
    cleanup();
  });
  it('应该渲染进度条', () => {
    render(<ProgressBar percent={50} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

  it('应该显示正确的百分比文本', () => {
    render(<ProgressBar percent={75.5} />);
    
    expect(screen.getByText('75.5%')).toBeInTheDocument();
  });

  it('应该将百分比限制在 0-100 范围内', () => {
    const { rerender } = render(<ProgressBar percent={-10} />);
    let progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    
    rerender(<ProgressBar percent={150} />);
    progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });

  it('应该应用正确的宽度样式', () => {
    render(<ProgressBar percent={60} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveStyle({ width: '60%' });
  });

  it('应该显示下载进度标签', () => {
    render(<ProgressBar percent={30} />);
    
    expect(screen.getByText('下载进度')).toBeInTheDocument();
  });
});
