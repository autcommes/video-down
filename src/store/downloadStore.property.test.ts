/**
 * 下载 Store 属性测试
 * Feature: youtube-downloader-tool, Property 10: 并发任务进度独立性
 * 验证需求：7.4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { useDownloadStore } from './downloadStore';
import { TaskStatus } from '../types';
import type { DownloadTask, ProgressData } from '../types';

describe('downloadStore - 属性测试', () => {
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

  /**
   * 属性 10：并发任务进度独立性
   * 
   * 对于任意数量的并发下载任务，每个任务的进度更新应该独立进行，
   * 一个任务的进度变化不应该影响其他任务的进度数据。
   * 
   * 验证需求：7.4
   */
  it('并发任务进度独立性：更新一个任务的进度不应影响其他任务', () => {
    fc.assert(
      fc.property(
        // 生成 2-10 个任务
        fc.array(
          fc.record({
            id: fc.uuid(),
            url: fc.webUrl(),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            formatId: fc.string({ minLength: 1, maxLength: 20 }),
            savePath: fc.string({ minLength: 1, maxLength: 200 }),
            status: fc.constantFrom(
              TaskStatus.Pending,
              TaskStatus.Downloading,
              TaskStatus.Completed,
              TaskStatus.Failed,
              TaskStatus.Cancelled
            ),
            createdAt: fc.integer({ min: 0, max: Date.now() }),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        // 为每个任务生成进度数据
        fc.array(
          fc.record({
            percent: fc.float({ min: 0, max: 100, noNaN: true }),
            speed: fc.string({ minLength: 1, maxLength: 20 }),
            downloaded: fc.string({ minLength: 1, maxLength: 20 }),
            total: fc.string({ minLength: 1, maxLength: 20 }),
            eta: fc.string({ minLength: 1, maxLength: 20 }),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (tasks, progressDataList) => {
          // 重置 store 状态
          useDownloadStore.setState({
            currentVideoInfo: null,
            tasks: [],
            progressMap: new Map(),
            isLoadingVideoInfo: false,
            videoInfoError: null,
          });

          // 确保进度数据数量与任务数量匹配
          const progressList = progressDataList.slice(0, tasks.length);

          // 添加所有任务
          tasks.forEach((task) => {
            useDownloadStore.getState().addTask(task as DownloadTask);
          });

          // 为每个任务设置初始进度
          const initialProgressMap = new Map<string, ProgressData>();
          tasks.forEach((task, index) => {
            const progress: ProgressData = {
              taskId: task.id,
              ...progressList[index],
            };
            useDownloadStore.getState().updateProgress(progress);
            initialProgressMap.set(task.id, progress);
          });

          // 验证所有任务的初始进度都已正确设置
          tasks.forEach((task) => {
            const storedProgress = useDownloadStore.getState().getProgress(task.id);
            expect(storedProgress).toBeDefined();
            expect(storedProgress?.taskId).toBe(task.id);
          });

          // 选择一个任务进行进度更新
          const targetTaskIndex = 0;
          const targetTask = tasks[targetTaskIndex];
          const newProgress: ProgressData = {
            taskId: targetTask.id,
            percent: 75.5,
            speed: '5.0MB/s',
            downloaded: '200MB',
            total: '265MB',
            eta: '00:00:13',
          };

          // 更新目标任务的进度
          useDownloadStore.getState().updateProgress(newProgress);

          // 验证目标任务的进度已更新
          const updatedProgress = useDownloadStore.getState().getProgress(targetTask.id);
          expect(updatedProgress).toEqual(newProgress);

          // 验证其他任务的进度未受影响
          tasks.forEach((task, index) => {
            if (index !== targetTaskIndex) {
              const otherProgress = useDownloadStore.getState().getProgress(task.id);
              const expectedProgress = initialProgressMap.get(task.id);
              
              // 其他任务的进度应该保持不变
              expect(otherProgress).toEqual(expectedProgress);
              expect(otherProgress?.taskId).toBe(task.id);
              expect(otherProgress?.percent).toBe(expectedProgress?.percent);
              expect(otherProgress?.speed).toBe(expectedProgress?.speed);
              expect(otherProgress?.downloaded).toBe(expectedProgress?.downloaded);
              expect(otherProgress?.total).toBe(expectedProgress?.total);
              expect(otherProgress?.eta).toBe(expectedProgress?.eta);
            }
          });

          // 验证 progressMap 的大小正确
          expect(useDownloadStore.getState().progressMap.size).toBe(tasks.length);

          // 验证每个任务的进度数据都是独立的（通过引用检查）
          const progressMap = useDownloadStore.getState().progressMap;
          const progressValues = Array.from(progressMap.values());
          
          // 确保每个进度对象都有唯一的 taskId
          const taskIds = progressValues.map((p) => p.taskId);
          const uniqueTaskIds = new Set(taskIds);
          expect(uniqueTaskIds.size).toBe(tasks.length);

          // 确保每个 taskId 都对应一个任务
          tasks.forEach((task) => {
            expect(taskIds).toContain(task.id);
          });
        }
      ),
      { numRuns: 100 } // 运行 100 次迭代
    );
  });

  /**
   * 属性 10 的补充测试：多次更新同一任务不影响其他任务
   */
  it('并发任务进度独立性：多次更新同一任务不影响其他任务', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            url: fc.webUrl(),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            formatId: fc.string({ minLength: 1, maxLength: 20 }),
            savePath: fc.string({ minLength: 1, maxLength: 200 }),
            status: fc.constantFrom(TaskStatus.Downloading),
            createdAt: fc.integer({ min: 0, max: Date.now() }),
          }),
          { minLength: 3, maxLength: 5 }
        ),
        // 生成多次进度更新
        fc.array(
          fc.record({
            percent: fc.float({ min: 0, max: 100, noNaN: true }),
            speed: fc.string({ minLength: 1, maxLength: 20 }),
            downloaded: fc.string({ minLength: 1, maxLength: 20 }),
            total: fc.string({ minLength: 1, maxLength: 20 }),
            eta: fc.string({ minLength: 1, maxLength: 20 }),
          }),
          { minLength: 3, maxLength: 10 }
        ),
        (tasks, progressUpdates) => {
          // 重置 store 状态
          useDownloadStore.setState({
            currentVideoInfo: null,
            tasks: [],
            progressMap: new Map(),
            isLoadingVideoInfo: false,
            videoInfoError: null,
          });

          // 添加所有任务
          tasks.forEach((task) => {
            useDownloadStore.getState().addTask(task as DownloadTask);
          });

          // 为所有任务设置初始进度
          const initialProgressMap = new Map<string, ProgressData>();
          tasks.forEach((task) => {
            const progress: ProgressData = {
              taskId: task.id,
              percent: 10.0,
              speed: '1.0MB/s',
              downloaded: '10MB',
              total: '100MB',
              eta: '00:01:30',
            };
            useDownloadStore.getState().updateProgress(progress);
            initialProgressMap.set(task.id, progress);
          });

          // 选择第一个任务进行多次更新
          const targetTask = tasks[0];

          // 多次更新目标任务的进度
          progressUpdates.forEach((update) => {
            const newProgress: ProgressData = {
              taskId: targetTask.id,
              ...update,
            };
            useDownloadStore.getState().updateProgress(newProgress);
          });

          // 验证其他任务的进度保持不变
          tasks.slice(1).forEach((task) => {
            const otherProgress = useDownloadStore.getState().getProgress(task.id);
            const expectedProgress = initialProgressMap.get(task.id);
            
            expect(otherProgress).toEqual(expectedProgress);
          });

          // 验证目标任务的进度是最后一次更新的值
          const finalProgress = useDownloadStore.getState().getProgress(targetTask.id);
          const lastUpdate = progressUpdates[progressUpdates.length - 1];
          expect(finalProgress?.taskId).toBe(targetTask.id);
          expect(finalProgress?.percent).toBe(lastUpdate.percent);
          expect(finalProgress?.speed).toBe(lastUpdate.speed);
          expect(finalProgress?.downloaded).toBe(lastUpdate.downloaded);
          expect(finalProgress?.total).toBe(lastUpdate.total);
          expect(finalProgress?.eta).toBe(lastUpdate.eta);
        }
      ),
      { numRuns: 100 } // 运行 100 次迭代
    );
  });
});
