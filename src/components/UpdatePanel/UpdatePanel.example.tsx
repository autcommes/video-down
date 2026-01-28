/**
 * UpdatePanel 组件使用示例
 */

import React from 'react';
import { UpdatePanel } from './UpdatePanel';

/**
 * 基本使用示例
 */
export const BasicExample: React.FC = () => {
  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">更新面板示例</h1>
      <UpdatePanel />
    </div>
  );
};

/**
 * 在应用中集成示例
 */
export const IntegratedExample: React.FC = () => {
  return (
    <div className="container mx-auto p-8 max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold mb-2">视频下载工具</h1>
      
      {/* 其他功能区域 */}
      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">下载视频</h2>
        <p className="text-muted-foreground">这里是下载表单...</p>
      </div>
      
      {/* 更新面板 */}
      <UpdatePanel />
      
      {/* 历史记录 */}
      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">下载历史</h2>
        <p className="text-muted-foreground">这里是历史记录列表...</p>
      </div>
    </div>
  );
};

export default BasicExample;
