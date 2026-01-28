import { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

/**
 * URL 输入组件
 * 
 * 功能：
 * - 提供 URL 输入框
 * - 基本的 HTTP/HTTPS 格式验证
 * - 提交处理
 * 
 * 需求：1.1, 1.4
 */
export function UrlInput({ onSubmit, isLoading = false, disabled = false }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  /**
   * 验证 URL 格式（基本 HTTP/HTTPS 检查）
   */
  const validateUrl = (input: string): boolean => {
    if (!input.trim()) {
      setError('请输入视频链接');
      return false;
    }

    // 基本的 HTTP/HTTPS 检查
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(input.trim())) {
      setError('请输入有效的 HTTP 或 HTTPS 链接');
      return false;
    }

    setError('');
    return true;
  };

  /**
   * 处理表单提交
   */
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const trimmedUrl = url.trim();
    if (validateUrl(trimmedUrl)) {
      onSubmit(trimmedUrl);
    }
  };

  /**
   * 处理输入变化
   */
  const handleChange = (value: string) => {
    setUrl(value);
    // 清除错误信息（当用户开始输入时）
    if (error) {
      setError('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="输入视频链接（支持 YouTube、Bilibili、Twitter 等 1000+ 网站）"
            value={url}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled || isLoading}
            className={error ? 'border-red-500 focus-visible:ring-red-500' : ''}
            aria-label="视频链接输入框"
            aria-invalid={!!error}
            aria-describedby={error ? 'url-error' : undefined}
          />
        </div>
        <Button 
          type="submit" 
          disabled={disabled || isLoading || !url.trim()}
          className="min-w-[100px]"
        >
          {isLoading ? '获取中...' : '获取信息'}
        </Button>
      </div>
      {error && (
        <p id="url-error" className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
