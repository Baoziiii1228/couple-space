import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const romanticTexts = [
  "遇见你是最美的意外",
  "余生请多指教",
  "你是我的小确幸",
  "想和你一起看日出日落",
  "有你的地方就是家",
  "我的眼里只有你",
  "愿得一人心，白首不分离",
  "你是我的诗和远方",
  "陪你走过春夏秋冬",
  "最好的时光是与你相伴",
  "你的笑容是我的阳光",
  "一起慢慢变老",
  "每天都想见到你",
  "你是我最甜蜜的负担",
  "爱你是我做过最好的事",
  "想牵着你的手去旅行",
  "你是我的今天和明天",
  "有你在身边真好",
  "我们的故事才刚刚开始",
  "你是我心中的唯一",
  "世界很大，幸好有你",
  "和你在一起的每一秒都值得珍藏",
  "你是我见过最美的风景",
  "我想把所有温柔都给你",
  "遇见你之后，生活好甜",
  "你是我最想留住的幸运",
  "想和你一起数星星",
  "你是我平淡日子里的星辰",
  "我的世界因你而完整",
  "想和你分享每一个日落",
];

interface FloatingItem {
  id: number;
  text: string;
  x: number;
  y: number;
  duration: number;
}

// 预定义的位置区域（避开中心区域）
const positionZones = [
  // 左上
  { xMin: 3, xMax: 18, yMin: 8, yMax: 25 },
  // 右上
  { xMin: 72, xMax: 92, yMin: 8, yMax: 25 },
  // 左中偏上
  { xMin: 2, xMax: 15, yMin: 28, yMax: 38 },
  // 右中偏上
  { xMin: 78, xMax: 95, yMin: 28, yMax: 38 },
  // 左中偏下
  { xMin: 4, xMax: 16, yMin: 62, yMax: 72 },
  // 右中偏下
  { xMin: 76, xMax: 93, yMin: 62, yMax: 72 },
  // 左下
  { xMin: 6, xMax: 20, yMin: 75, yMax: 88 },
  // 右下
  { xMin: 70, xMax: 90, yMin: 75, yMax: 88 },
];

interface FloatingTextsProps {
  isDark?: boolean;
}

export default function FloatingTexts({ isDark = false }: FloatingTextsProps) {
  const [items, setItems] = useState<FloatingItem[]>([]);
  const counterRef = useRef(0);
  const usedIndicesRef = useRef<number[]>([]);
  const lastZoneRef = useRef(-1);

  const getRandomText = useCallback(() => {
    if (usedIndicesRef.current.length >= romanticTexts.length - 2) {
      usedIndicesRef.current = [];
    }
    let idx: number;
    do {
      idx = Math.floor(Math.random() * romanticTexts.length);
    } while (usedIndicesRef.current.indexOf(idx) !== -1);
    usedIndicesRef.current.push(idx);
    return romanticTexts[idx];
  }, []);

  const getRandomPosition = useCallback(() => {
    let zoneIdx: number;
    do {
      zoneIdx = Math.floor(Math.random() * positionZones.length);
    } while (zoneIdx === lastZoneRef.current);
    lastZoneRef.current = zoneIdx;
    const zone = positionZones[zoneIdx];
    return {
      x: zone.xMin + Math.random() * (zone.xMax - zone.xMin),
      y: zone.yMin + Math.random() * (zone.yMax - zone.yMin),
    };
  }, []);

  const spawnItem = useCallback(() => {
    const pos = getRandomPosition();
    const newItem: FloatingItem = {
      id: counterRef.current++,
      text: getRandomText(),
      x: pos.x,
      y: pos.y,
      duration: 3 + Math.random() * 1.5,
    };
    setItems((prev) => {
      const next = prev.length >= 5 ? prev.slice(1) : prev;
      return [...next, newItem];
    });
  }, [getRandomPosition, getRandomText]);

  useEffect(() => {
    // 初始延迟后开始
    const t1 = setTimeout(() => spawnItem(), 500);
    const t2 = setTimeout(() => spawnItem(), 1500);
    const t3 = setTimeout(() => spawnItem(), 2500);

    // 每2.5秒产生新句子（在上一个渐隐到约90%时）
    const interval = setInterval(() => {
      spawnItem();
    }, 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearInterval(interval);
    };
  }, [spawnItem]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[5]">
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <motion.div
            key={item.id}
            className="absolute"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
            }}
            initial={{ opacity: 0, scale: 0.85, y: 12 }}
            animate={{ opacity: [0, 0.7, 0.7, 0], scale: [0.85, 1, 1, 0.9], y: [12, 0, 0, -8] }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{
              duration: item.duration,
              times: [0, 0.1, 0.85, 1],
              ease: "easeInOut",
            }}
          >
            <p
              className={`font-tech-light text-base md:text-xl whitespace-nowrap select-none ${
                isDark ? "text-amber-300/60" : "text-rose-400/50"
              }`}
              style={{
                textShadow: isDark
                  ? "0 0 15px rgba(251, 191, 36, 0.2)"
                  : "0 0 15px rgba(244, 63, 94, 0.15)",
              }}
            >
              {item.text}
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
