import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Image, X, Upload } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function Albums() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newAlbum, setNewAlbum] = useState({ name: "", description: "" });
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

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

  const handleCreateAlbum = () => {
    if (!newAlbum.name.trim()) {
      toast.error("请输入相册名称");
      return;
    }
    createAlbum.mutate(newAlbum);
  };

  return (
    <div className="min-h-screen gradient-warm-subtle">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/20">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-semibold">情侣相册</h1>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="w-4 h-4" />
                新建相册
              </Button>
            </DialogTrigger>
            <DialogContent>
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
      </header>

      <main className="container py-6 space-y-6">
        {/* 相册列表 */}
        {albums && albums.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">我的相册</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {albums.map((album) => (
                <Card key={album.id} className="card-hover glass border-white/40 overflow-hidden cursor-pointer">
                  <div className="aspect-square bg-secondary/50 flex items-center justify-center">
                    {album.coverUrl ? (
                      <img src={album.coverUrl} alt={album.name} className="w-full h-full object-cover" />
                    ) : (
                      <Image className="w-12 h-12 text-muted-foreground/50" />
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium truncate">{album.name}</h3>
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
            <h2 className="text-lg font-semibold">所有照片</h2>
            <Button variant="outline" size="sm" className="gap-1">
              <Upload className="w-4 h-4" />
              上传照片
            </Button>
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
            <Card className="glass border-white/40">
              <CardContent className="p-12 text-center">
                <Image className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">还没有照片，上传第一张吧</p>
                <Button className="gap-2">
                  <Upload className="w-4 h-4" />
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
            className="absolute top-4 right-4 text-white hover:bg-white/20"
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
