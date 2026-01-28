/**
 * ProgressInfo 组件
 * 显示下载速度、大小和预计剩余时间
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressInfoProps {
  /** 下载速度 (如 "2.5MB/s") */
  speed: string;
  /** 已下载大小 (如 "125MB") */
  downloaded: string;
  /** 总大小 (如 "280MB") */
  total: string;
  /** 预计剩余时间 (如 "00:02:30") */
  eta: string;
  /** 自定义类名 */
  className?: string;
}

export const ProgressInfo: React.FC<ProgressInfoProps> = ({
  speed,
  downloaded,
  total,
  eta,
  className,
}) => {
  return (
    <div className={cn('grid grid-cols-2 gap-4', className)}>
      <div className="flex flex-col">
        <span className="text-xs text-gray-500">下载速度</span>
        <span className="text-sm font-medium text-gray-900">{speed}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-gray-500">预计剩余时间</span>
        <span className="text-sm font-medium text-gray-900">{eta}</span>
      </div>
      <div className="flex flex-col col-span-2">
        <span className="text-xs text-gray-500">下载大小</span>
        <span className="text-sm font-medium text-gray-900">
          {downloaded} / {total}
        </span>
      </div>
    </div>
  );
};

export default ProgressInfo;
