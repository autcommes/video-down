import { useState } from 'react';
import { PathSelector } from './PathSelector';

/**
 * PathSelector 组件使用示例
 */
export function PathSelectorExample() {
  const [savePath, setSavePath] = useState('C:\\Users\\Downloads');

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">路径选择组件示例</h2>
        
        <div className="space-y-6">
          {/* 基本使用 */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">基本使用</h3>
            <PathSelector
              value={savePath}
              onChange={setSavePath}
            />
            <div className="mt-4 p-3 bg-gray-100 rounded">
              <p className="text-sm">
                <strong>当前路径：</strong> {savePath || '未选择'}
              </p>
            </div>
          </div>

          {/* 禁用状态 */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">禁用状态</h3>
            <PathSelector
              value={savePath}
              onChange={setSavePath}
              disabled={true}
            />
          </div>

          {/* 空值状态 */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">空值状态</h3>
            <PathSelector
              onChange={(path) => console.log('选择的路径:', path)}
            />
          </div>
        </div>
      </div>

      {/* 功能说明 */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-3">功能说明</h3>
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
          <li>点击"浏览"按钮打开系统原生文件夹选择对话框</li>
          <li>支持手动输入路径</li>
          <li>自动验证路径格式（Windows 和 Unix 格式）</li>
          <li>选择路径后自动保存到应用配置</li>
          <li>显示路径验证提示和错误信息</li>
          <li>支持禁用状态</li>
        </ul>
      </div>

      {/* 需求映射 */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-3">需求映射</h3>
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
          <li><strong>需求 4.1：</strong> 使用系统默认的下载文件夹作为保存路径</li>
          <li><strong>需求 4.2：</strong> 打开原生文件夹选择对话框</li>
          <li><strong>需求 4.3：</strong> 验证路径的写入权限（后端验证）</li>
        </ul>
      </div>
    </div>
  );
}

export default PathSelectorExample;
