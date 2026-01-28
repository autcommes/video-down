/**
 * UrlInput 组件单元测试
 * 
 * 测试范围：
 * - 有效 URL 提交
 * - 无效 URL 错误提示
 * 
 * 需求：1.1, 1.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UrlInput } from './UrlInput';

describe('UrlInput', () => {
  let mockOnSubmit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnSubmit = vi.fn();
  });

  describe('有效 URL 提交', () => {
    it('应该在输入有效的 HTTP URL 时调用 onSubmit', () => {
      render(<UrlInput onSubmit={mockOnSubmit} />);
      
      const input = screen.getByLabelText('视频链接输入框');
      const button = screen.getByRole('button', { name: /获取信息/ });
      
      // 输入有效的 HTTP URL
      fireEvent.change(input, { 
        target: { value: 'http://youtube.com/watch?v=test123' } 
      });
      
      // 提交表单
      fireEvent.click(button);
      
      // 验证 onSubmit 被调用且参数正确
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith('http://youtube.com/watch?v=test123');
    });

    it('应该在输入有效的 HTTPS URL 时调用 onSubmit', () => {
      render(<UrlInput onSubmit={mockOnSubmit} />);
      
      const input = screen.getByLabelText('视频链接输入框');
      const button = screen.getByRole('button', { name: /获取信息/ });
      
      // 输入有效的 HTTPS URL
      fireEvent.change(input, { 
        target: { value: 'https://www.bilibili.com/video/BV1234567890' } 
      });
      
      // 提交表单
      fireEvent.click(button);
      
      // 验证 onSubmit 被调用且参数正确
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith('https://www.bilibili.com/video/BV1234567890');
    });

    it('应该在输入带有空格的有效 URL 时自动去除空格并提交', () => {
      render(<UrlInput onSubmit={mockOnSubmit} />);
      
      const input = screen.getByLabelText('视频链接输入框');
      const button = screen.getByRole('button', { name: /获取信息/ });
      
      // 输入带有前后空格的 URL
      fireEvent.change(input, { 
        target: { value: '  https://twitter.com/user/status/123456  ' } 
      });
      
      // 提交表单
      fireEvent.click(button);
      
      // 验证 onSubmit 被调用且参数已去除空格
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith('https://twitter.com/user/status/123456');
    });

    it('应该支持各种视频网站的 URL 格式', () => {
      const testUrls = [
        'https://youtube.com/watch?v=abc123',
        'https://www.youtube.com/watch?v=abc123',
        'https://youtu.be/abc123',
        'https://bilibili.com/video/BV1234567890',
        'https://twitter.com/user/status/123456',
        'https://tiktok.com/@user/video/123456',
        'http://example.com/video',
      ];

      testUrls.forEach((url) => {
        mockOnSubmit.mockClear();
        const { unmount } = render(<UrlInput onSubmit={mockOnSubmit} />);
        
        const input = screen.getByLabelText('视频链接输入框');
        const button = screen.getByRole('button', { name: /获取信息/ });
        
        fireEvent.change(input, { target: { value: url } });
        fireEvent.click(button);
        
        expect(mockOnSubmit).toHaveBeenCalledWith(url);
        unmount();
      });
    });
  });

  describe('无效 URL 错误提示', () => {
    it('应该在输入为空时显示错误提示', () => {
      render(<UrlInput onSubmit={mockOnSubmit} />);
      
      const input = screen.getByLabelText('视频链接输入框');
      const form = input.closest('form')!;
      
      // 输入一个字符使按钮启用，然后清空
      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.change(input, { target: { value: '' } });
      
      // 尝试提交空表单
      fireEvent.submit(form);
      
      // 验证显示错误提示
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('请输入视频链接');
      
      // 验证 onSubmit 未被调用
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('应该在输入只包含空格时显示错误提示', () => {
      render(<UrlInput onSubmit={mockOnSubmit} />);
      
      const input = screen.getByLabelText('视频链接输入框');
      const form = input.closest('form')!;
      
      // 输入只包含空格
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.submit(form);
      
      // 验证显示错误提示
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('请输入视频链接');
      
      // 验证 onSubmit 未被调用
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('应该在输入不包含 http:// 或 https:// 的 URL 时显示错误提示', () => {
      render(<UrlInput onSubmit={mockOnSubmit} />);
      
      const input = screen.getByLabelText('视频链接输入框');
      const button = screen.getByRole('button', { name: /获取信息/ });
      
      // 输入不包含协议的 URL
      fireEvent.change(input, { target: { value: 'youtube.com/watch?v=test' } });
      fireEvent.click(button);
      
      // 验证显示错误提示
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('请输入有效的 HTTP 或 HTTPS 链接');
      
      // 验证 onSubmit 未被调用
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('应该在输入无效协议的 URL 时显示错误提示', () => {
      const invalidUrls = [
        'ftp://example.com/video',
        'file:///path/to/video',
        'javascript:alert(1)',
        'data:text/html,<h1>test</h1>',
      ];

      invalidUrls.forEach((url) => {
        mockOnSubmit.mockClear();
        const { unmount } = render(<UrlInput onSubmit={mockOnSubmit} />);
        
        const input = screen.getByLabelText('视频链接输入框');
        const button = screen.getByRole('button', { name: /获取信息/ });
        
        fireEvent.change(input, { target: { value: url } });
        fireEvent.click(button);
        
        // 验证显示错误提示
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toHaveTextContent('请输入有效的 HTTP 或 HTTPS 链接');
        
        // 验证 onSubmit 未被调用
        expect(mockOnSubmit).not.toHaveBeenCalled();
        
        unmount();
      });
    });

    it('应该在输入纯文本时显示错误提示', () => {
      render(<UrlInput onSubmit={mockOnSubmit} />);
      
      const input = screen.getByLabelText('视频链接输入框');
      const button = screen.getByRole('button', { name: /获取信息/ });
      
      // 输入纯文本
      fireEvent.change(input, { target: { value: 'not a url at all' } });
      fireEvent.click(button);
      
      // 验证显示错误提示
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('请输入有效的 HTTP 或 HTTPS 链接');
      
      // 验证 onSubmit 未被调用
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('应该在用户开始输入时清除错误提示', () => {
      render(<UrlInput onSubmit={mockOnSubmit} />);
      
      const input = screen.getByLabelText('视频链接输入框');
      const form = input.closest('form')!;
      
      // 输入无效内容并提交以触发错误
      fireEvent.change(input, { target: { value: 'invalid' } });
      fireEvent.submit(form);
      expect(screen.getByRole('alert')).toBeInTheDocument();
      
      // 开始输入新内容
      fireEvent.change(input, { target: { value: 'h' } });
      
      // 验证错误提示已清除
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('组件状态和属性', () => {
    it('应该在 isLoading 为 true 时禁用输入和按钮', () => {
      render(<UrlInput onSubmit={mockOnSubmit} isLoading={true} />);
      
      const input = screen.getByLabelText('视频链接输入框');
      const button = screen.getByRole('button', { name: /获取中/ });
      
      expect(input).toBeDisabled();
      expect(button).toBeDisabled();
    });

    it('应该在 disabled 为 true 时禁用输入和按钮', () => {
      render(<UrlInput onSubmit={mockOnSubmit} disabled={true} />);
      
      const input = screen.getByLabelText('视频链接输入框');
      const button = screen.getByRole('button', { name: /获取信息/ });
      
      expect(input).toBeDisabled();
      expect(button).toBeDisabled();
    });

    it('应该在输入为空时禁用提交按钮', () => {
      render(<UrlInput onSubmit={mockOnSubmit} />);
      
      const button = screen.getByRole('button', { name: /获取信息/ });
      
      // 初始状态下按钮应该被禁用
      expect(button).toBeDisabled();
    });

    it('应该在输入非空时启用提交按钮', () => {
      render(<UrlInput onSubmit={mockOnSubmit} />);
      
      const input = screen.getByLabelText('视频链接输入框');
      const button = screen.getByRole('button', { name: /获取信息/ });
      
      // 输入内容
      fireEvent.change(input, { target: { value: 'https://youtube.com/watch?v=test' } });
      
      // 按钮应该被启用
      expect(button).not.toBeDisabled();
    });

    it('应该在有错误时为输入框添加错误样式', () => {
      render(<UrlInput onSubmit={mockOnSubmit} />);
      
      const input = screen.getByLabelText('视频链接输入框');
      const form = input.closest('form')!;
      
      // 输入无效内容并提交以触发错误
      fireEvent.change(input, { target: { value: 'invalid' } });
      fireEvent.submit(form);
      
      // 验证输入框有错误样式
      expect(input).toHaveClass('border-red-500');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });
});
