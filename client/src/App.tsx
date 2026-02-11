import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";

// 首页和登录页立即加载（关键路径）
import Home from "./pages/Home";
import Login from "./pages/Login";

// 其他页面懒加载
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Albums = lazy(() => import("./pages/Albums"));
const Diary = lazy(() => import("./pages/Diary"));
const Anniversary = lazy(() => import("./pages/Anniversary"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Messages = lazy(() => import("./pages/Messages"));
const Mood = lazy(() => import("./pages/Mood"));
const Wishes = lazy(() => import("./pages/Wishes"));
const TimeCapsule = lazy(() => import("./pages/TimeCapsule"));
const Footprints = lazy(() => import("./pages/Footprints"));
const TodoList = lazy(() => import("./pages/TodoList"));
const Pair = lazy(() => import("./pages/Pair"));
const Settings = lazy(() => import("./pages/Settings"));
const Timeline = lazy(() => import("./pages/Timeline"));
const Achievements = lazy(() => import("./pages/Achievements"));
const HundredThings = lazy(() => import("./pages/HundredThings"));
const Ledger = lazy(() => import("./pages/Ledger"));
const Countdown = lazy(() => import("./pages/Countdown"));
const Promises = lazy(() => import("./pages/Promises"));
const PeriodTracker = lazy(() => import("./pages/PeriodTracker"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading 组件
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4"></div>
        <p className="text-gray-600">加载中...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/pair" component={Pair} />
        <Route path="/albums" component={Albums} />
        <Route path="/diary" component={Diary} />
        <Route path="/anniversary" component={Anniversary} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/messages" component={Messages} />
        <Route path="/mood" component={Mood} />
        <Route path="/wishes" component={Wishes} />
        <Route path="/time-capsule" component={TimeCapsule} />
        <Route path="/footprints" component={Footprints} />
        <Route path="/todo-list" component={TodoList} />
        <Route path="/settings" component={Settings} />
        <Route path="/timeline" component={Timeline} />
        <Route path="/achievements" component={Achievements} />
        <Route path="/hundred-things" component={HundredThings} />
        <Route path="/ledger" component={Ledger} />
        <Route path="/countdown" component={Countdown} />
        <Route path="/promises" component={Promises} />
        <Route path="/period-tracker" component={PeriodTracker} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
          <PWAInstallPrompt />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
