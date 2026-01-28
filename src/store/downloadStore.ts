/**
 * 下载状态管理 Store
 * 管理下载任务列表、进度数据和下载状态
 */

import { create } from 'zustand';
import type { DownloadTask, ProgressData, VideoInfo } from '../types';
import { TaskStatus } from '../types';

/**
 * 下载 Store 状态接口
 */
interface DownloadState {
  /** 当前视频信息 */
  currentVideoInfo: VideoInfo | null;
  /** 下载任务列表 */
  tasks: DownloadTask[];
  /** 进度数据映射 (taskId -> ProgressData) */
  progressMap: Map<string, ProgressData>;
  /** 是否正在加载视频信息 */
  isLoadingVideoInfo: boolean;
  /** 视频信息加载错误 */
  videoInfoError: string | null;
}

/**
 * 下载 Store Actions 接口
 */
interface DownloadActions {
  /** 设置当前视频信息 */
  setCurrentVideoInfo: (videoInfo: VideoInfo | null) => void;
  /** 设置视频信息加载状态 */
  setLoadingVideoInfo: (isLoading: boolean) => void;
  /** 设置视频信息错误 */
  setVideoInfoError: (error: string | null) => void;
  /** 添加下载任务 */
  addTask: (task: DownloadTask) => void;
  /** 更新任务状态 */
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  /** 移除任务 */
  removeTask: (taskId: string) => void;
  /** 更新任务进度 */
  updateProgress: (progress: ProgressData) => void;
  /** 获取任务进度 */
  getProgress: (taskId: string) => ProgressData | undefined;
  /** 清空所有任务 */
  clearTasks: () => void;
  /** 清空当前视频信息 */
  clearCurrentVideoInfo: () => void;
}

/**
 * 下载 Store 类型
 */
type DownloadStore = DownloadState & DownloadActions;

/**
 * 创建下载状态管理 Store
 */
export const useDownloadStore = create<DownloadStore>((set, get) => ({
  // 初始状态
  currentVideoInfo: null,
  tasks: [],
  progressMap: new Map(),
  isLoadingVideoInfo: false,
  videoInfoError: null,

  // Actions
  setCurrentVideoInfo: (videoInfo) => {
    set({ currentVideoInfo: videoInfo, videoInfoError: null });
  },

  setLoadingVideoInfo: (isLoading) => {
    set({ isLoadingVideoInfo: isLoading });
  },

  setVideoInfoError: (error) => {
    set({ videoInfoError: error, isLoadingVideoInfo: false });
  },

  addTask: (task) => {
    set((state) => ({
      tasks: [...state.tasks, task],
    }));
  },

  updateTaskStatus: (taskId, status) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, status } : task
      ),
    }));
  },

  removeTask: (taskId) => {
    set((state) => {
      const newProgressMap = new Map(state.progressMap);
      newProgressMap.delete(taskId);
      return {
        tasks: state.tasks.filter((task) => task.id !== taskId),
        progressMap: newProgressMap,
      };
    });
  },

  updateProgress: (progress) => {
    set((state) => {
      const newProgressMap = new Map(state.progressMap);
      newProgressMap.set(progress.taskId, progress);
      return { progressMap: newProgressMap };
    });
  },

  getProgress: (taskId) => {
    return get().progressMap.get(taskId);
  },

  clearTasks: () => {
    set({ tasks: [], progressMap: new Map() });
  },

  clearCurrentVideoInfo: () => {
    set({ 
      currentVideoInfo: null, 
      videoInfoError: null,
      isLoadingVideoInfo: false 
    });
  },
}));
