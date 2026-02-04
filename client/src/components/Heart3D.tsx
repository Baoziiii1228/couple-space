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
        scale: [1, 1.08, 1],
      } : undefined}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {/* 外层光晕 */}
      <div 
        className="absolute inset-0 rounded-full blur-xl opacity-40"
        style={{
          background: "radial-gradient(circle, rgba(255, 120, 120, 0.6) 0%, transparent 70%)",
          transform: "scale(1.5)",
        }}
      />
      
      {/* 主体爱心 SVG */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-full h-full"
        style={{
          filter: "drop-shadow(0 4px 12px rgba(220, 80, 80, 0.5)) drop-shadow(0 2px 4px rgba(180, 60, 60, 0.3))",
        }}
      >
        <defs>
          {/* 主渐变 */}
          <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF8A8A" />
            <stop offset="30%" stopColor="#E86B6B" />
            <stop offset="70%" stopColor="#D45555" />
            <stop offset="100%" stopColor="#C04040" />
          </linearGradient>
          
          {/* 高光渐变 */}
          <linearGradient id="heartHighlight" x1="0%" y1="0%" x2="50%" y2="50%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.6)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </linearGradient>
          
          {/* 内阴影 */}
          <radialGradient id="heartInnerShadow" cx="70%" cy="70%" r="50%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0.15)" />
          </radialGradient>
        </defs>
        
        {/* 爱心主体 */}
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill="url(#heartGradient)"
        />
        
        {/* 高光层 */}
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill="url(#heartHighlight)"
          style={{ clipPath: "inset(0 50% 50% 0)" }}
        />
        
        {/* 小高光点 */}
        <ellipse
          cx="7.5"
          cy="7"
          rx="2"
          ry="1.5"
          fill="rgba(255, 255, 255, 0.5)"
          transform="rotate(-30 7.5 7)"
        />
        
        {/* 内阴影 */}
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill="url(#heartInnerShadow)"
        />
      </svg>
    </motion.div>
  );
}
