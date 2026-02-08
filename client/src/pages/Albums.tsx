import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Image, X, Upload, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState, useRef } from "react";
import { compressImage, validateFileType, validateFileSize, formatFileSize } from "@/lib/imageCompression";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

export default function Albums() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newAlbum, setNewAlbum] = useState({ name: "", description: "" });
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { data: albums, refetch: refetchAlbums } = trpc.album.list.useQuery();
  const { data: photos, refetch: refetchPhotos } = trpc.photo.list.useQuery({});

  const createAlbum = trpc.album.create.useMutation({
    onSuccess: () => {
      toast.success("相册创建成功！");
      setIsCreateOpen(false);
      setNewAlbum({ name: "", description: "" });
      refetchAlbums();
    },
    onError: (err) => toast.error(err.message),
  });

  const uploadPhoto = trpc.photo.upload.useMutation({
    onSuccess: () => {
      refetchPhotos();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreateAlbum = () => {
    if (!newAlbum.name.trim()) {
      toast.error("请输入相册名称");
      return;
    }
    createAlbum.mutate(newAlbum);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // 检查文件类型
      if (!validateFileType(file)) {
        toast.error(`${file.name} 不是支持的图片格式`);
        failCount++;
        continue;
      }

      // 检查文件大小（限制 10MB）
      if (!validateFileSize(file, 10)) {
        toast.error(`${file.name} 超过 10MB 限制`);
        failCount++;
        continue;
      }

      try {
        // 压缩图片
        const originalSize = formatFileSize(file.size);
        const compressedFile = await compressImage(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
        });
        const compressedSize = formatFileSize(compressedFile.size);
        
        if (compressedFile.size < file.size) {
          const ratio = ((1 - compressedFile.size / file.size) * 100).toFixed(1);
          console.log(`${file.name}: ${originalSize} → ${compressedSize} (减少 ${ratio}%)`);
        }
        
        // 转换为 base64
        const base64 = await fileToBase64(compressedFile);
        
        await uploadPhoto.mutateAsync({
          fileName: file.name,
          fileData: base64,
          contentType: file.type,
        });
        successCount++;
      } catch (err) {
        failCount++;
      }
    }

    setIsUploading(false);
    
    if (successCount > 0) {
      toast.success(`成功上传 ${successCount} 张照片`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} 张照片上传失败`);
    }

    // 清空 input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // 移除 data:image/xxx;base64, 前缀
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="min-h-screen bg-background gradient-warm-subtle">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/20 dark:border-white/10">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-semibold">情侣相册</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 bg-white/50 dark:bg-white/10"
              onClick={handleUploadClick}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isUploading ? "上传中..." : "上传照片"}
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="w-4 h-4" />
                  新建相册
                </Button>
              </DialogTrigger>
              <DialogContent className="dark:bg-gray-900 dark:border-gray-700">
                <DialogHeader>
                  <DialogTitle>新建相册</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>相册名称</Label>
                    <Input
                      placeholder="例如：我们的旅行"
                      value={newAlbum.name}
                      onChange={(e) => setNewAlbum({ ...newAlbum, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>描述（可选）</Label>
                    <Textarea
                      placeholder="记录这个相册的故事..."
                      value={newAlbum.description}
                      onChange={(e) => setNewAlbum({ ...newAlbum, description: e.target.value })}
                    />
                  </div>
                  <Button className="w-full" onClick={handleCreateAlbum} disabled={createAlbum.isPending}>
                    {createAlbum.isPending ? "创建中..." : "创建相册"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* 相册列表 */}
        {albums && albums.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 dark:text-white">我的相册</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {albums.map((album) => (
                <Card key={album.id} className="card-hover glass border-white/40 dark:border-white/20 overflow-hidden cursor-pointer">
                  <div className="aspect-square bg-secondary/50 dark:bg-secondary/30 flex items-center justify-center">
                    {album.coverUrl ? (
                      <img src={album.coverUrl} alt={album.name} className="w-full h-full object-cover" />
                    ) : (
                      <Image className="w-12 h-12 text-muted-foreground/50" />
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium truncate dark:text-white">{album.name}</h3>
                    {album.description && (
                      <p className="text-sm text-muted-foreground truncate">{album.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 所有照片 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold dark:text-white">所有照片</h2>
            <span className="text-sm text-muted-foreground">
              {photos ? `${photos.length} 张照片` : "加载中..."}
            </span>
          </div>
          
          {photos && photos.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedPhoto(photo.url)}
                >
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <Card className="glass border-white/40 dark:border-white/20">
              <CardContent className="p-12 text-center">
                <Image className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">还没有照片，上传第一张吧</p>
                <Button className="gap-2" onClick={handleUploadClick} disabled={isUploading}>
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  上传照片
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* 照片预览 */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20 dark:hover:bg-white/10"
            onClick={() => setSelectedPhoto(null)}
          >
            <X className="w-6 h-6" />
          </Button>
          <img 
            src={selectedPhoto} 
            alt="" 
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
