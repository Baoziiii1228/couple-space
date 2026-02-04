import { useState, useEffect, useCallback } from "react";
import { Heart, Lock, Unlock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface ScreenLockProps {
  togetherDate: Date | null;
  photos: string[];
  idleTimeout?: number; // 闲置多久后锁屏（毫秒）
  onUnlock?: () => void;
}

export default function ScreenLock({ 
  togetherDate, 
  photos, 
  idleTimeout = 60000, // 默认60秒
  onUnlock 
}: ScreenLockProps) {
  const [isLocked, setIsLocked] = useState(false);
  const [inputDate, setInputDate] = useState("");
  const [error, setError] = useState("");
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showUnlockHint, setShowUnlockHint] = useState(false);

  // 监听用户活动
  const resetIdleTimer = useCallback(() => {
    if (isLocked) return;
  }, [isLocked]);

  useEffect(() => {
    if (!togetherDate) return;

    let idleTimer: ReturnType<typeof setTimeout>;

    const startIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setIsLocked(true);
      }, idleTimeout);
    };

    const handleActivity = () => {
      if (!isLocked) {
        startIdleTimer();
      }
    };

    // 监听各种用户活动
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    startIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [togetherDate, idleTimeout, isLocked]);

  // 照片轮播
  useEffect(() => {
    if (!isLocked || photos.length === 0) return;

    const interval = setInterval(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    }, 4000); // 每4秒切换一张

    return () => clearInterval(interval);
  }, [isLocked, photos.length]);

  // 验证日期
  const handleUnlock = () => {
    if (!togetherDate) return;

    const inputParts = inputDate.split(/[-\/\.]/);
    if (inputParts.length < 2) {
      setError("请输入正确的日期格式");
      return;
    }

    const targetMonth = togetherDate.getMonth() + 1;
    const targetDay = togetherDate.getDate();

    // 支持多种格式：MM-DD, MM/DD, M-D, M/D
    const inputMonth = parseInt(inputParts[0], 10);
    const inputDay = parseInt(inputParts[1], 10);

    if (inputMonth === targetMonth && inputDay === targetDay) {
      setIsLocked(false);
      setInputDate("");
      setError("");
      onUnlock?.();
    } else {
      setError("日期不对哦，再想想~");
      setInputDate("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleUnlock();
    }
  };

  if (!isLocked) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center"
        onClick={() => setShowUnlockHint(true)}
      >
        {/* 照片轮播背景 */}
        {photos.length > 0 && (
          <div className="absolute inset-0 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPhotoIndex}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 0.4, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 1.5 }}
                className="absolute inset-0"
              >
                <img
                  src={photos[currentPhotoIndex]}
                  alt=""
                  className="w-full h-full object-cover blur-sm"
                />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60" />
          </div>
        )}

        {/* 中心照片展示 */}
        {photos.length > 0 && (
          <motion.div
            key={`center-${currentPhotoIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 mb-8"
          >
            <div className="w-64 h-64 md:w-80 md:h-80 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20">
              <img
                src={photos[currentPhotoIndex]}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" fill="currentColor" />
            </div>
          </motion.div>
        )}

        {/* 无照片时的默认显示 */}
        {photos.length === 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-8"
          >
            <Heart className="w-24 h-24 text-primary animate-heartbeat" fill="currentColor" />
          </motion.div>
        )}

        {/* 解锁提示 */}
        <AnimatePresence>
          {showUnlockHint && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative z-10 glass rounded-2xl p-6 max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-4 justify-center">
                <Lock className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-white">输入我们在一起的日期</h3>
              </div>
              
              <p className="text-sm text-white/70 text-center mb-4">
                格式：月-日（例如：02-14）
              </p>

              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="MM-DD"
                  value={inputDate}
                  onChange={(e) => {
                    setInputDate(e.target.value);
                    setError("");
                  }}
                  onKeyDown={handleKeyDown}
                  className="text-center text-lg bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  autoFocus
                />
                
                {error && (
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm text-red-400 text-center"
                  >
                    {error}
                  </motion.p>
                )}

                <Button 
                  onClick={handleUnlock}
                  className="w-full gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  解锁
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 点击提示 */}
        {!showUnlockHint && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-12 text-white/50 text-sm"
          >
            点击屏幕解锁
          </motion.p>
        )}

        {/* 照片指示器 */}
        {photos.length > 1 && (
          <div className="absolute bottom-6 flex gap-1.5">
            {photos.slice(0, Math.min(photos.length, 10)).map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentPhotoIndex % 10 ? "bg-white w-4" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
