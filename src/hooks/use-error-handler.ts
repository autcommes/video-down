/**
 * 错误处理 Hook
 * 提供统一的错误处理和用户反馈机制
 * 需求：8.1, 8.2, 8.3, 8.4
 */

import { useCallback } from 'react';
import { useToast } from './use-toast';
import { TauriCommandError } from '@/services/tauriApi';

/**
 * 错误处理选项
 */
export interface ErrorHandlerOptions {
  /** 是否显示 Toast 通知 */
  showToast?: boolean;
  /** 自定义错误消息 */
  customMessage?: string;
  /** 错误标题 */
  title?: string;
  /** 是否记录到控制台 */
  logToConsole?: boolean;
  /** 重试回调函数 */
  onRetry?: () => void | Promise<void>;
}

/**
 * 错误处理 Hook
 */
export function useErrorHandler() {
  const { toast } = useToast();

  /**
   * 处理错误
   */
  const handleError = useCallback(
    (error: unknown, options: ErrorHandlerOptions = {}) => {
      const {
        showToast = true,
        customMessage,
        title = '操作失败',
        logToConsole = true,
        onRetry,
      } = options;

      // 提取错误消息
      let errorMessage: string;
      let errorDetails: string | undefined;

      if (error instanceof TauriCommandError) {
        errorMessage = customMessage || error.message;
        errorDetails = `命令: ${error.command}`;
      } else if (error instanceof Error) {
        errorMessage = customMessage || error.message;
        errorDetails = error.stack;
      } else if (typeof error === 'string') {
        errorMessage = customMessage || error;
      } else {
        errorMessage = customMessage || '发生未知错误';
      }

      // 记录到控制台（需求 8.5）
      if (logToConsole) {
        console.error('[错误处理]', {
          title,
          message: errorMessage,
          details: errorDetails,
          timestamp: new Date().toISOString(),
          error,
        });
      }

      // 显示 Toast 通知（需求 8.2）
      if (showToast) {
        toast({
          variant: 'destructive',
          title,
          description: errorMessage + (onRetry ? ' (可重试)' : ''),
        });
      }

      return errorMessage;
    },
    [toast]
  );

  /**
   * 处理异步操作的错误
   */
  const handleAsyncError = useCallback(
    async <T>(
      asyncFn: () => Promise<T>,
      options: ErrorHandlerOptions = {}
    ): Promise<T | null> => {
      try {
        return await asyncFn();
      } catch (error) {
        handleError(error, options);
        return null;
      }
    },
    [handleError]
  );

  /**
   * 创建带重试机制的错误处理器（需求 8.4）
   */
  const withRetry = useCallback(
    async <T>(
      asyncFn: () => Promise<T>,
      options: ErrorHandlerOptions & {
        maxRetries?: number;
        retryDelay?: number;
      } = {}
    ): Promise<T | null> => {
      const { maxRetries = 3, retryDelay = 1000, ...errorOptions } = options;
      let lastError: unknown;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          return await asyncFn();
        } catch (error) {
          lastError = error;
          
          if (attempt < maxRetries - 1) {
            // 等待后重试
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
            console.log(`重试 ${attempt + 1}/${maxRetries - 1}...`);
          }
        }
      }

      // 所有重试都失败
      handleError(lastError, {
        ...errorOptions,
        customMessage: errorOptions.customMessage || `操作失败（已重试 ${maxRetries} 次）`,
      });
      return null;
    },
    [handleError]
  );

  return {
    handleError,
    handleAsyncError,
    withRetry,
  };
}
