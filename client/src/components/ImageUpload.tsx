import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { compressImage, validateFileType, validateFileSize, formatFileSize } from '@/lib/imageCompression';

interface ImageUploadProps {
  onUpload: (file: File) => void | Promise<void>;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  allowedTypes?: string[];
  buttonText?: string;
  className?: string;
  multiple?: boolean;
}

export default function ImageUpload({
  onUpload,
  maxSizeMB = 10,
  maxWidthOrHeight = 1920,
  allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
  buttonText = '选择图片',
  className = '',
  multiple = false,
}: ImageUploadProps) {
  const [isCompressing, setIsCompressing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0]; // 目前只处理单个文件

    // 验证文件类型
    if (!validateFileType(file, allowedTypes)) {
      toast.error('不支持的文件类型，请选择 JPG、PNG 或 WebP 格式的图片');
      return;
    }

    // 验证文件大小
    if (!validateFileSize(file, maxSizeMB)) {
      toast.error(`文件大小不能超过 ${maxSizeMB}MB`);
      return;
    }

    try {
      setIsCompressing(true);
      
      // 显示原始文件信息
      const originalSize = formatFileSize(file.size);
      toast.info(`原始大小: ${originalSize}，正在压缩...`);

      // 压缩图片
      const compressedFile = await compressImage(file, {
        maxSizeMB: 1,
        maxWidthOrHeight,
      });

      const compressedSize = formatFileSize(compressedFile.size);
      const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(1);
      
      if (compressedFile.size < file.size) {
        toast.success(`压缩完成！压缩后: ${compressedSize} (减少 ${compressionRatio}%)`);
      } else {
        toast.success(`图片已优化，大小: ${compressedSize}`);
      }

      // 生成预览
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(compressedFile);

      // 调用上传回调
      await onUpload(compressedFile);
      
    } catch (error) {
      console.error('图片处理失败:', error);
      toast.error(error instanceof Error ? error.message : '图片处理失败');
    } finally {
      setIsCompressing(false);
      // 重置 input，允许重新选择相同文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const clearPreview = () => {
    setPreview(null);
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(',')}
        onChange={handleFileSelect}
        multiple={multiple}
        className="hidden"
      />

      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="max-w-xs max-h-48 rounded-lg border"
          />
          <Button
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={clearPreview}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isCompressing}
          className="bg-gradient-to-r from-pink-500 to-purple-500"
        >
          {isCompressing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              压缩中...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {buttonText}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
