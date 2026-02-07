/**
 * 云存储抽象层
 * 支持多种存储后端：阿里云 OSS、腾讯云 COS、Manus 内置存储
 * 通过环境变量 STORAGE_PROVIDER 切换（默认使用 manus 内置存储）
 */

import { ENV } from './_core/env';
import { storagePut, storageGet } from './storage';

export type StorageProvider = 'aliyun-oss' | 'tencent-cos' | 'manus';

export interface UploadResult {
  key: string;
  url: string;
}

function getProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER || 'manus';
  return provider as StorageProvider;
}

/**
 * 阿里云 OSS 上传
 */
async function uploadToAliyunOSS(
  key: string,
  data: Buffer,
  contentType: string
): Promise<UploadResult> {
  // 动态导入 ali-oss SDK（需要先安装：pnpm add ali-oss）
  try {
    // @ts-ignore - ali-oss 按需安装
    const OSS = (await import('ali-oss')).default;
    const client = new OSS({
      region: process.env.OSS_REGION || 'oss-cn-hangzhou',
      accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
      bucket: process.env.OSS_BUCKET || '',
    });

    const result = await client.put(key, data, {
      headers: { 'Content-Type': contentType },
    });

    return {
      key,
      url: result.url,
    };
  } catch (error) {
    console.error('[Storage] Aliyun OSS upload failed:', error);
    throw new Error('阿里云 OSS 上传失败');
  }
}

/**
 * 腾讯云 COS 上传
 */
async function uploadToTencentCOS(
  key: string,
  data: Buffer,
  contentType: string
): Promise<UploadResult> {
  try {
    // @ts-ignore - cos-nodejs-sdk-v5 按需安装
    const COS = (await import('cos-nodejs-sdk-v5')).default;
    const cos = new COS({
      SecretId: process.env.COS_SECRET_ID || '',
      SecretKey: process.env.COS_SECRET_KEY || '',
    });

    const bucket = process.env.COS_BUCKET || '';
    const region = process.env.COS_REGION || 'ap-guangzhou';

    return new Promise((resolve, reject) => {
      cos.putObject(
        {
          Bucket: bucket,
          Region: region,
          Key: key,
          Body: data,
          ContentType: contentType,
        },
        (err: any, result: any) => {
          if (err) {
            console.error('[Storage] Tencent COS upload failed:', err);
            reject(new Error('腾讯云 COS 上传失败'));
          } else {
            const url = `https://${bucket}.cos.${region}.myqcloud.com/${key}`;
            resolve({ key, url });
          }
        }
      );
    });
  } catch (error) {
    console.error('[Storage] Tencent COS upload failed:', error);
    throw new Error('腾讯云 COS 上传失败');
  }
}

/**
 * Manus 内置存储上传
 */
async function uploadToManus(
  key: string,
  data: Buffer,
  contentType: string
): Promise<UploadResult> {
  return storagePut(key, data, contentType);
}

/**
 * 统一上传接口
 */
export async function uploadFile(
  key: string,
  data: Buffer,
  contentType: string
): Promise<UploadResult> {
  const provider = getProvider();

  switch (provider) {
    case 'aliyun-oss':
      return uploadToAliyunOSS(key, data, contentType);
    case 'tencent-cos':
      return uploadToTencentCOS(key, data, contentType);
    case 'manus':
    default:
      return uploadToManus(key, data, contentType);
  }
}

/**
 * 统一获取文件 URL
 */
export async function getFileUrl(key: string): Promise<string> {
  const provider = getProvider();

  switch (provider) {
    case 'aliyun-oss': {
      const bucket = process.env.OSS_BUCKET || '';
      const region = process.env.OSS_REGION || 'oss-cn-hangzhou';
      return `https://${bucket}.${region}.aliyuncs.com/${key}`;
    }
    case 'tencent-cos': {
      const bucket = process.env.COS_BUCKET || '';
      const region = process.env.COS_REGION || 'ap-guangzhou';
      return `https://${bucket}.cos.${region}.myqcloud.com/${key}`;
    }
    case 'manus':
    default: {
      const result = await storageGet(key);
      return result.url;
    }
  }
}

/**
 * 获取当前存储配置信息（用于调试）
 */
export function getStorageInfo(): { provider: StorageProvider; configured: boolean } {
  const provider = getProvider();
  let configured = false;

  switch (provider) {
    case 'aliyun-oss':
      configured = !!(process.env.OSS_ACCESS_KEY_ID && process.env.OSS_ACCESS_KEY_SECRET && process.env.OSS_BUCKET);
      break;
    case 'tencent-cos':
      configured = !!(process.env.COS_SECRET_ID && process.env.COS_SECRET_KEY && process.env.COS_BUCKET);
      break;
    case 'manus':
      configured = !!(ENV.forgeApiUrl && ENV.forgeApiKey);
      break;
  }

  return { provider, configured };
}
