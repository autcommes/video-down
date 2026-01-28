/**
 * 配置状态管理 Store
 * 管理应用配置和配置持久化
 */

import { create } from 'zustand';
import type { AppConfig } from '../types';
import { configApi } from '../services/tauriApi';

/**
 * 默认配置
 */
const DEFAULT_CONFIG: AppConfig = {
  savePath: '',
  defaultResolution: '1080p',
  autoCheckUpdate: true,
  concurrentDownloads: 3,
  youtubeCookieBrowser: 'none',
};

/**
 * 配置 Store 状态接口
 */
interface ConfigState {
  /** 应用配置 */
  config: AppConfig;
  /** 是否正在加载配置 */
  isLoading: boolean;
  /** 配置加载/保存错误 */
  error: string | null;
}

/**
 * 配置 Store Actions 接口
 */
interface ConfigActions {
  /** 加载配置 */
  loadConfig: () => Promise<void>;
  /** 保存配置 */
  saveConfig: (config: AppConfig) => Promise<void>;
  /** 更新保存路径 */
  updateSavePath: (savePath: string) => Promise<void>;
  /** 更新默认分辨率 */
  updateDefaultResolution: (resolution: string) => Promise<void>;
  /** 更新自动检查更新设置 */
  updateAutoCheckUpdate: (autoCheck: boolean) => Promise<void>;
  /** 更新并发下载数 */
  updateConcurrentDownloads: (count: number) => Promise<void>;
  /** 重置为默认配置 */
  resetConfig: () => Promise<void>;
  /** 清除错误 */
  clearError: () => void;
}

/**
 * 配置 Store 类型
 */
type ConfigStore = ConfigState & ConfigActions;

/**
 * 创建配置状态管理 Store
 */
export const useConfigStore = create<ConfigStore>((set, get) => ({
  // 初始状态
  config: DEFAULT_CONFIG,
  isLoading: false,
  error: null,

  // Actions
  loadConfig: async () => {
    set({ isLoading: true, error: null });
    try {
      const config = await configApi.getConfig();
      set({ config, isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '加载配置失败';
      set({ error: errorMessage, isLoading: false });
      console.error('加载配置失败:', error);
    }
  },

  saveConfig: async (config) => {
    set({ isLoading: true, error: null });
    try {
      await configApi.saveConfig(config);
      set({ config, isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '保存配置失败';
      set({ error: errorMessage, isLoading: false });
      console.error('保存配置失败:', error);
      throw error;
    }
  },

  updateSavePath: async (savePath) => {
    const currentConfig = get().config;
    const newConfig = { ...currentConfig, savePath };
    await get().saveConfig(newConfig);
  },

  updateDefaultResolution: async (resolution) => {
    const currentConfig = get().config;
    const newConfig = { ...currentConfig, defaultResolution: resolution };
    await get().saveConfig(newConfig);
  },

  updateAutoCheckUpdate: async (autoCheck) => {
    const currentConfig = get().config;
    const newConfig = { ...currentConfig, autoCheckUpdate: autoCheck };
    await get().saveConfig(newConfig);
  },

  updateConcurrentDownloads: async (count) => {
    const currentConfig = get().config;
    const newConfig = { ...currentConfig, concurrentDownloads: count };
    await get().saveConfig(newConfig);
  },

  resetConfig: async () => {
    await get().saveConfig(DEFAULT_CONFIG);
  },

  clearError: () => {
    set({ error: null });
  },
}));
