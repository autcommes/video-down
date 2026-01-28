/**
 * 错误处理 Hook 测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useErrorHandler } from './use-error-handler';

// 创建一个简单的 TauriCommandError 类用于测试
class TauriCommandError extends Error {
  constructor(message: string, public readonly command: string) {
    super(message);
    this.name = 'TauriCommandError';
  }
}

// Mock useToast
vi.mock('./use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('useErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 清除控制台输出
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('handleError', () => {
    it('应该处理 TauriCommandError', () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new TauriCommandError('命令失败', 'test_command');

      const message = result.current.handleError(error);

      expect(message).toBe('命令失败');
    });

    it('应该处理普通 Error', () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new Error('测试错误');

      const message = result.current.handleError(error);

      expect(message).toBe('测试错误');
    });

    it('应该处理字符串错误', () => {
      const { result } = renderHook(() => useErrorHandler());

      const message = result.current.handleError('字符串错误');

      expect(message).toBe('字符串错误');
    });

    it('应该使用自定义消息', () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new Error('原始错误');

      const message = result.current.handleError(error, {
        customMessage: '自定义消息',
      });

      expect(message).toBe('自定义消息');
    });
  });

  describe('handleAsyncError', () => {
    it('应该返回成功的结果', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const asyncFn = vi.fn().mockResolvedValue('成功');

      const value = await result.current.handleAsyncError(asyncFn);

      expect(value).toBe('成功');
      expect(asyncFn).toHaveBeenCalledTimes(1);
    });

    it('应该处理错误并返回 null', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const asyncFn = vi.fn().mockRejectedValue(new Error('失败'));

      const value = await result.current.handleAsyncError(asyncFn);

      expect(value).toBeNull();
      expect(asyncFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('withRetry', () => {
    it('应该在第一次尝试成功时返回结果', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const asyncFn = vi.fn().mockResolvedValue('成功');

      const value = await result.current.withRetry(asyncFn, {
        maxRetries: 3,
      });

      expect(value).toBe('成功');
      expect(asyncFn).toHaveBeenCalledTimes(1);
    });

    it('应该在失败后重试', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const asyncFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('失败1'))
        .mockRejectedValueOnce(new Error('失败2'))
        .mockResolvedValue('成功');

      const value = await act(async () => {
        return await result.current.withRetry(asyncFn, {
          maxRetries: 3,
          retryDelay: 10, // 使用短延迟加快测试
        });
      });

      expect(value).toBe('成功');
      expect(asyncFn).toHaveBeenCalledTimes(3);
    });

    it('应该在所有重试失败后返回 null', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const asyncFn = vi.fn().mockRejectedValue(new Error('失败'));

      const value = await act(async () => {
        return await result.current.withRetry(asyncFn, {
          maxRetries: 2,
          retryDelay: 10,
        });
      });

      expect(value).toBeNull();
      expect(asyncFn).toHaveBeenCalledTimes(2);
    });
  });
});
