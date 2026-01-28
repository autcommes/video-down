/**
 * ProgressBar 组件
 * 显示下载进度条
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  /** 进度百分比 (0-100) */
  percent: number;
  /** 自定义类名 */
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percent,
  className,
}) => {
  // 确保百分比在 0-100 范围内
  const normalizedPercent = Math.min(Math.max(percent, 0), 100);

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">下载进度</span>
        <span className="text-sm font-medium text-gray-700">
          {normalizedPercent.toFixed(1)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${normalizedPercent}%` }}
          role="progressbar"
          aria-valuenow={normalizedPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
