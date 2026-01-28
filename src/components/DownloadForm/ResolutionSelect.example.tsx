import { useState } from 'react';
import { ResolutionSelect } from './ResolutionSelect';
import { Format } from '@/types';

/**
 * ResolutionSelect 组件示例
 * 
 * 演示不同场景下的分辨率选择器
 */
export function ResolutionSelectExample() {
  const [selectedFormat, setSelectedFormat] = useState<string>('');

  // 模拟视频格式数据
  const mockFormats: Format[] = [
    {
      formatId: '401',
      resolution: '2560x1440',
      ext: 'mp4',
      filesize: 209715200, // 200 MB
      fps: 60,
      vcodec: 'vp9',
      acodec: 'opus',
    },
    {
      formatId: '137',
      resolution: '1920x1080',
      ext: 'mp4',
      filesize: 104857600, // 100 MB
      fps: 30,
      vcodec: 'avc1',
      acodec: 'none', // 需要合并音频
    },
    {
      formatId: '136',
      resolution: '1280x720',
      ext: 'mp4',
      filesize: 52428800, // 50 MB
      fps: 30,
      vcodec: 'avc1',
      acodec: 'mp4a',
    },
    {
      formatId: '135',
      resolution: '854x480',
      ext: 'mp4',
      filesize: 26214400, // 25 MB
      fps: 30,
      vcodec: 'avc1',
      acodec: 'mp4a',
    },
    {
      formatId: '134',
      resolution: '640x360',
      ext: 'mp4',
      filesize: 13107200, // 12.5 MB
      fps: 30,
      vcodec: 'avc1',
      acodec: 'mp4a',
    },
  ];

  const formatsWithout1080p: Format[] = [
    {
      formatId: '136',
      resolution: '1280x720',
      ext: 'mp4',
      filesize: 52428800,
      fps: 30,
      vcodec: 'avc1',
      acodec: 'mp4a',
    },
    {
      formatId: '135',
      resolution: '854x480',
      ext: 'mp4',
      filesize: 26214400,
      fps: 30,
      vcodec: 'avc1',
      acodec: 'mp4a',
    },
  ];

  return (
    <div className="space-y-8 p-8 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold mb-4">分辨率选择器示例</h2>
        <p className="text-muted-foreground mb-6">
          演示不同场景下的分辨率选择功能
        </p>
      </div>

      {/* 示例 1: 标准格式列表 */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold">示例 1: 标准格式列表</h3>
        <p className="text-sm text-muted-foreground">
          包含多个分辨率选项，默认选择 1080p
        </p>
        <ResolutionSelect
          formats={mockFormats}
          value={selectedFormat}
          onChange={setSelectedFormat}
        />
        {selectedFormat && (
          <p className="text-sm text-green-600">
            已选择格式 ID: {selectedFormat}
          </p>
        )}
      </div>

      {/* 示例 2: 没有 1080p 的格式列表 */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold">示例 2: 没有 1080p</h3>
        <p className="text-sm text-muted-foreground">
          当没有 1080p 时，自动选择最接近的分辨率（720p）
        </p>
        <ResolutionSelect
          formats={formatsWithout1080p}
          value=""
          onChange={(id) => console.log('选择了:', id)}
        />
      </div>

      {/* 示例 3: 空格式列表 */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold">示例 3: 空格式列表</h3>
        <p className="text-sm text-muted-foreground">
          当没有可用格式时显示提示信息
        </p>
        <ResolutionSelect
          formats={[]}
          value=""
          onChange={(id) => console.log('选择了:', id)}
        />
      </div>

      {/* 示例 4: 禁用状态 */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold">示例 4: 禁用状态</h3>
        <p className="text-sm text-muted-foreground">
          在加载或其他操作时禁用选择器
        </p>
        <ResolutionSelect
          formats={mockFormats}
          value="137"
          onChange={(id) => console.log('选择了:', id)}
          disabled={true}
        />
      </div>

      {/* 功能说明 */}
      <div className="space-y-4 p-4 bg-muted rounded-lg">
        <h3 className="text-lg font-semibold">功能特性</h3>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>✅ 分辨率按从高到低排序（需求 2.2）</li>
          <li>✅ 默认选择 1080p 或最接近的分辨率（需求 2.3）</li>
          <li>✅ 显示文件大小信息（需求 2.5）</li>
          <li>✅ 标识需要合并音频流的格式（需求 2.4）</li>
          <li>✅ 显示帧率信息</li>
          <li>✅ 支持禁用状态</li>
          <li>✅ 空列表友好提示</li>
        </ul>
      </div>
    </div>
  );
}

export default ResolutionSelectExample;
