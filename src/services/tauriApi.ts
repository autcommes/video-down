/**
 * Tauri API 封装服务层
 * 提供统一的命令调用接口和错误处理
 */

import { invoke } from '@tauri-apps/api/tauri';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import type {
  VideoInfo,
  ProgressData,
  AppConfig,
  HistoryItem,
  UpdateInfo,
} from '../types';

/**
 * Tauri 命令错误
 */
export class TauriCommandError extends Error {
  constructor(
    message: string,
    public readonly command: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'TauriCommandError';
  }
}

/**
 * 统一的错误处理函数
 */
function handleError(command: string, error: unknown): never {
  console.error(`Tauri 命令执行失败 [${command}]:`, error);
  
  const message = typeof error === 'string' 
    ? error 
    : error instanceof Error 
    ? error.message 
    : '未知错误';
  
  throw new TauriCommandError(message, command, error);
}

/**
 * 视频相关 API
 */
export const videoApi = {
  /**
   * 获取视频信息
   * @param url 视频 URL
   * @returns 视频信息
   */
  async getVideoInfo(url: string): Promise<VideoInfo> {
    try {
      return await invoke<VideoInfo>('get_video_info', { url });
    } catch (error) {
      handleError('get_video_info', error);
    }
  },

  /**
   * 下载视频
   * @param url 视频 URL
   * @param formatId 格式 ID
   * @param savePath 保存路径
   * @returns 任务 ID
   */
  async downloadVideo(
    url: string,
    formatId: string,
    savePath: string
  ): Promise<string> {
    try {
      // 生成任务 ID
      const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 调用后端命令，参数需要包装在 request 对象中
      const params = {
        request: {
          url,
          format_id: formatId,
          save_path: savePath,
          task_id: taskId,
        }
      };
      
      console.log('调用 download_video，参数:', params);
      
      await invoke<string>('download_video', params);
      
      return taskId;
    } catch (error) {
      handleError('download_video', error);
    }
  },

  /**
   * 取消下载
   * @param taskId 任务 ID
   */
  async cancelDownload(taskId: string): Promise<void> {
    try {
      await invoke<void>('cancel_download', { task_id: taskId });
    } catch (error) {
      handleError('cancel_download', error);
    }
  },
};

/**
 * 文件系统相关 API
 */
export const fileSystemApi = {
  /**
   * 选择文件夹
   * @returns 选择的文件夹路径，如果取消则返回 null
   */
  async selectFolder(): Promise<string | null> {
    try {
      return await invoke<string | null>('select_folder');
    } catch (error) {
      handleError('select_folder', error);
    }
  },

  /**
   * 打开文件
   * @param path 文件路径
   */
  async openFile(path: string): Promise<void> {
    try {
      await invoke<void>('open_file', { path });
    } catch (error) {
      handleError('open_file', error);
    }
  },
};

/**
 * 配置相关 API
 */
export const configApi = {
  /**
   * 获取应用配置
   * @returns 应用配置
   */
  async getConfig(): Promise<AppConfig> {
    try {
      return await invoke<AppConfig>('get_config');
    } catch (error) {
      handleError('get_config', error);
    }
  },

  /**
   * 保存应用配置
   * @param config 应用配置
   */
  async saveConfig(config: AppConfig): Promise<void> {
    try {
      await invoke<void>('save_config', { config });
    } catch (error) {
      handleError('save_config', error);
    }
  },
};

/**
 * 历史记录相关 API
 */
export const historyApi = {
  /**
   * 获取历史记录
   * @returns 历史记录列表
   */
  async getHistory(): Promise<HistoryItem[]> {
    try {
      return await invoke<HistoryItem[]>('get_history');
    } catch (error) {
      handleError('get_history', error);
    }
  },

  /**
   * 清空历史记录
   */
  async clearHistory(): Promise<void> {
    try {
      await invoke<void>('clear_history');
    } catch (error) {
      handleError('clear_history', error);
    }
  },

  /**
   * 添加历史记录
   * @param item 历史记录项
   */
  async addHistory(item: HistoryItem): Promise<void> {
    try {
      await invoke<void>('add_history', { item });
    } catch (error) {
      handleError('add_history', error);
    }
  },
};

/**
 * 更新相关 API
 */
export const updateApi = {
  /**
   * 检查 yt-dlp 更新
   * @returns 更新信息
   */
  async checkYtdlpUpdate(): Promise<UpdateInfo> {
    try {
      return await invoke<UpdateInfo>('check_ytdlp_update');
    } catch (error) {
      handleError('check_ytdlp_update', error);
    }
  },

  /**
   * 更新 yt-dlp
   */
  async updateYtdlp(): Promise<void> {
    try {
      await invoke<void>('update_ytdlp');
    } catch (error) {
      handleError('update_ytdlp', error);
    }
  },

  /**
   * 获取 yt-dlp 版本
   * @returns 版本号
   */
  async getYtdlpVersion(): Promise<string> {
    try {
      return await invoke<string>('get_ytdlp_version');
    } catch (error) {
      handleError('get_ytdlp_version', error);
    }
  },
};

/**
 * 事件监听器类型
 */
export type EventCallback<T> = (payload: T) => void;

/**
 * 事件相关 API
 */
export const eventApi = {
  /**
   * 监听下载进度事件
   * @param callback 回调函数
   * @returns 取消监听函数
   */
  async onDownloadProgress(
    callback: EventCallback<ProgressData>
  ): Promise<UnlistenFn> {
    try {
      return await listen<ProgressData>('download-progress', (event) => {
        callback(event.payload);
      });
    } catch (error) {
      handleError('listen:download-progress', error);
    }
  },

  /**
   * 监听下载完成事件
   * @param callback 回调函数
   * @returns 取消监听函数
   */
  async onDownloadComplete(
    callback: EventCallback<{
      taskId: string;
      filePath: string;
      fileSize: number;
    }>
  ): Promise<UnlistenFn> {
    try {
      return await listen<{
        taskId: string;
        filePath: string;
        fileSize: number;
      }>('download-complete', (event) => {
        callback(event.payload);
      });
    } catch (error) {
      handleError('listen:download-complete', error);
    }
  },

  /**
   * 监听下载错误事件
   * @param callback 回调函数
   * @returns 取消监听函数
   */
  async onDownloadError(
    callback: EventCallback<{
      taskId: string;
      error: string;
    }>
  ): Promise<UnlistenFn> {
    try {
      return await listen<{
        taskId: string;
        error: string;
      }>('download-error', (event) => {
        callback(event.payload);
      });
    } catch (error) {
      handleError('listen:download-error', error);
    }
  },

  /**
   * 监听更新进度事件
   * @param callback 回调函数
   * @returns 取消监听函数
   */
  async onUpdateProgress(
    callback: EventCallback<{
      percent: number;
      downloaded: string;
      total: string;
    }>
  ): Promise<UnlistenFn> {
    try {
      return await listen<{
        percent: number;
        downloaded: string;
        total: string;
      }>('update-progress', (event) => {
        callback(event.payload);
      });
    } catch (error) {
      handleError('listen:update-progress', error);
    }
  },
};

/**
 * 导出所有 API
 */
export const tauriApi = {
  video: videoApi,
  fileSystem: fileSystemApi,
  config: configApi,
  history: historyApi,
  update: updateApi,
  event: eventApi,
};

export default tauriApi;
