import { useEffect, useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Format } from '@/types';

interface ResolutionSelectProps {
  formats: Format[];
  value: string;
  onChange: (formatId: string) => void;
  disabled?: boolean;
}

/**
 * 分辨率选择组件
 * 
 * 功能：
 * - 显示可用的分辨率列表（从高到低排序）
 * - 默认选择 1080p 或最接近的分辨率
 * - 显示文件大小信息
 * - 标识需要合并音频流的格式
 * 
 * 需求：2.1, 2.2, 2.3, 2.5
 */
export function ResolutionSelect({
  formats,
  value,
  onChange,
  disabled = false,
}: ResolutionSelectProps) {
  /**
   * 解析分辨率字符串为像素数量
   * 例如："1920x1080" -> 2073600
   */
  const parseResolution = (resolution: string): number => {
    const match = resolution.match(/(\d+)x(\d+)/);
    if (match) {
      const width = parseInt(match[1], 10);
      const height = parseInt(match[2], 10);
      return width * height;
    }
    return 0;
  };

  /**
   * 提取分辨率高度（用于显示）
   * 例如："1920x1080" -> "1080p"
   */
  const getResolutionLabel = (resolution: string): string => {
    const match = resolution.match(/\d+x(\d+)/);
    if (match) {
      return `${match[1]}p`;
    }
    return resolution;
  };

  /**
   * 格式化文件大小
   */
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '大小未知';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  /**
   * 检查格式是否需要合并音频流
   * 如果视频编码存在但音频编码为 "none"，则需要合并
   */
  const needsAudioMerge = (format: Format): boolean => {
    return format.vcodec !== 'none' && format.acodec === 'none';
  };

  /**
   * 按分辨率从高到低排序格式列表
   * 需求：2.2 - 分辨率排序单调性
   */
  const sortedFormats = [...formats].sort((a, b) => {
    const pixelsA = parseResolution(a.resolution);
    const pixelsB = parseResolution(b.resolution);
    return pixelsB - pixelsA; // 降序排列
  });

  /**
   * 选择默认分辨率
   * 需求：2.3 - 默认分辨率选择正确性
   * 优先选择 1080p，如果不存在则选择最接近的分辨率
   */
  const selectDefaultResolution = useCallback((): string | undefined => {
    if (sortedFormats.length === 0) return undefined;

    // 查找 1080p
    const preferred1080p = sortedFormats.find((format) => {
      const label = getResolutionLabel(format.resolution);
      return label === '1080p';
    });

    if (preferred1080p) {
      return preferred1080p.formatId;
    }

    // 如果没有 1080p，找最接近的
    const target = 1920 * 1080; // 1080p 的像素数
    let closest = sortedFormats[0];
    let minDiff = Math.abs(parseResolution(closest.resolution) - target);

    for (const format of sortedFormats) {
      const pixels = parseResolution(format.resolution);
      const diff = Math.abs(pixels - target);
      if (diff < minDiff) {
        minDiff = diff;
        closest = format;
      }
    }

    return closest.formatId;
  }, [sortedFormats]);

  /**
   * 当格式列表变化且没有选中值时，自动选择默认分辨率
   */
  useEffect(() => {
    if (formats.length > 0 && !value) {
      const defaultFormat = selectDefaultResolution();
      if (defaultFormat) {
        onChange(defaultFormat);
      }
    }
  }, [formats, value, onChange, selectDefaultResolution]);

  if (formats.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        暂无可用的分辨率选项
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor="resolution-select" className="text-sm font-medium">
        选择分辨率
      </label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="resolution-select" className="w-full">
          <SelectValue placeholder="选择分辨率" />
        </SelectTrigger>
        <SelectContent>
          {sortedFormats.map((format) => {
            const label = getResolutionLabel(format.resolution);
            const fileSize = formatFileSize(format.filesize);
            const needsMerge = needsAudioMerge(format);

            return (
              <SelectItem key={format.formatId} value={format.formatId}>
                <div className="flex items-center justify-between gap-4 w-full">
                  <span className="font-medium">{label}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{fileSize}</span>
                    {needsMerge && (
                      <span className="text-blue-500" title="将自动合并音频流">
                        +音频
                      </span>
                    )}
                    {format.fps && (
                      <span>{format.fps}fps</span>
                    )}
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
