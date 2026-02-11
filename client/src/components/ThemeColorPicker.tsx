import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Palette } from "lucide-react";
import { Label } from "./ui/label";

const THEME_COLORS = [
  { name: "玫瑰粉", primary: "#f43f5e", accent: "#fb7185" },
  { name: "橙色", primary: "#f97316", accent: "#fb923c" },
  { name: "琥珀色", primary: "#f59e0b", accent: "#fbbf24" },
  { name: "翡翠绿", primary: "#10b981", accent: "#34d399" },
  { name: "天蓝色", primary: "#3b82f6", accent: "#60a5fa" },
  { name: "紫色", primary: "#a855f7", accent: "#c084fc" },
  { name: "粉紫色", primary: "#d946ef", accent: "#e879f9" },
  { name: "青色", primary: "#06b6d4", accent: "#22d3ee" },
];

export function ThemeColorPicker() {
  const [selectedColor, setSelectedColor] = useState(() => {
    const stored = localStorage.getItem("themeColor");
    return stored || THEME_COLORS[0].name;
  });

  useEffect(() => {
    const color = THEME_COLORS.find(c => c.name === selectedColor);
    if (color) {
      document.documentElement.style.setProperty("--color-primary", color.primary);
      document.documentElement.style.setProperty("--color-accent", color.accent);
      localStorage.setItem("themeColor", selectedColor);
    }
  }, [selectedColor]);

  return (
    <Card className="rounded-2xl border-0 glass-ios dark:bg-slate-800/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-slate-200">
          <Palette className="w-5 h-5" />
          主题颜色
        </CardTitle>
        <CardDescription className="dark:text-slate-400">
          选择你喜欢的主题颜色
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3">
          {THEME_COLORS.map((color) => (
            <button
              key={color.name}
              onClick={() => setSelectedColor(color.name)}
              className={`group relative aspect-square rounded-xl transition-all ${
                selectedColor === color.name
                  ? "ring-2 ring-offset-2 ring-offset-background scale-105"
                  : "hover:scale-105"
              }`}
              style={{
                background: `linear-gradient(135deg, ${color.primary}, ${color.accent})`,
                ...(selectedColor === color.name && {
                  borderColor: color.primary,
                }),
              }}
            >
              {selectedColor === color.name && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-gray-900"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              )}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Label className="text-xs whitespace-nowrap dark:text-slate-300">{color.name}</Label>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
