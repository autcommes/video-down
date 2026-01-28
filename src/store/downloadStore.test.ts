/**
 * 下载 Store 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useDownloadStore } from './downloadStore';
import { TaskStatus } from '../types';
import type { DownloadTask, ProgressData } from '../types';

describe('downloadStore', () => {
  beforeEach(() => {
    // 重置 store 状态
    useDownloadStore.setState({
      currentVideoInfo: null,
      tasks: [],
      progressMap: new Map(),
      isLoadingVideoInfo: false,
      videoInfoError: null,
    });
  });

  it('应该能够添加下载任务', () => {
    const task: DownloadTask = {
      id: 'task-1',
      url: 'https://youtube.com/watch?v=test',
      title: '测试视频',
      formatId: 'format-1',
      savePath: '/downloads',
      status: TaskStatus.Pending,
      createdAt: Date.now(),
    };

    useDownloadStore.getState().addTask(task);
    
    const tasks = useDownloadStore.getState().tasks;
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toEqual(task);
  });

  it('应该能够更新任务状态', () => {
    const task: DownloadTask = {
      id: 'task-1',
      url: 'https://youtube.com/watch?v=test',
      title: '测试视频',
      formatId: 'format-1',
      savePath: '/downloads',
      status: TaskStatus.Pending,
      createdAt: Date.now(),
    };

    useDownloadStore.getState().addTask(task);
    useDownloadStore.getState().updateTaskStatus('task-1', TaskStatus.Downloading);
    
    const updatedTask = useDownloadStore.getState().tasks[0];
    expect(updatedTask.status).toBe(TaskStatus.Downloading);
  });

  it('应该能够更新任务进度', () => {
    const progress: ProgressData = {
      taskId: 'task-1',
      percent: 50.5,
      speed: '2.5MB/s',
      downloaded: '125MB',
      total: '250MB',
      eta: '00:01:30',
    };

    useDownloadStore.getState().updateProgress(progress);
    
    const storedProgress = useDownloadStore.getState().getProgress('task-1');
    expect(storedProgress).toEqual(progress);
  });

  it('应该能够移除任务及其进度', () => {
    const task: DownloadTask = {
      id: 'task-1',
      url: 'https://youtube.com/watch?v=test',
      title: '测试视频',
      formatId: 'format-1',
      savePath: '/downloads',
      status: TaskStatus.Pending,
      createdAt: Date.now(),
    };

    const progress: ProgressData = {
      taskId: 'task-1',
      percent: 50.5,
      speed: '2.5MB/s',
      downloaded: '125MB',
      total: '250MB',
      eta: '00:01:30',
    };

    useDownloadStore.getState().addTask(task);
    useDownloadStore.getState().updateProgress(progress);
    useDownloadStore.getState().removeTask('task-1');
    
    expect(useDownloadStore.getState().tasks).toHaveLength(0);
    expect(useDownloadStore.getState().getProgress('task-1')).toBeUndefined();
  });

  it('应该能够清空所有任务', () => {
    const task1: DownloadTask = {
      id: 'task-1',
      url: 'https://youtube.com/watch?v=test1',
      title: '测试视频1',
      formatId: 'format-1',
      savePath: '/downloads',
      status: TaskStatus.Pending,
      createdAt: Date.now(),
    };

    const task2: DownloadTask = {
      id: 'task-2',
      url: 'https://youtube.com/watch?v=test2',
      title: '测试视频2',
      formatId: 'format-2',
      savePath: '/downloads',
      status: TaskStatus.Pending,
      createdAt: Date.now(),
    };

    useDownloadStore.getState().addTask(task1);
    useDownloadStore.getState().addTask(task2);
    useDownloadStore.getState().clearTasks();
    
    expect(useDownloadStore.getState().tasks).toHaveLength(0);
    expect(useDownloadStore.getState().progressMap.size).toBe(0);
  });

  it('应该能够设置和清除视频信息', () => {
    const videoInfo = {
      id: 'video-1',
      title: '测试视频',
      duration: 300,
      thumbnail: 'https://example.com/thumb.jpg',
      uploader: '测试上传者',
      formats: [],
    };

    useDownloadStore.getState().setCurrentVideoInfo(videoInfo);
    expect(useDownloadStore.getState().currentVideoInfo).toEqual(videoInfo);

    useDownloadStore.getState().clearCurrentVideoInfo();
    expect(useDownloadStore.getState().currentVideoInfo).toBeNull();
  });

  it('应该能够设置加载状态和错误', () => {
    useDownloadStore.getState().setLoadingVideoInfo(true);
    expect(useDownloadStore.getState().isLoadingVideoInfo).toBe(true);

    useDownloadStore.getState().setVideoInfoError('测试错误');
    expect(useDownloadStore.getState().videoInfoError).toBe('测试错误');
    expect(useDownloadStore.getState().isLoadingVideoInfo).toBe(false);
  });
});
