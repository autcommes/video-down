/**
 * 历史记录状态管理 Store
 * 管理下载历史记录
 */

import { create } from 'zustand';
import type { HistoryItem } from '../types';
import { historyApi, fileSystemApi } from '../services/tauriApi';

/**
 * 历史记录 Store 状态接口
 */
interface HistoryState {
  /** 历史记录列表 */
  items: HistoryItem[];
  /** 是否正在加载历史记录 */
  isLoading: boolean;
  /** 历史记录加载/操作错误 */
  error: string | null;
}

/**
 * 历史记录 Store Actions 接口
 */
interface HistoryActions {
  /** 加载历史记录 */
  loadHistory: () => Promise<void>;
  /** 清空历史记录 */
  clearHistory: () => Promise<void>;
  /** 添加历史记录项 */
  addHistoryItem: (item: HistoryItem) => void;
  /** 更新历史记录项的文件存在状态 */
  updateFileExists: (id: string, exists: boolean) => void;
  /** 打开历史记录文件 */
  openHistoryFile: (filePath: string) => Promise<void>;
  /** 刷新文件存在状态 */
  refreshFileExistence: () => Promise<void>;
  /** 清除错误 */
  clearError: () => void;
}

/**
 * 历史记录 Store 类型
 */
type HistoryStore = HistoryState & HistoryActions;

/**
 * 创建历史记录状态管理 Store
 */
export const useHistoryStore = create<HistoryStore>((set, get) => ({
  // 初始状态
  items: [],
  isLoading: false,
  error: null,

  // Actions
  loadHistory: async () => {
    set({ isLoading: true, error: null });
    try {
      const items = await historyApi.getHistory();
      set({ items, isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '加载历史记录失败';
      set({ error: errorMessage, isLoading: false });
      console.error('加载历史记录失败:', error);
    }
  },

  clearHistory: async () => {
    set({ isLoading: true, error: null });
    try {
      await historyApi.clearHistory();
      set({ items: [], isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '清空历史记录失败';
      set({ error: errorMessage, isLoading: false });
      console.error('清空历史记录失败:', error);
      throw error;
    }
  },

  addHistoryItem: (item) => {
    set((state) => ({
      items: [item, ...state.items],
    }));
  },

  updateFileExists: (id, exists) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, fileExists: exists } : item
      ),
    }));
  },

  openHistoryFile: async (filePath) => {
    try {
      await fileSystemApi.openFile(filePath);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '打开文件失败';
      set({ error: errorMessage });
      console.error('打开文件失败:', error);
      throw error;
    }
  },

  refreshFileExistence: async () => {
    // 注意：这个功能需要后端支持批量检查文件存在性
    // 目前我们只能在前端通过尝试打开文件来检查
    // 这里提供一个占位实现，实际可能需要后端 API 支持
    const items = get().items;
    
    // 简单实现：假设所有文件都存在，除非打开失败
    // 更好的实现需要后端提供批量检查 API
    console.log('刷新文件存在状态 (需要后端支持):', items.length);
  },

  clearError: () => {
    set({ error: null });
  },
}));
