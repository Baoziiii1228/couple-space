
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft, Moon, Sun } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";

interface PageLayoutProps {
  title: string;
  children: React.ReactNode;
  showBack?: boolean;
  backPath?: string;
}

export default function PageLayout({ title, children, showBack = true, backPath = "/dashboard" }: PageLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background gradient-warm-subtle">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/20 dark:border-white/10">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            {showBack && (
              <Button variant="ghost" size="icon" onClick={() => setLocation(backPath)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <span className="font-semibold text-foreground">{title}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <Heart className="w-4 h-4 text-primary" fill="currentColor" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-6">
        {children}
      </main>
    </div>
  );
}
