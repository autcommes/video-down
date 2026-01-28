import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fileSystemApi } from '@/services/tauriApi';
import { useConfigStore } from '@/store/configStore';

interface PathSelectorProps {
  value?: string;
  onChange: (path: string) => void;
  disabled?: boolean;
}

/**
 * 路径选择组件
 * 
 * 功能：
 * - 显示当前保存路径
 * - 提供浏览按钮打开文件夹选择对话框
 * - 路径验证和错误提示
 * - 自动保存到配置
 * 
 * 需求：4.1, 4.2, 4.3
 */
export function PathSelector({
  value,
  onChange,
  disabled = false,
}: PathSelectorProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState('');
  const { updateSavePath } = useConfigStore();

  /**
   * 处理浏览按钮点击
   * 需求 4.2：打开原生文件夹选择对话框
   */
  const handleBrowse = async () => {
    setIsSelecting(true);
    setError('');

    try {
      const selectedPath = await fileSystemApi.selectFolder();
      
      if (selectedPath) {
        // 验证路径权限
        // 需求 4.3：验证路径的写入权限
        // 注意：实际的权限验证在后端进行，这里只做基本检查
        if (selectedPath.trim()) {
          onChange(selectedPath);
          
          // 保存到配置
          try {
            await updateSavePath(selectedPath);
          } catch (err) {
            // 如果保存配置失败，显示警告但不阻止使用
            console.warn('保存路径到配置失败:', err);
          }
        } else {
          setError('选择的路径无效');
        }
      }
      // 如果用户取消选择（selectedPath 为 null），不做任何操作
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '选择文件夹失败';
      setError(errorMessage);
      console.error('选择文件夹失败:', err);
    } finally {
      setIsSelecting(false);
    }
  };

  /**
   * 处理手动输入路径
   */
  const handlePathChange = (newPath: string) => {
    setError('');
    onChange(newPath);
  };

  /**
   * 验证路径格式
   */
  const validatePath = (path: string): boolean => {
    if (!path || !path.trim()) {
      return false;
    }
    
    // 基本的路径格式检查
    // Windows: C:\path\to\folder 或 \\network\path
    // Unix: /path/to/folder
    const windowsPath = /^[a-zA-Z]:\\|^\\\\/;
    const unixPath = /^\//;
    
    return windowsPath.test(path) || unixPath.test(path);
  };

  /**
   * 当路径值变化时，清除错误
   */
  useEffect(() => {
    if (value && error) {
      setError('');
    }
  }, [value, error]);

  return (
    <div className="space-y-2">
      <label htmlFor="save-path" className="text-sm font-medium">
        保存位置
      </label>
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            id="save-path"
            type="text"
            placeholder="选择视频保存位置"
            value={value || ''}
            onChange={(e) => handlePathChange(e.target.value)}
            disabled={disabled || isSelecting}
            className={error ? 'border-red-500 focus-visible:ring-red-500' : ''}
            aria-label="保存路径"
            aria-invalid={!!error}
            aria-describedby={error ? 'path-error' : undefined}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleBrowse}
          disabled={disabled || isSelecting}
          className="min-w-[100px]"
        >
          {isSelecting ? '选择中...' : '浏览'}
        </Button>
      </div>
      
      {error && (
        <p id="path-error" className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
      
      {value && !error && validatePath(value) && (
        <p className="text-xs text-muted-foreground">
          视频将保存到此位置
        </p>
      )}
      
      {value && !validatePath(value) && !error && (
        <p className="text-xs text-yellow-600">
          路径格式可能不正确，请确认
        </p>
      )}
    </div>
  );
}
