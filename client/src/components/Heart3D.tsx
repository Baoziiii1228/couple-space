import { motion } from "framer-motion";

interface Heart3DProps {
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { width: 32, height: 32 },
  md: { width: 48, height: 48 },
  lg: { width: 64, height: 64 },
  xl: { width: 80, height: 80 },
};

export default function Heart3D({ size = "md", animate = true, className = "" }: Heart3DProps) {
  const { width, height } = sizeMap[size];

  return (
    <motion.div
      className={`relative ${className}`}
      style={{ width, height }}
      animate={animate ? {
        scale: [1, 1.05, 1],
      } : undefined}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {/* 简约高级爱心 SVG - Apple风格 */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        style={{
          filter: "drop-shadow(0 2px 8px rgba(180, 80, 80, 0.25))",
        }}
      >
        <defs>
          {/* 简约渐变 - 更柔和的色调 */}
          <linearGradient id="heartGradientSimple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E8A0A0" />
            <stop offset="100%" stopColor="#D07070" />
          </linearGradient>
        </defs>
        
        {/* 爱心主体 - 简洁填充 */}
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill="url(#heartGradientSimple)"
        />
      </svg>
    </motion.div>
  );
}
