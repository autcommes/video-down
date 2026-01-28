/**
 * HistoryList 组件使用示例
 * 
 * 这个文件展示了如何在应用中使用 HistoryList 组件
 */

import { HistoryList } from './HistoryList';

/**
 * 基本使用示例
 */
export function BasicExample() {
  return (
    <div className="container mx-auto p-4">
      <HistoryList />
    </div>
  );
}

/**
 * 自定义高度示例
 */
export function CustomHeightExample() {
  return (
    <div className="container mx-auto p-4">
      <HistoryList height={400} />
    </div>
  );
}

/**
 * 在主应用中集成示例
 */
export function AppIntegrationExample() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">视频下载工具</h1>
        
        {/* 其他组件... */}
        
        {/* 历史记录组件 */}
        <HistoryList height={500} />
      </div>
    </div>
  );
}

export default BasicExample;
