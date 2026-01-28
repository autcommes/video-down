/**
 * VersionInfo 组件单元测试
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VersionInfo } from './VersionInfo';

describe('VersionInfo', () => {
  it('应该正确显示当前版本', () => {
    render(
      <VersionInfo
        currentVersion="2024.01.10"
        hasUpdate={false}
      />
    );
    
    expect(screen.getByText('当前版本')).toBeInTheDocument();
    expect(screen.getByText('2024.01.10')).toBeInTheDocument();
  });

  it('应该在有更新时显示最新版本和更新标记', () => {
    render(
      <VersionInfo
        currentVersion="2024.01.10"
        latestVersion="2024.01.15"
        hasUpdate={true}
      />
    );
    
    expect(screen.getByText('最新版本')).toBeInTheDocument();
    expect(screen.getByText('2024.01.15')).toBeInTheDocument();
    expect(screen.getByText('有新版本')).toBeInTheDocument();
  });

  it('应该在没有更新时显示已是最新标记', () => {
    render(
      <VersionInfo
        currentVersion="2024.01.15"
        latestVersion="2024.01.15"
        hasUpdate={false}
      />
    );
    
    expect(screen.getByText('已是最新')).toBeInTheDocument();
  });

  it('应该在有更新时显示更新说明', () => {
    const releaseNotes = '修复了一些 bug\n添加了新功能';
    
    render(
      <VersionInfo
        currentVersion="2024.01.10"
        latestVersion="2024.01.15"
        hasUpdate={true}
        releaseNotes={releaseNotes}
      />
    );
    
    expect(screen.getByText('更新说明')).toBeInTheDocument();
    // 使用正则表达式匹配包含换行符的文本
    expect(screen.getByText(/修复了一些 bug/)).toBeInTheDocument();
    expect(screen.getByText(/添加了新功能/)).toBeInTheDocument();
  });

  it('应该在没有更新时不显示更新说明', () => {
    render(
      <VersionInfo
        currentVersion="2024.01.15"
        latestVersion="2024.01.15"
        hasUpdate={false}
        releaseNotes="这不应该显示"
      />
    );
    
    expect(screen.queryByText('更新说明')).not.toBeInTheDocument();
  });

  it('应该在没有最新版本信息时只显示当前版本', () => {
    render(
      <VersionInfo
        currentVersion="2024.01.10"
        hasUpdate={false}
      />
    );
    
    expect(screen.getByText('当前版本')).toBeInTheDocument();
    expect(screen.getByText('2024.01.10')).toBeInTheDocument();
    expect(screen.queryByText('最新版本')).not.toBeInTheDocument();
  });
});
