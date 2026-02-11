import { Card, CardContent } from "./ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

interface StatsCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
  delay?: number;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    label: string;
  };
}

export function StatsCard({ icon: Icon, title, value, subtitle, color, delay = 0, trend }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card className="glass hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{title}</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{value}</p>
                {trend && trend.direction !== 'neutral' && (
                  <div className={`flex items-center gap-0.5 text-xs ${
                    trend.direction === 'up' 
                      ? 'text-green-500 dark:text-green-400' 
                      : 'text-red-500 dark:text-red-400'
                  }`}>
                    {trend.direction === 'up' ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>{trend.label}</span>
                  </div>
                )}
              </div>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
