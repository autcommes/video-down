/**
 * VersionInfo 组件
 * 显示当前版本和最新版本信息
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';

interface VersionInfoProps {
  /** 当前版本 */
  currentVersion: string;
  /** 最新版本 */
  latestVersion?: string;
  /** 是否有更新 */
  hasUpdate: boolean;
  /** 更新说明 */
  releaseNotes?: string;
}

export const VersionInfo: React.FC<VersionInfoProps> = ({
  currentVersion,
  latestVersion,
  hasUpdate,
  releaseNotes,
}) => {
  return (
    <div className="space-y-4">
      {/* 版本信息 */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="text-sm text-muted-foreground mb-1">当前版本</div>
          <div className="text-lg font-semibold">{currentVersion}</div>
        </div>
        
        {latestVersion && (
          <div className="flex-1">
            <div className="text-sm text-muted-foreground mb-1">最新版本</div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{latestVersion}</span>
              {hasUpdate && (
                <Badge variant="default" className="bg-green-500">
                  有新版本
                </Badge>
              )}
              {!hasUpdate && (
                <Badge variant="secondary">
                  已是最新
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 更新说明 */}
      {releaseNotes && hasUpdate && (
        <div className="border-t pt-4">
          <div className="text-sm font-medium mb-2">更新说明</div>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
            {releaseNotes}
          </div>
        </div>
      )}
    </div>
  );
};

export default VersionInfo;
