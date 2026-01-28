import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UrlInput } from './UrlInput';
import { ResolutionSelect } from './ResolutionSelect';
import { PathSelector } from './PathSelector';
import { useDownloadStore } from '@/store/downloadStore';
import { useConfigStore } from '@/store/configStore';
import { videoApi } from '@/services/tauriApi';
import { TaskStatus } from '@/types';
import logger from '@/utils/logger';

/**
 * 下载表单容器组件
 * 
 * 功能：
 * - 集成 UrlInput、ResolutionSelect、PathSelector 子组件
 * - 实现表单提交逻辑
 * - 调用 get_video_info 获取视频信息
 * - 调用 download_video 开始下载
 * - 显示加载状态和错误信息
 * 
 * 需求：1.1, 1.2, 1.3, 2.1, 3.1, 4.1
 */
export function DownloadForm() {
  // 状态管理
  const {
    currentVideoInfo,
    isLoadingVideoInfo,
    videoInfoError,
    setCurrentVideoInfo,
    setLoadingVideoInfo,
    setVideoInfoError,
    addTask,
    clearCurrentVideoInfo,
  } = useDownloadStore();

  const { config, loadConfig } = useConfigStore();

  // 本地状态
  const [currentUrl, setCurrentUrl] = useState('');
  const [selectedFormatId, setSelectedFormatId] = useState('');
  const [savePath, setSavePath] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  /**
   * 初始化：加载配置
   */
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  /**
   * 当配置加载完成后，设置默认保存路径
   */
  useEffect(() => {
    if (config.savePath && !savePath) {
      setSavePath(config.savePath);
    }
  }, [config.savePath]);

  /**
   * 处理 URL 提交
   * 需求 1.1：用户输入视频链接后获取视频信息
   * 需求 1.2：调用 yt-dlp 获取视频元数据
   * 需求 1.3：解析并提取所有可用的分辨率选项
   */
  const handleUrlSubmit = async (url: string) => {
    // 清除之前的状态
    clearCurrentVideoInfo();
    setCurrentUrl(url);
    setSelectedFormatId('');
    setDownloadError(null);

    // 设置加载状态
    setLoadingVideoInfo(true);

    try {
      // 调用后端获取视频信息
      const videoInfo = await videoApi.getVideoInfo(url);
      
      // 设置视频信息到 store
      setCurrentVideoInfo(videoInfo);
      logger.info('视频信息获取成功', { title: videoInfo.title, url });
    } catch (error) {
      // 需求 1.4：处理不支持的网站或无效链接
      const errorMessage = error instanceof Error 
        ? error.message 
        : '获取视频信息失败，请检查链接是否正确';
      
      setVideoInfoError(errorMessage);
      logger.warn('视频信息获取失败', { url, error });
    } finally {
      // 无论成功或失败，都要重置加载状态
      setLoadingVideoInfo(false);
    }
  };

  /**
   * 处理下载按钮点击
   * 需求 3.1：使用选定的分辨率和保存路径启动下载
   */
  const handleDownload = async () => {
    // 验证必要参数
    if (!currentUrl) {
      setDownloadError('请先输入视频链接');
      return;
    }

    if (!selectedFormatId) {
      setDownloadError('请选择分辨率');
      return;
    }

    if (!savePath || !savePath.trim()) {
      setDownloadError('请选择保存位置');
      return;
    }

    // 清除之前的错误
    setDownloadError(null);
    setIsDownloading(true);

    try {
      // 调用后端开始下载
      const taskId = await videoApi.downloadVideo(currentUrl, selectedFormatId, savePath);
      
      logger.info('下载任务已创建', { taskId, url: currentUrl });

      // 添加任务到 store
      if (currentVideoInfo) {
        addTask({
          id: taskId,
          url: currentUrl,
          title: currentVideoInfo.title,
          formatId: selectedFormatId,
          savePath: savePath,
          status: TaskStatus.Pending,
          createdAt: Date.now(),
        });
      }

      // 下载任务创建成功后，清除当前视频信息，允许用户下载新视频
      clearCurrentVideoInfo();
      setCurrentUrl('');
      setSelectedFormatId('');
      
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : '启动下载失败';
      
      setDownloadError(errorMessage);
      logger.error('启动下载失败', error instanceof Error ? error : undefined);
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * 处理分辨率选择变化
   */
  const handleFormatChange = (formatId: string) => {
    setSelectedFormatId(formatId);
    setDownloadError(null);
  };

  /**
   * 处理保存路径变化
   */
  const handlePathChange = (path: string) => {
    setSavePath(path);
    setDownloadError(null);
  };

  /**
   * 检查是否可以开始下载
   */
  const canDownload = 
    currentVideoInfo !== null && 
    selectedFormatId !== '' && 
    savePath.trim() !== '' &&
    !isDownloading;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>视频下载</CardTitle>
        <CardDescription>
          支持 YouTube、Bilibili、Twitter 等 1000+ 视频网站
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* URL 输入 */}
        <div>
          <UrlInput
            onSubmit={handleUrlSubmit}
            isLoading={isLoadingVideoInfo}
            disabled={isDownloading}
          />
        </div>

        {/* 视频信息加载错误 */}
        {videoInfoError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{videoInfoError}</p>
          </div>
        )}

        {/* 视频信息显示 */}
        {currentVideoInfo && (
          <div className="space-y-4">
            {/* 视频基本信息 */}
            <div className="p-4 bg-muted rounded-md space-y-2">
              <div className="flex items-start gap-4">
                {currentVideoInfo.thumbnail && (
                  <img
                    src={currentVideoInfo.thumbnail}
                    alt={currentVideoInfo.title}
                    className="w-32 h-20 object-cover rounded"
                    onError={(e) => {
                      // 如果缩略图加载失败，隐藏图片
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm line-clamp-2">
                    {currentVideoInfo.title}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>上传者: {currentVideoInfo.uploader}</span>
                    <span>
                      时长: {Math.floor(currentVideoInfo.duration / 60)}:
                      {String(currentVideoInfo.duration % 60).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 分辨率选择 */}
            <div>
              <ResolutionSelect
                formats={currentVideoInfo.formats}
                value={selectedFormatId}
                onChange={handleFormatChange}
                disabled={isDownloading}
              />
            </div>

            {/* 保存路径选择 */}
            <div>
              <PathSelector
                value={savePath}
                onChange={handlePathChange}
                disabled={isDownloading}
              />
            </div>

            {/* 下载错误 */}
            {downloadError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{downloadError}</p>
              </div>
            )}

            {/* 下载按钮 */}
            <div className="flex justify-end">
              <Button
                onClick={handleDownload}
                disabled={!canDownload}
                className="min-w-[120px]"
                size="lg"
              >
                {isDownloading ? '启动中...' : '开始下载'}
              </Button>
            </div>
          </div>
        )}

        {/* 加载状态 */}
        {isLoadingVideoInfo && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">正在获取视频信息...</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
