/**
 * ErrorDialog 组件测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorDialog } from './ErrorDialog';

describe('ErrorDialog', () => {
  it('应该在 open 为 true 时显示对话框', () => {
    render(
      <ErrorDialog
        open={true}
        onClose={vi.fn()}
        message="测试错误消息"
      />
    );

    expect(screen.getByText('测试错误消息')).toBeInTheDocument();
  });

  it('应该显示自定义标题', () => {
    render(
      <ErrorDialog
        open={true}
        onClose={vi.fn()}
        title="自定义标题"
        message="测试消息"
      />
    );

    expect(screen.getByText('自定义标题')).toBeInTheDocument();
  });

  it('应该在点击关闭按钮时调用 onClose', () => {
    const onClose = vi.fn();
    render(
      <ErrorDialog
        open={true}
        onClose={onClose}
        message="测试消息"
      />
    );

    const closeButton = screen.getByRole('button', { name: /关闭/i });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('应该在提供 onRetry 时显示重试按钮', () => {
    const onRetry = vi.fn();
    render(
      <ErrorDialog
        open={true}
        onClose={vi.fn()}
        message="测试消息"
        onRetry={onRetry}
      />
    );

    const retryButton = screen.getByRole('button', { name: /重试/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('应该在点击重试按钮时调用 onRetry 和 onClose', async () => {
    const onRetry = vi.fn();
    const onClose = vi.fn();
    render(
      <ErrorDialog
        open={true}
        onClose={onClose}
        message="测试消息"
        onRetry={onRetry}
      />
    );

    const retryButton = screen.getByRole('button', { name: /重试/i });
    await fireEvent.click(retryButton);

    // 等待异步操作完成
    await vi.waitFor(() => {
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('应该在 showReload 为 true 时显示重新加载按钮', () => {
    render(
      <ErrorDialog
        open={true}
        onClose={vi.fn()}
        message="测试消息"
        showReload={true}
      />
    );

    const reloadButton = screen.getByRole('button', { name: /重新加载应用/i });
    expect(reloadButton).toBeInTheDocument();
  });

  it('应该显示错误详情', () => {
    render(
      <ErrorDialog
        open={true}
        onClose={vi.fn()}
        message="测试消息"
        details="详细错误信息"
      />
    );

    // 点击展开详情
    const summary = screen.getByText('查看详细信息');
    fireEvent.click(summary);

    expect(screen.getByText('详细错误信息')).toBeInTheDocument();
  });
});
